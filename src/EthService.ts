import type Web3 from 'web3';
import { type BlockHeaderOutput, type Numbers } from 'web3';
import {
  type ServiceBaseProps,
  type IServiceBase,
  ServiceBase,
} from './ServiceBase';

// TODO: Figure out how to get the type directly from web3
type TransactionObject = {
  gasPrice?: string;
};

export interface IEthService extends IServiceBase {
  readonly latestBlockNumber?: Numbers;
  readonly latestBaseFeePerGas?: number;
  readonly latestAveragePriorityFee?: string;
  readonly isFeeCurrent: boolean;
  listen: (f: (result: BlockHeaderOutput) => any) => Promise<void>;
  fetchBlockDetails: (blockNumber: Numbers) => Promise<any>;
  setFeeEstimates: () => Promise<void>;
}

type EthServiceProps = {
  web3: Web3;
} & ServiceBaseProps;

/*
 * EthService is a service that listens for new ethereum mainnet blocks and
 * sets the _latestBaseFeePerGas and _latestAveragePriorityFee properties
 * based on the details of the block.
 */
export class EthService extends ServiceBase implements IEthService {
  private readonly _eth;
  private readonly _utils;
  // TODO: Consider updating fees to an object/map of {blockNumber: fees} instead of overwriting
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
   * Listen for new blocks and execute the given function when a new block is received.
   * @param func - The function to execute when a new block is received
   */
  public async listen(func: (result: BlockHeaderOutput) => any): Promise<void> {
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
      await func(result);
    });
  }

  /**
   * Fetch details for a given block number and set the _latestBaseFeePerGas
   * and _latestAveragePriorityFee based on the details of the block. If the
   * given block number is older than the latest block number, then the
   * _isFeeCurrent flag is set to false.
   * @param blockNumber - The block number to fetch details for
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public async fetchBlockDetails(blockNumber: Numbers) {
    if (blockNumber !== this._latestBlockNumber) {
      this._isFeeCurrent = false;
    }
    try {
      return await this._eth.getBlock(blockNumber, true);
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

  /**
   * Set the _latestBaseFeePerGas and _latestAveragePriorityFee based on the
   * service.
   */
  public async setFeeEstimates(): Promise<void> {
    await this.listen(async (result: BlockHeaderOutput) => {
      if (result.number === undefined) {
        this._logger.error(
          {},
          'Error in setFeeEstimates: Block number is undefined',
        );
        return;
      }

      const blockNumber = result.number;
      this._latestBlockNumber = blockNumber;

      try {
        const block = await this.fetchBlockDetails(this._latestBlockNumber);
        if (block?.transactions == null) {
          this._isFeeCurrent = false;
          this._logger.error(
            {},
            'Error in setFeeEstimates: Block or block transactions are undefined',
          );
          return; // Exit the function early
        }

        let totalPriorityFees = BigInt(0);
        let count = 0;

        // Process transactions
        for (const tx of block.transactions as TransactionObject[]) {
          if (tx.gasPrice != null) {
            const gasPrice = BigInt(tx.gasPrice);
            const baseFeePerGas = BigInt(block.baseFeePerGas ?? 0);
            const priorityFee = gasPrice - baseFeePerGas;
            totalPriorityFees += priorityFee;
            count++;
          }
        }

        if (blockNumber === this._latestBlockNumber) {
          this._isFeeCurrent = true;
        }

        const averagePriorityFee =
          count > 0 ? totalPriorityFees / BigInt(count) : BigInt(0);
        this._latestBaseFeePerGas = Number(
          this._utils.fromWei(block.baseFeePerGas?.toString() ?? '0', 'gwei'),
        );
        this._latestAveragePriorityFee = this._utils.fromWei(
          averagePriorityFee.toString(),
          'gwei',
        );

        this._logger.info(
          {},
          `Base Fee Per Gas: ${this._latestBaseFeePerGas} Gwei`,
        );
        this._logger.info(
          {},
          `Average Priority Fee: ${this._latestAveragePriorityFee} Gwei`,
        );
      } catch (error) {
        this._logger.error(error, 'Error occurred in setFeeEstimates');
      }
    });
  }
}
