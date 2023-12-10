import ApiService from '../ApiService';
import express from 'express';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import { mockEthService } from './ethService.mock';
import { mockLogger } from './logger.mock';

describe('ApiService unit tests', () => {
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
