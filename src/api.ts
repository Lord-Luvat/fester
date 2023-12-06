import express from 'express';

const api = express();

api.get('/eth-mainnet/estimate-fee', (req, res) => {
  try {
    res.status(200).json({
      data: {
        fee: 0.0001,
      },
    });
  } catch (error: unknown) {
    const typedError = error as Error;
    res.status(500).json({
      error: typedError.message,
    });
  }
});

export default api;
