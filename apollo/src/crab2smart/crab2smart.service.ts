import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AggregationService } from '../aggregation/aggregation.service';
import { TasksService } from '../tasks/tasks.service';
import axios from 'axios';
import { getUnixTime } from 'date-fns';

@Injectable()
export class Crab2smartService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  private readonly crabUrl = this.configService.get<string>('SUBQL') + 'crab';
  private readonly fetchDataInterval = this.configService.get<number>('FETCH_CRAB_TO_CRAB_DVM_DATA_INTERVAL');
  private readonly fetchDataFirst = this.configService.get<number>('FETCH_CRAB_TO_CRAB_DVM_DATA_FIRST');

  constructor(
      private configService: ConfigService,
      private aggregationService: AggregationService,
      private taskService: TasksService
  ) {}

  async onModuleInit() {
    const self = this;
    this.taskService.addInterval('crab2crabdvm-fetchdata', this.fetchDataInterval, function() {
        self.fetchRecords()
    });
  }

  async fetchRecords() {
    const first = this.fetchDataFirst;
    try {
      let firstRecord = await this.aggregationService.queryHistoryRecordFirst({
        OR: [
          { fromChain: 'crab', toChain: 'crab-dvm' },
          { fromChain: 'crab-dvm', toChain: 'crab' }
        ],
        bridge: 'helix',
      });
      var latestNonce: number = firstRecord ? Number(firstRecord.nonce) : 0;
      const res = await axios.post(this.crabUrl, {
        query: `query { transfers (first: ${first}, orderBy: TIMESTAMP_ASC, offset: ${latestNonce}) { totalCount nodes{id, senderId, recipientId, fromChain, toChain, amount, timestamp }}}`,
        variables: null,
      });
      const nodes = res.data?.data?.transfers?.nodes;
      if (nodes) {
        for (let node of nodes) {
          latestNonce = latestNonce + 1;
          await this.aggregationService.createHistoryRecord({
            id: 'crab2crabdvm-' + node.id,
            fromChain: node.fromChain,
            toChain: node.toChain,
            bridge: 'helix',
            laneId: "0",
            nonce: latestNonce.toString(),
            requestTxHash: node.id,
            responseTxHash: node.id,
            sender: node.senderId,
            recipient: node.recipientId,
            token: "Crab",
            amount: node.amount,
            startTime: getUnixTime(new Date(node.timestamp)),
            endTime: getUnixTime(new Date(node.timestamp)),
            result: 1,
            fee: "0",
          });
        }
      }
      this.logger.log(`save new Darwinia to Crab lock records success, latestNonce: ${latestNonce}, added: ${nodes.length}`);
    } catch(e) {
      this.logger.warn(`update Crab to Crab DVM records failed ${e}`);
    }
  }
}
