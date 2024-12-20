import { Injectable } from '@nestjs/common';
import { HistoryRecord, Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class AppService extends PrismaClient {
  getHello(): string {
    return 'Hello World!';
  }

  async questUsedHelix(where: Prisma.HistoryRecordWhereInput, times: number) {
    const total = await this.historyRecord.count({
      where,
    });
    if (total >= times) {
      return {
        data: {
          result: true,
        },
      };
    } else {
      return {
        error: {
          code: 0,
          message: `user sent count ${total}`,
        },
        data: {
          result: false,
        },
      };
    }
  }
}
