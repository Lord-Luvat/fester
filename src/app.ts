import { App } from './Application';
import Logger from './Logger';
import { ApiService } from './ApiService';
import { INFURA_API_KEY, INFURA_ETH_MAINNET_WSS_URL, TON_NODE_URI, MNEMONIC } from './env';
import Web3 from 'web3';
import { EthService } from './EthService';
import { TonService } from './TonService';
import { mnemonicToSeedSync } from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { TonClient } from '@ton/ton';

const bip32 = BIP32Factory(ecc);
const seed = mnemonicToSeedSync(MNEMONIC);
const root = bip32.fromSeed(seed);

const logger = new Logger();

const wsProvider = new Web3.providers.WebsocketProvider(
    INFURA_ETH_MAINNET_WSS_URL + INFURA_API_KEY,
);
const web3 = new Web3(wsProvider);

const ethService = new EthService({ web3, logger });

const tonClient = new TonClient({
    endpoint: TON_NODE_URI,
});

const tonService = new TonService({
    client: tonClient,
    root,
    logger,
});

const apiService = new ApiService({ ethService, logger });

const app = new App({ apiService, ethService, tonService, logger });

export default app;
