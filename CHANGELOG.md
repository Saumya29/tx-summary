# Changelog

## [1.1.0] - 2026-03-05

### Added
- **Multi-chain support**: Arbitrum, Optimism, Base, Polygon, zkSync Era
- **Explorer URL parsing**: paste a block explorer URL directly instead of a hash — chain is auto-detected
  - Supports etherscan.io, arbiscan.io, optimistic.etherscan.io, basescan.org, polygonscan.com, era.zksync.network, katanascan.com
- Chain-specific contract and token registries for all new chains (WETH, USDC, USDT, DAI, Aave V3 pools, Uniswap routers, QuickSwap, SyncSwap, etc.)

## [1.0.0] - 2026-02-11

### Added
- Initial release
- CLI with `--chain`, `--rpc`, `--verbose`, `--json` flags
- Programmatic API: `summarizeTx()`, `decodeTx()`, `getClient()`
- Ethereum mainnet + Katana chain support

### Detection
- ERC20 transfers with proper decimals
- Token approvals
- Swaps via 20+ DEX routers
- Aave/Compound/Spark lending actions
- WETH wrap/unwrap
- ERC721/ERC1155 NFT transfers
- NFT marketplace trades (OpenSea, Blur, etc.)
- Liquidity add/remove
- Contract deployments

### Registry
- 100+ known contract names
- 50+ token symbols with decimals
- Popular NFT collection names
