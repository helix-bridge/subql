import { Args, Query, Mutation, Resolver } from '@nestjs/graphql';
import { isEmpty, isNull, isUndefined } from 'lodash';
import { AggregationService } from './aggregation.service';
import { Prisma } from '@prisma/client';

@Resolver()
export class AggregationResolver {
  constructor(private aggregationService: AggregationService) {}

  @Query()
  async historyRecordById(@Args('id') id: string) {
    return this.aggregationService.queryHistoryRecordById({
      id: id,
    });
  }

  @Query()
  async historyRecords(
    @Args('sender') sender: string,
    @Args('recipient') recipient: string,
    @Args('fromChains') fromChains: string[],
    @Args('toChains') toChains: string[],
    @Args('bridges') bridges: string,
    @Args('row') row: number,
    @Args('page') page: number,
    @Args('results') results: number[],
    @Args('recvTokenAddress') recvTokenAddress: string,
    @Args('order') order: string
  ) {
    const skip = row * page || 0;
    const take = row || 10;
    const orderBy = order
      ? { [order]: Prisma.SortOrder.desc }
      : { startTime: Prisma.SortOrder.desc };
    const isValid = (item) =>
      !Object.values(item).some((value) => isUndefined(value) || isNull(value) || value === '');

    const accFilters = [{ sender }, { recipient }].filter(isValid);
    const accountCondition = accFilters.length ? { OR: accFilters } : {};
    const resultCondition = results && results.length ? { result: { in: results } } : {};
    const fromChainCondition =
      fromChains && fromChains.length ? { fromChain: { in: fromChains } } : {};
    const toChainCondition = toChains && toChains.length ? { toChain: { in: toChains } } : {};
    const bridgeCondition = bridges && bridges.length ? { bridge: { in: bridges } } : {};
    const recvTokenCondition =
      recvTokenAddress && recvTokenAddress.length ? { recvTokenAddress: recvTokenAddress } : {};
    const chainConditions = {
      AND: {
        ...resultCondition,
        ...fromChainCondition,
        ...toChainCondition,
        ...bridgeCondition,
        ...recvTokenCondition,
      },
    };

    const conditions = {
      ...accountCondition,
      ...chainConditions,
    };

    const where = isEmpty(conditions) ? undefined : conditions;

    return this.aggregationService.queryHistoryRecords({
      skip,
      take,
      where,
      orderBy,
    });
  }

  // daily statistics
  @Query()
  async queryDailyStatistics(
    @Args('timepast') timepast: number,
    @Args('first') take: number,
    @Args('from') fromChain: string,
    @Args('to') toChain: string,
    @Args('bridge') bridge: string,
    @Args('token') token: string
  ) {
    const filter = [];
    if (fromChain) {
      filter.push({ fromChain });
    }
    if (toChain) {
      filter.push({ toChain });
    }
    if (bridge) {
      filter.push({ bridge });
    }
    if (token) {
      filter.push({ token });
    }

    const now = Date.now() / 1000;
    const timelimit = Math.floor(now - timepast);
    const where = { AND: { timestamp: { gt: timelimit }, AND: filter } };
    return this.aggregationService.queryDailyStatistics({
      take,
      where,
    });
  }

  @Mutation()
  async addGuardSignature(@Args('id') id: string, @Args('signature') signature: string) {
    await this.aggregationService.addGuardSignature({
      where: { id: id },
      signature: signature,
    });
  }

  @Query()
  async queryGuardNeedSignature(
    @Args('fromChain') fromChain: string,
    @Args('toChain') toChain: string,
    @Args('bridge') bridge: string,
    @Args('guardAddress') guardAddress: string,
    @Args('row') row: number
  ) {
    const take = row || 10;
    const statusPendingToClaim = 2;
    const baseFilters = { fromChain, toChain, bridge };
    const guardNotSigned = { guardSignatures: { search: '!' + guardAddress } };
    const filterResponsed = { responseTxHash: '', result: statusPendingToClaim };

    const where = {
      ...baseFilters,
      ...guardNotSigned,
      ...filterResponsed,
    };

    return this.aggregationService.queryHistoryRecords({
      skip: 0,
      take,
      where,
    });
  }

  @Query()
  async queryRelayRecords(
    @Args('fromChain') fromChain: string,
    @Args('toChain') toChain: string,
    @Args('bridge') bridge: string,
    @Args('relayer') relayer: string,
    @Args('row') row: number
  ) {
    const take = row || 16;
    const baseFilters = { fromChain, toChain, bridge, relayer };
    const filterWithdrawn = { endTxHash: '' };

    const where = {
      ...baseFilters,
      ...filterWithdrawn,
    };

    return this.aggregationService.queryHistoryRecords({
      skip: 0,
      take,
      where,
    });
  }

  @Query()
  async queryLnv20RelayInfos(
    @Args('fromChain') fromChain: string,
    @Args('toChain') toChain: string,
    @Args('bridge') bridge: string,
    @Args('row') row: number,
    @Args('page') page: number,
  ) {
    const skip = row * page || 0;
    const take = row || 10;
    const baseFilters = { fromChain, toChain, bridge };

    const where = {
      ...baseFilters,
    };

    const records = await this.aggregationService.queryLnv20RelayInfos({
      skip,
      take,
      where,
    });
    return records;
  }

  @Query()
  async sortedLnv20RelayInfos(
    @Args('fromChain') fromChain: string,
    @Args('toChain') toChain: string,
    @Args('bridge') bridge: string,
    @Args('token') token: string,
    @Args('row') row: number,
    @Args('amount') amount: bigint,
    @Args('decimals') decimals: bigint,
  ) {
    const take = row || 128;
    const baseFilters = { fromChain, toChain, bridge };

    const where = {
      ...baseFilters,
    };

    const records = await this.aggregationService.queryLnv20RelayInfos({
      skip: 0,
      take,
      where,
    });
    // w=P * 0.5 + max(R - S*0.001, 0) * 0.1 + max(1-T_0 * 0.001, 0)*0.1 + T_1 * 0.2
    const validRecords = records.records.filter(record => BigInt(record.margin) > amount);
    // query all pending txs
    var sortedRelayers = [];
    for (const record of validRecords) {
      const point = await this.aggregationService.calculateLnv20RelayerPoint(
        token,
        amount,
        decimals,
        record,
      );
      if (point == null) {
        continue;
      }
      sortedRelayers.push({record, point});
      console.log(point);
    }
    return sortedRelayers.sort((l, r) => l.point - r.point).map((item, index, array) => item.record);
  }
}

