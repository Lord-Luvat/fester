import ApiService from '../ApiService';
import { type IEthService } from 'app/EthService';
import { type ILogger } from 'app/Logger';
import express from 'express';
import request from 'supertest';
import { faker } from '@faker-js/faker';

const mockEthService: jest.Mocked<IEthService> = {
  latestBlockNumber: 123456,
  latestBaseFeePerGas: 100,
  latestAveragePriorityFee: '0.0001',
  isFeeCurrent: true,
  listen: jest.fn(),
  fetchBlockDetails: jest.fn(),
  estimateFee: jest.fn(),
};

const mockLogger: jest.Mocked<ILogger> = {
  fatal: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
};

describe('ApiService', () => {
  let apiService: ApiService;
  let app: express.Application;

  beforeEach(() => {
    apiService = new ApiService({
      ethService: mockEthService,
      logger: mockLogger,
    });
    app = express();
    app.use('/api', apiService.router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/eth-mainnet/estimate-fee endpoint', () => {
    it('GET request should return 200 response', async () => {
      const response = await request(app).get('/api/eth-mainnet/estimate-fee');
      expect(response.status).toBe(200);
    });

    it('should return 200 with correct response body', async () => {
      const response = await request(app).get('/api/eth-mainnet/estimate-fee');
      const body = await response.body;
      expect(body).toEqual({
        baseFeePerGas: 100,
        averagePriorityFee: 0.0001,
        latestBlockNumber: 123456,
        isFeeUpdated: true,
      });
    });
  });

  describe('non-existent endpoint', () => {
    it('should return 404', async () => {
      await request(app).get(`/api/${faker.internet.url()}`).expect(404);
    });
  });
});
