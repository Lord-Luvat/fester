import env from 'dotenv';
import { listen } from './listen';

env.config();

async function main(): Promise<void> {
  await listen();
}

void (async () => {
  await main();
})();
