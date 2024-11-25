export enum NETWORK_FILTER {
  ethereum = 'eip155:1/',
  polygon = 'eip155:137/',
  solana = 'solana:',
  arbitrum = 'eip155:42161/',
  optimism = 'eip155:10/',
  blast = 'eip155:81457/',
  base = 'eip155:8453/',
  HDsegwitBech32 = 'bip122:000000000019d6689c085ae165831e93',
  doge = 'bip122:1a91e3dace36e2be3bf030a65679fe82',
  linea = 'eip155:59144/',
  avalanche = 'eip155:43114/',
}

export type UINetworkFilter = NETWORK_FILTER | 'all';
