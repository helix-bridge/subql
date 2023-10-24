import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseTransferServiceT2, PartnerT2 } from '../base/TransferServiceT2';
import { AddressTokenMap } from '../base/AddressToken';

@Injectable()
export class TransferService extends BaseTransferServiceT2 {
  private readonly lnEthereumDefaultEndpoint = this.configService.get<string>(
    'LN_ETHEREUM_DEFAULT_ENDPOINT'
  );
  private readonly lnEthereumOppositeEndpoint = this.configService.get<string>(
    'LN_ETHEREUM_OPPOSITE_ENDPOINT'
  );
  private readonly lnLineaDefaultEndpoint = this.configService.get<string>(
    'LN_LINEA_DEFAULT_ENDPOINT'
  );
  private readonly lnLineaOppositeEndpoint = this.configService.get<string>(
    'LN_LINEA_OPPOSITE_ENDPOINT'
  );
  private readonly lnMantleDefaultEndpoint = this.configService.get<string>(
    'LN_MANTLE_DEFAULT_ENDPOINT'
  );
  private readonly lnMantleOppositeEndpoint = this.configService.get<string>(
    'LN_MANTLE_OPPOSITE_ENDPOINT'
  );
  private readonly lnArbitrumDefaultEndpoint = this.configService.get<string>(
    'LN_ARBITRUM_DEFAULT_ENDPOINT'
  );
  private readonly lnArbitrumOppositeEndpoint = this.configService.get<string>(
    'LN_ARBITRUM_OPPOSITE_ENDPOINT'
  );
  private readonly lnZkSyncDefaultEndpoint = this.configService.get<string>(
    'LN_ZKSYNC_DEFAULT_ENDPOINT'
  );

  formalChainTransfers: PartnerT2[] = [
    {
      chainId: 1,
      chain: 'ethereum',
      url: this.lnEthereumOppositeEndpoint,
      bridge: 'opposite',
      symbols: [
        {
          symbol: 'RING',
          address: '0x9469D013805bFfB7D3DEBe5E7839237e535ec483',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 42161,
      chain: 'arbitrum',
      url: this.lnArbitrumOppositeEndpoint,
      bridge: 'opposite',
      symbols: [
        {
          symbol: 'RING',
          address: '0x9e523234D36973f9e38642886197D023C88e307e',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 1,
      chain: 'ethereum',
      url: this.lnEthereumDefaultEndpoint,
      bridge: 'default',
      symbols: [
        {
          symbol: 'RING',
          address: '0x9469D013805bFfB7D3DEBe5E7839237e535ec483',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 42161,
      chain: 'arbitrum',
      url: this.lnArbitrumDefaultEndpoint,
      bridge: 'default',
      symbols: [
        {
          symbol: 'RING',
          address: '0x9e523234D36973f9e38642886197D023C88e307e',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'USDT',
          address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
          protocolFee: 100000,
          decimals: 6,
        },
      ],
    },
    {
      chainId: 5000,
      chain: 'mantle',
      url: this.lnMantleDefaultEndpoint,
      bridge: 'default',
      symbols: [
        {
          symbol: 'USDT',
          address: '0x201eba5cc46d216ce6dc03f6a759e8e766e956ae',
          protocolFee: 100000,
          decimals: 6,
        },
      ],
    },
  ];

  testChainTransfers: PartnerT2[] = [
    {
      chainId: 5,
      chain: 'goerli',
      url: this.lnEthereumDefaultEndpoint,
      bridge: 'default',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xe9784E0d9A939dbe966b021DE3cd877284DB1B99',
          protocolFee: 100000000,
          decimals: 6,
        },
        {
          symbol: 'USDT',
          address: '0xa39cffE89567eBfb5c306a07dfb6e5B3ba41F358',
          protocolFee: 100000000,
          decimals: 6,
        },
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
        {
          symbol: 'MNT',
          address: '0xc1dc2d65a2243c22344e725677a3e3bebd26e604',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 5,
      chain: 'goerli',
      url: this.lnEthereumOppositeEndpoint,
      bridge: 'opposite',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xe9784E0d9A939dbe966b021DE3cd877284DB1B99',
          protocolFee: 100000000,
          decimals: 6,
        },
        {
          symbol: 'USDT',
          address: '0xa39cffE89567eBfb5c306a07dfb6e5B3ba41F358',
          protocolFee: 100000000,
          decimals: 6,
        },
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
        {
          symbol: 'MNT',
          address: '0xc1dc2d65a2243c22344e725677a3e3bebd26e604',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 421613,
      chain: 'arbitrum-goerli',
      url: this.lnArbitrumDefaultEndpoint,
      bridge: 'default',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xBAD026e314a77e727dF643B02f63adA573a3757c',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'USDT',
          address: '0x543bf1AC41485dc78039b9351563E4Dd13A288cb',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 421613,
      chain: 'arbitrum-goerli',
      url: this.lnArbitrumOppositeEndpoint,
      bridge: 'opposite',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xBAD026e314a77e727dF643B02f63adA573a3757c',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'USDT',
          address: '0x543bf1AC41485dc78039b9351563E4Dd13A288cb',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 5001,
      chain: 'mantle-goerli',
      url: this.lnMantleDefaultEndpoint,
      bridge: 'default',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xD610DE267f7590D5bCCE89489ECd2C1A4AfdF76B',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'USDT',
          address: '0xDb06D904AC5Bdff3b8E6Ac96AFedd3381d94CFDD',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'MNT',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 5001,
      chain: 'mantle-goerli',
      url: this.lnMantleOppositeEndpoint,
      bridge: 'opposite',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xD610DE267f7590D5bCCE89489ECd2C1A4AfdF76B',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'USDT',
          address: '0xDb06D904AC5Bdff3b8E6Ac96AFedd3381d94CFDD',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'MNT',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 59140,
      chain: 'linea-goerli',
      url: this.lnLineaDefaultEndpoint,
      bridge: 'default',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xeC89AF5FF618bbF667755BE9d63C69F21F1c00C8',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'USDT',
          address: '0x8f3663930211f3DE17619FEB2eeB44c9c3F44a06',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 59140,
      chain: 'linea-goerli',
      url: this.lnLineaOppositeEndpoint,
      bridge: 'opposite',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xeC89AF5FF618bbF667755BE9d63C69F21F1c00C8',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'USDT',
          address: '0x8f3663930211f3DE17619FEB2eeB44c9c3F44a06',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
      ],
    },
    {
      chainId: 280,
      chain: 'zksync-goerli',
      url: this.lnZkSyncDefaultEndpoint,
      bridge: 'default',
      symbols: [
        {
          symbol: 'USDC',
          address: '0xAe60e005C560E869a2bad271e38e3C9D78381aFF',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'USDT',
          address: '0xb5372ed3bb2CbA63e7908066ac10ee94d30eA839',
          protocolFee: 100000000000000000000,
          decimals: 18,
        },
        {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          protocolFee: 1000000000000000,
          decimals: 18,
        },
      ],
    },
  ];

  addressToTokenInfo: { [key: string]: AddressTokenMap } = {};

  // message channel is used to withdraw liquidity
  public readonly messageChannel = {
    goerli: {
      'arbitrum-goerli': 'arbitrum-l2',
      'linea-goerli': 'linea-l2',
      'mantle-goerli': 'axelar',
      'zksync-goerli': 'layerzero',
    },
    'arbitrum-goerli': {
      goerli: 'arbitrum-l2',
      'linea-goerli': 'layerzero',
      'mantle-goerli': 'layerzero',
      'zksync-goerli': 'layerzero',
    },
    'linea-goerli': {
      goerli: 'linea-l2',
      'arbitrum-goerli': 'layerzero',
      'mantle-goerli': 'layerzero',
      'zksync-goerli': 'layerzero',
    },
    'mantle-goerli': {
      goerli: 'axelar',
      'arbitrum-goerli': 'layerzero',
      'linea-goerli': 'layerzero',
      'zksync-goerli': 'layerzero',
    },
    'zksync-goerli': {
      goerli: 'layerzero',
      'arbitrum-goerli': 'layerzero',
      'linea-goerli': 'layerzero',
      'mantle-goerli': 'layerzero',
    },
    'arbitrum': {
      ethereum: 'arbitrum-l2',
      mantle: 'layerzero',
    },
    'ethereum': {
      arbitrum: 'arbitrum-l2',
    },
    'mantle': {
      arbitrum: 'layerzero',
    }
  };
  readonly isTest = this.configService.get<string>('CHAIN_TYPE') === 'test';

  constructor(public configService: ConfigService) {
    super(configService);
  }
}
