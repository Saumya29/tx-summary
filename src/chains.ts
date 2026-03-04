import { http, createPublicClient, type Chain } from 'viem';
import { mainnet, arbitrum, optimism, base, polygon, zksync } from 'viem/chains';

// Katana chain definition
export const katana: Chain = {
  id: 747474,
  name: 'Katana',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.katana.network'] },
  },
  blockExplorers: {
    default: { name: 'KatanaScan', url: 'https://katanascan.com' },
  },
};

// Chain registry with fallback RPCs
export const CHAINS: Record<string, { chain: Chain; rpcs: string[] }> = {
  ethereum: {
    chain: mainnet,
    rpcs: [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
    ],
  },
  mainnet: {
    chain: mainnet,
    rpcs: [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
    ],
  },
  katana: {
    chain: katana,
    rpcs: ['https://rpc.katana.network'],
  },
  arbitrum: {
    chain: arbitrum,
    rpcs: [
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
      'https://arbitrum-one.publicnode.com',
    ],
  },
  optimism: {
    chain: optimism,
    rpcs: [
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism',
      'https://optimism.publicnode.com',
    ],
  },
  base: {
    chain: base,
    rpcs: [
      'https://mainnet.base.org',
      'https://base.publicnode.com',
    ],
  },
  polygon: {
    chain: polygon,
    rpcs: [
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://polygon-bor.publicnode.com',
    ],
  },
  zksync: {
    chain: zksync,
    rpcs: [
      'https://mainnet.era.zksync.io',
      'https://zksync.publicnode.com',
    ],
  },
};

export function getClient(chainName: string, customRpc?: string) {
  const chainConfig = CHAINS[chainName.toLowerCase()];
  if (!chainConfig) {
    throw new Error(`Unknown chain: ${chainName}. Supported: ${Object.keys(CHAINS).join(', ')}`);
  }

  const rpcUrl = customRpc || chainConfig.rpcs[0];

  return createPublicClient({
    chain: chainConfig.chain,
    transport: http(rpcUrl),
  });
}

// Map explorer hostnames to chain names
const EXPLORER_TO_CHAIN: Record<string, string> = {
  'etherscan.io': 'ethereum',
  'arbiscan.io': 'arbitrum',
  'optimistic.etherscan.io': 'optimism',
  'basescan.org': 'base',
  'polygonscan.com': 'polygon',
  'era.zksync.network': 'zksync',
  'explorer.zksync.io': 'zksync',
  'katanascan.com': 'katana',
};

export function parseExplorerUrl(input: string): { hash: string; chain: string } | null {
  try {
    const url = new URL(input);
    const match = url.pathname.match(/\/tx\/(0x[0-9a-fA-F]{64})/);
    if (!match) return null;

    const host = url.hostname.replace(/^www\./, '');
    const chain = EXPLORER_TO_CHAIN[host];
    if (!chain) return null;

    return { hash: match[1], chain };
  } catch {
    return null;
  }
}

export function getExplorerUrl(chainName: string, txHash: string): string {
  const chainConfig = CHAINS[chainName.toLowerCase()];
  if (!chainConfig?.chain.blockExplorers?.default) {
    return '';
  }
  return `${chainConfig.chain.blockExplorers.default.url}/tx/${txHash}`;
}
