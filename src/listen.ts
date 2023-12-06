import { INFURA_ETH_MAINNET_WSS_URL, INFURA_API_KEY } from './env';
import Web3 from 'web3';
import pino from 'pino';
import pretty from 'pino-pretty';

export const logger = pino(
  pretty({
    colorize: true,
    ignore: 'pid,hostname',
    colorizeObjects: true,
  }),
);

const wsProvider = new Web3.providers.WebsocketProvider(
  `${INFURA_ETH_MAINNET_WSS_URL}${INFURA_API_KEY}`,
);
const web3 = new Web3(wsProvider);

type TransactionObject = {
  gasPrice?: string;
};

export async function listen(): Promise<void> {
  const subscription = await web3.eth.subscribe('newBlockHeaders');
  subscription.on('data', async (result) => {
    logger.info({ blockNumber: result.number }, 'new block received');
    const block = await web3.eth.getBlock(result.number, true);
    let totalPriorityFees = BigInt(0);
    let count = 0;

    if (
      Array.isArray(block.transactions) &&
      Boolean(block.transactions.every((tx) => typeof tx === 'object'))
    ) {
      for (const tx of block.transactions as TransactionObject[]) {
        if (tx.gasPrice != null) {
          const gasPrice = BigInt(tx.gasPrice);
          const baseFeePerGas = web3.utils.toBigInt(block.baseFeePerGas);
          const priorityFee = gasPrice - baseFeePerGas;
          totalPriorityFees += priorityFee;
          count++;
        }
      }
    }

    const averagePriorityFee =
      count > 0 ? totalPriorityFees / BigInt(count) : BigInt(0);
    const baseFeePerGasGwei = web3.utils.fromWei(
      (block.baseFeePerGas ?? 0).toString(),
      'gwei',
    );
    const averagePriorityFeeInGwei = web3.utils.fromWei(
      averagePriorityFee.toString(),
      'gwei',
    );

    logger.info(`Base Fee Per Gas: ${baseFeePerGasGwei} Gwei`);
    logger.info(`Average Priority Fee: ${averagePriorityFeeInGwei} Gwei`);

    // logger.info({ block }, 'block details');
  });
}
