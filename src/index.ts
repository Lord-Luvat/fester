import env from 'dotenv';
import app from './app';

env.config();

void (async () => {
  await app.run();
})();
