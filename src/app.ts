import express, { type Application, type Router } from 'express';
import { PORT } from './env';
import { listen, logger } from './listen';

export class App {
  public api: Application;

  constructor(api: Router) {
    this.api = express();
    this.api.use('/api', api);
  }

  public async run(): Promise<void> {
    this.api.listen(PORT, () => {
      logger.info(`Server is listening on port ${PORT}`);
    });
    await listen();
  }
}

export default App;
