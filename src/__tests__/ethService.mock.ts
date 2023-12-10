import { type IEthService } from '../EthService';

export const mockEthService: jest.Mocked<IEthService> = {
  latestBlockNumber: 123456,
  latestBaseFeePerGas: 100,
  latestAveragePriorityFee: '0.0001',
  isFeeCurrent: true,
  listen: jest.fn(),
  fetchBlockDetails: jest.fn(),
  setFeeEstimates: jest.fn(),
};
