/* eslint-disable @typescript-eslint/unbound-method */
import MockWeb3 from './web3.mock';
import type Web3 from 'web3';
import { mockLogger } from './logger.mock';
import { EthService } from '../EthService';

describe('EthService unit tests', () => {
  let mockWeb3Instance: MockWeb3;
  let ethService: EthService;
  let mockWeb3: Web3;

  beforeEach(() => {
    mockWeb3Instance = new MockWeb3();
    mockWeb3 = mockWeb3Instance as unknown as Web3;
    ethService = new EthService({ web3: mockWeb3, logger: mockLogger });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listen()', () => {
    it('should call web3.eth.subscribe() with correct arguments', async () => {
      await ethService.setFeeEstimates();
      expect(mockWeb3.eth.subscribe).toHaveBeenCalledTimes(1);
      expect(mockWeb3.eth.subscribe).toHaveBeenCalledWith('newBlockHeaders');
    });
  });

  describe('fetchBlockDetails()', () => {
    const blockNumber = 123456;

    beforeEach(async () => {
      await ethService.setFeeEstimates();
      mockWeb3Instance.publishMockEvent({ number: blockNumber });
    });

    it('should call web3.eth.getBlock() with correct arguments', async () => {
      expect(mockWeb3.eth.getBlock).toHaveBeenCalledTimes(1);
      expect(mockWeb3.eth.getBlock).toHaveBeenCalledWith(blockNumber, true);
    });

    it('should update latest block number', () => {
      expect(ethService.latestBlockNumber).toBe(blockNumber);
    });

    it('should update latest base fee per gas', () => {
      const expectedBaseFee = Number(
        mockWeb3.utils.fromWei('1000000000', 'gwei'),
      );
      expect(ethService.latestBaseFeePerGas).toBe(expectedBaseFee);
    });

    it('should calculate and update latest average priority fee', () => {
      const averagePriorityFee = BigInt('2000000000');
      const expectedAveragePriorityFee = mockWeb3.utils.fromWei(
        averagePriorityFee,
        'gwei',
      );
      expect(ethService.latestAveragePriorityFee).toBe(
        expectedAveragePriorityFee,
      );
    });

    it('should set isFeeCurrent to true', () => {
      expect(ethService.isFeeCurrent).toBe(true);
    });
  });
});
