import { App } from './Application';
import Logger from './Logger';
import { ApiService } from './ApiService';
import { INFURA_API_KEY, INFURA_ETH_MAINNET_WSS_URL } from './env';
import Web3 from 'web3';
import { EthService } from './EthService';

const logger = new Logger();

const wsProvider = new Web3.providers.WebsocketProvider(
  INFURA_ETH_MAINNET_WSS_URL + INFURA_API_KEY,
);
const web3 = new Web3(wsProvider);

const ethService = new EthService({ web3, logger });

const apiService = new ApiService({ ethService, logger });

const app = new App({ apiService, ethService, logger });

export default app;
