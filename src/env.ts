export const PORT = `${Number(process.env.PORT) ?? 3000}`;
export const INFURA_API_KEY = `${process.env.INFURA_API_KEY ?? ''}`;
export const INFURA_ETH_MAINNET_WSS_URL = `${
  process.env.INFURA_ETH_MAINNET_WSS_URL ?? 'wss://mainnet.infura.io/ws/v3/'
}`;
