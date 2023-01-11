import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseTransferServiceT1, TransferT1 } from '../base/TransferServiceT1';

@Injectable()
export class TransferService extends BaseTransferServiceT1 {
  private readonly backingSubgraphUrl = this.configService.get<string>('SUB2ETH_BACKING');
  private readonly issuingSubgraphUrl = this.configService.get<string>('SUB2ETH_ISSUING');
  private readonly inboundLaneSubgraph = this.configService.get<string>('SUB2ETH_INBOUND');

  formalChainTransfers: TransferT1[] = [
    {
      source: {
        chain: 'darwinia-dvm',
        url: this.backingSubgraphUrl,
        feeToken: 'RING',
      },
      target: {
        chain: 'ethereum',
        url: this.issuingSubgraphUrl,
        feeToken: 'ETH',
      },
      isLock: true,
      symbols: [
        {
          from: 'WRING',
          to: 'RING',
          address: '0xe7578598aac020abfb918f33a20fad5b71d670b4',
        },
        {
          from: 'KTON',
          to: 'KTON',
          address: '0x0000000000000000000000000000000000000402',
        },
      ],
    },
    {
      source: {
        chain: 'ethereum',
        url: this.issuingSubgraphUrl,
        feeToken: 'ETH',
      },
      target: {
        chain: 'darwinia-dvm',
        url: this.backingSubgraphUrl,
        feeToken: 'RING',
      },
      isLock: false,
      symbols: [
        {
          from: 'RING',
          to: 'WRING',
          address: '0x9469d013805bffb7d3debe5e7839237e535ec483',
        },
        {
          from: 'KTON',
          to: 'KTON',
          address: '0x9f284e1337a815fe77d2ff4ae46544645b20c5ff',
        },
      ],
    },
  ];

  testChainTransfers: TransferT1[] = [
    {
      source: {
        chain: 'pangoro-dvm',
        url: this.backingSubgraphUrl,
        feeToken: 'ORING',
      },
      target: {
        chain: 'goerli',
        url: this.issuingSubgraphUrl,
        feeToken: 'GoerliETH',
      },
      isLock: true,
      symbols: [
        {
          from: 'WORING',
          to: 'ORING',
          address: '0x46f01081e800bf47e43e7baa6d98d45f6a0251e4',
        },
        {
          from: 'OKTON',
          to: 'OKTON',
          address: '0x0000000000000000000000000000000000000402',
        },
      ],
    },
    {
      source: {
        chain: 'goerli',
        url: this.issuingSubgraphUrl,
        feeToken: 'GoerliETH',
      },
      target: {
        chain: 'pangoro-dvm',
        url: this.backingSubgraphUrl,
        feeToken: 'ORING',
      },
      isLock: false,
      symbols: [
        {
          from: 'ORING',
          to: 'WORING',
          address: '0x046d07d53926318d1f06c2c2a0f26a4de83e26c4',
        },
        {
          from: 'OKTON',
          to: 'OKTON',
          address: '0xdd3df59c868fcd40fded7af0cccc3e2c7bcb4f3c',
        },
      ],
    },
  ];

  dispatchEndPoints = {
    pangoro: this.inboundLaneSubgraph + '/pangoro',
    goerli: this.inboundLaneSubgraph + '/goerli',
    darwinia: this.inboundLaneSubgraph + '/darwinia',
    ethereum: this.inboundLaneSubgraph + '/ethereum',
  };

  constructor(public configService: ConfigService) {
    super(configService);
  }
}
