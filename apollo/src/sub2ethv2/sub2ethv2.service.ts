import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { last } from 'lodash';
import { getUnixTime } from 'date-fns';
import { AggregationService } from '../aggregation/aggregation.service';
import { TasksService } from '../tasks/tasks.service';
import { TransferService } from './transfer.service';
import { TransferT1 } from '../base/TransferServiceT1';

enum RecordStatus {
  pending,
  pendingToRefund,
  pendingToClaim,
  success,
  refunded,
}

@Injectable()
export class Sub2ethv2Service implements OnModuleInit {
  private readonly logger = new Logger('sub2ethv2');
  protected fetchSendDataInterval = 30000;
  protected fetchHistoryDataFirst = 10;
  private readonly takeEachTime = 3;
  private skip = new Array(this.transferService.transfers.length).fill(0);

  private fetchCache = new Array(this.transferService.transfers.length)
    .fill('')
    .map((_) => ({ latestNonce: -1, isSyncingHistory: false }));

  constructor(
    public configService: ConfigService,
    private aggregationService: AggregationService,
    private taskService: TasksService,
    private transferService: TransferService
  ) {}

  async onModuleInit() {
    this.transferService.transfers.forEach((item, index) => {
      const prefix = `${item.source.chain}-${item.target.chain}`;
      this.taskService.addInterval(
        `${prefix}-sub2ethv2-fetch_history_data`,
        this.fetchSendDataInterval,
        async () => {
          if (this.fetchCache[index].isSyncingHistory) {
            return;
          }
          this.fetchCache[index].isSyncingHistory = true;
          // from source chain
          await this.fetchRecords(item, index);
          // from target chain
          await this.fetchStatus(item, index);
          this.fetchCache[index].isSyncingHistory = false;
        }
      );
    });
  }

  // two directions must use the same laneId
  protected genID(transfer: TransferT1, id: string) {
    return `${transfer.source.chain}2${transfer.target.chain}-sub2ethv2-${id}`;
  }

  private getMessageNonceFromId(id: string) {
    return id.substring(10, id.length + 1);
  }

  private toUnixTime(time: string) {
    const timezone = new Date().getTimezoneOffset() * 60;
    return getUnixTime(new Date(time)) - timezone;
  }

  async queryTransfer(transfer: TransferT1, srcTransferId: string) {
    const query = `query { transferRecord(id: "${srcTransferId}") {withdraw_timestamp, withdraw_transaction}}`;
    return await axios
      .post(transfer.source.url, {
        query: query,
        variables: null,
      })
      .then((res) => res.data?.data?.transferRecord);
  }

  async fetchRecords(transfer: TransferT1, index: number) {
    let latestNonce = this.fetchCache[index].latestNonce;
    const { source: from, target: to } = transfer;
    try {
      if (latestNonce === -1) {
        const firstRecord = await this.aggregationService.queryHistoryRecordFirst({
          fromChain: from.chain,
          toChain: to.chain,
          bridge: 'helix-sub2ethv2',
        });
        latestNonce = firstRecord ? Number(firstRecord.nonce) : 0;
      }

      const records = await axios
        .post(from.url, {
          query: this.transferService.getRecordQueryString(this.fetchHistoryDataFirst, latestNonce),
          variables: null,
        })
        .then((res) => res.data?.data?.transferRecords);

      if (records && records.length > 0) {
        for (const record of records) {
          await this.aggregationService.createHistoryRecord({
            id: this.genID(transfer, record.id),
            sendAmount: record.amount,
            recvAmount: record.amount,
            bridge: 'helix-sub2ethv2',
            reason: '',
            endTime: 0,
            fee: record.fee,
            feeToken: from.feeToken,
            fromChain: from.chain,
            messageNonce: record.id,
            nonce: latestNonce + 1,
            recipient: record.receiver,
            requestTxHash: record.transaction_hash,
            result: 0,
            sender: record.sender,
            startTime: Number(record.start_timestamp),
            responseTxHash: '',
            toChain: to.chain,
            sendToken: from.token,
            recvToken: to.token,
            sendTokenAddress: record.token,
            guardSignatures: '',
          });
          latestNonce += 1;
        }
        this.logger.log(
          `sub2eth v2 new records, from ${from.chain}, to ${to.chain}, latest nonce ${latestNonce}, added ${records.length}`
        );
      }
      this.fetchCache[index].latestNonce = latestNonce;
    } catch (error) {
      this.logger.warn(
        `sub2eth v2 fetch record failed, from ${from.chain}, to ${to.chain}, ${error}`
      );
    }
  }

  async fetchStatus(transfer: TransferT1, index: number) {
    const { source: from, target: to } = transfer;

    try {
      const uncheckedRecords = await this.aggregationService
        .queryHistoryRecords({
          skip: this.skip[index],
          take: this.takeEachTime,
          where: {
            fromChain: from.chain,
            toChain: to.chain,
            bridge: 'helix-sub2ethv2',
            responseTxHash: '',
          },
        })
        .then((result) => result.records);
      if (uncheckedRecords.length < this.takeEachTime) {
        this.skip[index] = 0;
      } else {
        this.skip[index] += this.takeEachTime;
      }
      const ids = uncheckedRecords
        .filter((item) => item.reason === '')
        .map((item) => `"${last(item.id.split('-'))}"`)
        .join(',');

      if (ids.length > 0) {
        const nodes = await axios
          .post(this.transferService.dispatchEndPoints[to.chain.split('-')[0]], {
            query: `query { messageDispatchedResults (where: {id_in: [${ids}]}) { id, transaction_hash, result, timestamp }}`,
            variables: null,
          })
          .then((res) => res.data?.data?.transferRecord);

        if (nodes && nodes.length > 0) {
          for (const node of nodes) {
            const responseTxHash = node.result ? node.transaction_hash : '';
            const result = node.result ? RecordStatus.success : RecordStatus.pendingToRefund;
            await this.aggregationService.updateHistoryRecord({
              where: { id: this.genID(transfer, node.id) },
              data: {
                responseTxHash,
                reason: 'unknown',
                result,
                endTime: this.toUnixTime(node.timestamp),
              },
            });
          }
        }
      }
      let refunded = 0;
      for (const node of uncheckedRecords) {
        if (node.reason !== '') {
          const transferId = last(node.id.split('-'));
          const withdrawInfo = await this.queryTransfer(transfer, transferId);
          if (withdrawInfo && withdrawInfo.withdraw_transaction) {
            refunded += 1;
            await this.aggregationService.updateHistoryRecord({
              where: { id: node.id },
              data: {
                responseTxHash: withdrawInfo.withdraw_transaction,
                endTime: Number(withdrawInfo.withdraw_timestamp),
                result: RecordStatus.refunded,
                recvToken: node.sendToken,
              },
            });
          }
        }
      }
      if (refunded > 0 || ids.length > 0) {
        this.logger.log(
          `sub2eth v2 update records, from ${from.chain}, to ${to.chain}, ids ${ids}, refunded ${refunded}`
        );
      }
    } catch (error) {
      this.logger.warn(
        `sub2eth v2 update record failed, from ${from.chain}, to ${to.chain}, ${error}`
      );
    }
  }
}
