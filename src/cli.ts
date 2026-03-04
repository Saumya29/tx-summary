#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { summarizeTx } from './api.js';
import { getExplorerUrl, CHAINS, parseExplorerUrl } from './chains.js';

const program = new Command();

program
  .name('tx-summary')
  .description('Summarize blockchain transactions in plain English')
  .version('1.0.0')
  .argument('<hash>', 'Transaction hash or block explorer URL')
  .option('-c, --chain <name>', 'Chain name (ethereum, arbitrum, optimism, base, polygon, zksync, katana)', 'ethereum')
  .option('-r, --rpc <url>', 'Custom RPC URL')
  .option('-v, --verbose', 'Show detailed output')
  .option('-j, --json', 'Output as JSON')
  .action(async (hashOrUrl: string, options) => {
    try {
      let hash = hashOrUrl;
      let chain: string = options.chain;

      // Try parsing as explorer URL
      const parsed = parseExplorerUrl(hashOrUrl);
      if (parsed) {
        hash = parsed.hash;
        chain = parsed.chain;
      }

      // Validate hash format
      if (!hash.startsWith('0x') || hash.length !== 66) {
        console.error(chalk.red('Error: Invalid transaction hash format'));
        console.error(chalk.gray('Expected: 0x followed by 64 hex characters, or a block explorer URL'));
        process.exit(1);
      }

      // Validate chain
      if (!CHAINS[chain.toLowerCase()]) {
        console.error(chalk.red(`Error: Unknown chain "${chain}"`));
        console.error(chalk.gray(`Supported chains: ${Object.keys(CHAINS).join(', ')}`));
        process.exit(1);
      }

      if (options.verbose && !options.json) {
        console.log(chalk.gray(`Fetching tx from ${chain}...`));
      }

      const result = await summarizeTx(hash, {
        chain: chain,
        rpc: options.rpc,
      });

      if (options.json) {
        console.log(JSON.stringify({
          ...result,
          blockNumber: result.blockNumber?.toString(),
        }, null, 2));
        return;
      }

      // Status color
      const statusColor = result.status === 'success' 
        ? chalk.green 
        : result.status === 'failed' 
          ? chalk.red 
          : chalk.yellow;

      // Main output
      console.log();
      console.log(chalk.bold(result.summary));
      
      if (options.verbose) {
        console.log();
        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.gray('Hash:   ') + chalk.cyan(result.hash));
        console.log(chalk.gray('From:   ') + result.from);
        console.log(chalk.gray('To:     ') + (result.to || chalk.italic('Contract Creation')));
        console.log(chalk.gray('Status: ') + statusColor(result.status));
        if (result.blockNumber) {
          console.log(chalk.gray('Block:  ') + result.blockNumber.toString());
        }
        
        const explorerUrl = getExplorerUrl(chain, hash);
        if (explorerUrl) {
          console.log(chalk.gray('Explorer: ') + chalk.blue.underline(explorerUrl));
        }
      }
      console.log();

    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message);
      } else {
        console.error(chalk.red('Error:'), error);
      }
      process.exit(1);
    }
  });

program.parse();
