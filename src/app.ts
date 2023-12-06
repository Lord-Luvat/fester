import { type Application } from 'express';
import { PORT } from 'app/env';

class App {
  public api: Application;

  constructor(api: Application) {
    this.api = api;
    this.api.use('/api', api);
    this.api.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  }
}

export default App;
