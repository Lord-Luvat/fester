# **Fester - _A Simple Blockchain Tx Fee Estimator_**

![Alt text](image.png)

## QuickStart

1. run `make environment`
2. set up an Infura account at https://app.infura.io/login
3. copy the .env.example to a .env file, and add the details from Infura
4. run `make start`
5. in browser, navigate to http://localhost:8080/api/eth-mainnet/estimate-fee

## Test

1. run `make test`

## NOTES

The EthService subscribes to NewBlockHeaders which is very reliable, but fetching full transactions details for a block will occasionally fail. As a result the API and service have both a latestBlockNumber and isFeeUpdated. If the full details for a block fails to be retrieved, then isFeeUpdated will be false, reflecting that stated fees are not attributed to the latest observed block, but some previous bock.
