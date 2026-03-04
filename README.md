# tx-summary

> Summarize any blockchain transaction in plain English — no API keys, no LLM, pure pattern matching.

tx-summary decodes EVM transactions using known function selectors, contract registries, and token databases to produce human-readable summaries. It works entirely offline (aside from RPC calls) with zero external dependencies beyond a public RPC endpoint.

```bash
npx tx-summary 0x1234...abcd
# → "Swapped 1.50 ETH → 2,847.00 USDC via Uniswap V3"

# Or paste a block explorer URL directly
npx tx-summary https://etherscan.io/tx/0x1234...abcd
# → auto-detects chain, extracts hash, summarizes
```

## How It Works

1. **Fetch** — pulls the transaction and receipt from an RPC endpoint
2. **Decode** — matches the 4-byte function selector against 60+ known signatures (swaps, transfers, lending, NFTs, etc.)
3. **Parse logs** — extracts ERC20 transfers, NFT transfers (ERC721/1155) from event logs
4. **Identify contracts & tokens** — looks up addresses in a registry of 150+ known contracts and 80+ tokens across 8 chains
5. **Summarize** — applies heuristics (swap detection, mint/burn detection, lending flows) to produce a one-line summary

No LLM. No API keys. Deterministic output.

## Installation

```bash
# Use directly with npx (no install needed)
npx tx-summary <hash-or-url>

# Or install globally
npm install -g tx-summary
```

## Usage

```bash
# Basic usage (defaults to Ethereum mainnet)
tx-summary 0x1234...abcd

# Paste a block explorer URL — chain is auto-detected
tx-summary https://arbiscan.io/tx/0x1234...abcd
tx-summary https://katanascan.com/tx/0x1234...abcd
tx-summary https://basescan.org/tx/0x1234...abcd

# Or specify chain manually
tx-summary 0x... --chain arbitrum

# Custom RPC (recommended for production)
tx-summary 0x... --rpc https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Verbose output (includes block, status, explorer link)
tx-summary 0x... --verbose

# JSON output (for scripting)
tx-summary 0x... --json
```

## Supported Chains

| Chain        | ID       | Explorer URL Support     | Default RPC              |
|--------------|----------|--------------------------|--------------------------|
| `ethereum`   | 1        | etherscan.io             | Public Llama RPC         |
| `arbitrum`   | 42161    | arbiscan.io              | arb1.arbitrum.io         |
| `optimism`   | 10       | optimistic.etherscan.io  | mainnet.optimism.io      |
| `base`       | 8453     | basescan.org             | mainnet.base.org         |
| `polygon`    | 137      | polygonscan.com          | polygon-rpc.com          |
| `zksync`     | 324      | era.zksync.network       | mainnet.era.zksync.io    |
| `katana`     | 747474   | katanascan.com           | rpc.katana.network       |

Each chain has multiple fallback RPCs configured. Pass `--rpc` to use your own.

### Katana Ecosystem Support

tx-summary has deep integration with the Katana DeFi ecosystem:

**Protocols:**
- **Sushi** — V2/V3 routers, RouteProcessor swaps
- **Morpho** — Supply, borrow, repay, liquidate, flash loans
- **Vault Bridge** — Cross-chain token converters (WETH, USDC, USDT, WBTC)
- **Agglayer** — Unified bridge & Bridge-and-Call

**Tokens:**
- Native: KAT, AUSD (Agora USD)
- Bridged: WETH, WBTC, USDC, USDT, USDS
- Staking: wstETH, weETH, jitoSOL
- Universal: uSOL, uSUI, uADA, uXRP

## What It Detects

### DeFi
- **Swaps** — Uniswap V2/V3, SushiSwap, 1inch, 0x, Cowswap, Curve, Balancer, Paraswap, KyberSwap, QuickSwap, SyncSwap
- **Liquidity** — Add/remove LP positions
- **Lending** — Aave V2/V3, Compound V3, Spark, Morpho Blue: supply, borrow, repay, liquidate, flash loans
- **WETH** — Wrap/unwrap operations

### Tokens
- **Transfers** — ETH/native + ERC20 sends with proper decimals
- **Approvals** — Token approvals with contract names
- **Permit2** — Signature-based approvals

### NFTs
- **ERC721** — Single NFT transfers, mints, burns, sales
- **ERC1155** — Multi-token transfers
- **Marketplaces** — OpenSea Seaport, Blur, LooksRare, X2Y2, Sudoswap

### Other
- Contract deployments
- Bridge transactions (Across, Stargate, Hop, native L2 bridges)
- ENS registrations
- Failed transaction detection with error prefix

## Example Outputs

```
Sent 1.50 ETH → 0x1234…5678
Swapped 500.00 USDC → 0.25 ETH via Uniswap V3
Swapped 1.00 ETH → 2,847.00 USDC via 1inch V5 Router
Approved USDC for Uniswap Universal Router
Wrapped 2.00 ETH → WETH
Supplied 1,000.00 USDC to Aave
Borrowed 0.50 ETH from Aave
Repaid 500.00 DAI to Aave
Minted Bored Ape Yacht Club #1234
Bought Azuki #5678 for 15.00 ETH on OpenSea
Transferred CryptoPunks #9999 → 0xabc…def
Deployed new contract
Added WETH/USDC liquidity to Uniswap V2 Router
❌ FAILED: Swapped 100.00 USDC → 0.05 ETH via 0x Exchange Proxy
```

## Programmatic API

```typescript
import { summarizeTx, getClient, decodeTx } from 'tx-summary';

// Simple summary
const result = await summarizeTx('0x1234...', { chain: 'ethereum' });
console.log(result.summary);
// → "Swapped 1.50 ETH → 2,847.00 USDC via Uniswap V3"

// Full result
console.log(result);
// {
//   hash: '0x1234...',
//   summary: 'Swapped 1.50 ETH → 2,847.00 USDC via Uniswap V3',
//   from: '0xabc...',
//   to: '0xdef...',
//   status: 'success',
//   blockNumber: 12345678n
// }

// Low-level: decode transaction data
const client = getClient('arbitrum');
const tx = await client.getTransaction({ hash: '0x1234...' });
const receipt = await client.getTransactionReceipt({ hash: '0x1234...' });
const decoded = decodeTx(tx, receipt);
console.log(decoded.transfers);    // ERC20 transfers
console.log(decoded.nftTransfers); // NFT transfers
console.log(decoded.contractName); // Known contract name
```

## Architecture

```
src/
├── cli.ts          # CLI entry point (commander)
├── api.ts          # High-level summarizeTx() function
├── chains.ts       # Chain registry, RPC config, explorer URL parsing
├── decoder.ts      # Tx decoding: selectors, contracts, tokens, log parsing
├── summarizer.ts   # Rule-based summary generation
└── index.ts        # Public API exports
```

The summarizer is entirely rule-based — it uses pattern matching on decoded function selectors and parsed event logs to generate summaries. No LLM or external API calls are involved.

## License

MIT
