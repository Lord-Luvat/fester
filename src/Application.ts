import express, { type Application as ExpressApp } from 'express';
import { PORT } from './env';
import {
    ServiceBase,
    type IServiceBase,
    type ServiceBaseProps,
} from './ServiceBase';
import { type IEthService } from './EthService';
import { type IApiService } from './ApiService';
import { type ITonService } from './TonService';

interface IApp extends IServiceBase {
    api: ExpressApp;
    ethService: IEthService;
    tonService: ITonService;
    run: () => Promise<void>;
}

type AppProps = {
    apiService: IApiService;
    ethService: IEthService;
    tonService: ITonService;
} & ServiceBaseProps;

export class App extends ServiceBase implements IApp {
    public api: ExpressApp;
    public ethService: IEthService;
    public tonService: ITonService;

    constructor(props: AppProps) {
        const { apiService, ethService, tonService, ...rest } = props;
        super(rest);
        this.ethService = ethService;
        this.tonService = tonService;
        this.api = express();
        this.api.use('/api', apiService.router);
    }

    public async run(): Promise<void> {
        await this.tonService.init();
        this.api.listen(PORT, () => {
            this._logger.info({}, `Server is listening on port ${PORT}`);
        });
        await this.ethService.setFeeEstimates();
    }
}

export default App;
