import type Web3 from 'web3';
import { type Numbers } from 'web3';
import {
  type ServiceBaseProps,
  type IServiceBase,
  ServiceBase,
} from './ServiceBase';

type TransactionObject = {
  gasPrice?: string;
};

export interface IEthService extends IServiceBase {
  readonly latestBlockNumber?: Numbers;
  readonly latestBaseFeePerGas?: number;
  readonly latestAveragePriorityFee?: string;
  readonly isFeeCurrent: boolean;
  listen: () => Promise<void>;
  fetchBlockDetails: (blockNumber: Numbers) => Promise<void>;
  estimateFee: () => Promise<number>;
}

type EthServiceProps = {
  web3: Web3;
} & ServiceBaseProps;

export class EthService extends ServiceBase implements IEthService {
  private readonly _eth;
  private readonly _utils;
  // TODO: Consider updating fees to an object/map of block number to fees
  private _latestBlockNumber?: Numbers;
  private _latestBaseFeePerGas?: number;
  private _latestAveragePriorityFee?: string;
  // Sometimes fetchBlockDetails fails, so we need to keep track of whether
  // the fees are current or not. Also, fetchBlockDetails can be called on
  // a block number that is older than the latest block number, which overwrites
  // the fee properties in the current implementation. isFeeCurrent exposes that.
  private _isFeeCurrent = false;

  constructor(props: EthServiceProps) {
    const { web3, ...rest } = props;
    super(rest);
    this._eth = web3.eth;
    this._utils = web3.utils;
  }

  get latestBlockNumber(): Numbers | undefined {
    return this._latestBlockNumber;
  }

  get latestBaseFeePerGas(): number | undefined {
    return this._latestBaseFeePerGas;
  }

  get latestAveragePriorityFee(): string | undefined {
    return this._latestAveragePriorityFee;
  }

  get isFeeCurrent(): boolean {
    return this._isFeeCurrent;
  }

  /**
   * Listen for new blocks and fetch details for each new block
   */
  public async listen(): Promise<void> {
    const subscription = await this._eth.subscribe('newBlockHeaders');
    subscription.on('data', async (result) => {
      this._latestBlockNumber = result.number;
      this._logger.info(
        {
          blockNumber: this._latestBlockNumber,
        },
        'new block received',
      );

      // The following null assertion is safe because it only runs after
      // a block has been received, which sets the _latestBlockNumber
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.fetchBlockDetails(this._latestBlockNumber!);
    });
  }

  /**
   * Fetch details for a given block number and set the _latestBaseFeePerGas
   * and _latestAveragePriorityFee based on the details of the block. If the
   * given block number is older than the latest block number, then the
   * _isFeeCurrent flag is set to false.
   * @param blockNumber - The block number to fetch details for
   */
  public async fetchBlockDetails(blockNumber: Numbers): Promise<void> {
    if (blockNumber !== this._latestBlockNumber) {
      this._isFeeCurrent = false;
    }
    try {
      const block = await this._eth.getBlock(blockNumber, true);
      let totalPriorityFees = BigInt(0);
      let count = 0;

      // getBlock with option true returns full details for each transaction
      // in the block, but gives back a sum type, so we need to cast it to
      // TransactionObject to access the gasPrice property
      if (
        Array.isArray(block.transactions) &&
        Boolean(block.transactions.every((tx) => typeof tx === 'object'))
      ) {
        for (const tx of block.transactions as TransactionObject[]) {
          if (tx.gasPrice != null) {
            const gasPrice = BigInt(tx.gasPrice);
            const baseFeePerGas = this._utils.toBigInt(block.baseFeePerGas);
            const priorityFee = gasPrice - baseFeePerGas;
            totalPriorityFees += priorityFee;
            count++;
          }
        }
      }

      if (blockNumber === this._latestBlockNumber) {
        this._isFeeCurrent = true;
      }

      const averagePriorityFee =
        count > 0 ? totalPriorityFees / BigInt(count) : BigInt(0);
      this._latestBaseFeePerGas = Number(
        this._utils.fromWei((block.baseFeePerGas ?? 0).toString(), 'gwei'),
      );
      this._latestAveragePriorityFee = this._utils.fromWei(
        averagePriorityFee.toString(),
        'gwei',
      );

      this._logger.info(
        {},
        `Base Fee Per Gas: ${this.latestBaseFeePerGas} Gwei`,
      );
      this._logger.info(
        {},
        `Average Priority Fee: ${this.latestAveragePriorityFee} Gwei`,
      );
    } catch (error: unknown) {
      // If the block number is older than the latest block number, then
      // then failure in this method might mean that the fees are still current
      if (blockNumber === this._latestBlockNumber) {
        this._isFeeCurrent = false;
      }
      this._logger.error(
        error,
        `[${this.constructor.name}] fetchBlockDetails failed with error:`,
      );
    }
  }

  public async estimateFee(): Promise<number> {
    return 0.0001;
  }
}
