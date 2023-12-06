import env from 'dotenv';
// import { listen } from 'app/listen';
import { App } from './app';
import { api } from './api';

env.config();

async function main(): Promise<void> {
  const app = new App(api);
  await app.run();
}

void (async () => {
  await main();
})();
