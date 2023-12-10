const unitFactors = {
  ether: 1e18,
  gwei: 1e9,
  wei: 1,
};

class MockWeb3 {
  private readonly mockSubscriptionHandlers: Record<
    string,
    (data: any) => void
  > = {};

  // Simulates a new block being published so we can fire it off
  // to the subscription handler in the tests
  publishMockEvent = (eventData: any): void => {
    const handler = this.mockSubscriptionHandlers.data;
    if (typeof handler === 'function') {
      handler(eventData);
    }
  };

  eth = {
    subscribe: jest.fn(async (type) => {
      if (type === 'newBlockHeaders') {
        const fakeSubscription = {
          on: jest.fn((event, handler) => {
            this.mockSubscriptionHandlers[event] = handler;
          }),
        };
        return fakeSubscription;
      }
      return null;
    }),
    getBlock: jest.fn(async (blockNumber, fullTransactions = false) => {
      const fakeBlock = {
        number: BigInt(blockNumber),
        baseFeePerGas: '1000000000',
        transactions:
          fullTransactions === true
            ? [
                { gasPrice: '1000000000' },
                { gasPrice: '2000000000' },
                { gasPrice: '3000000000' },
                { gasPrice: '4000000000' },
                { gasPrice: '5000000000' },
              ]
            : [],
      };
      return fakeBlock;
    }) as jest.Mock,
    getGasPrice: jest.fn(async () => '1000000000'),
  };

  utils = {
    toWei: jest.fn((value: string | number, unit: keyof typeof unitFactors) => {
      return String(Number(value) * unitFactors[unit]);
    }),
    fromWei: jest.fn(
      (value: string | number, unit: keyof typeof unitFactors) => {
        return String(Number(value) / unitFactors[unit]);
      },
    ),
  };
}

export default MockWeb3;
