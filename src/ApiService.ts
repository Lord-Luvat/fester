import express, { type Router } from 'express';
import ServiceBase, {
  type ServiceBaseProps,
  type IServiceBase,
} from './ServiceBase';
import { type IEthService } from './EthService';

export interface IApiService extends IServiceBase {
  readonly router: Router;
}

type ApiServiceProps = { ethService: IEthService } & ServiceBaseProps;

export class ApiService extends ServiceBase implements IApiService {
  private readonly _router: Router;
  private readonly _ethService: IEthService;

  constructor(props: ApiServiceProps) {
    const { ethService, ...rest } = props;
    super(rest);
    this._ethService = ethService;
    this._router = express.Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Add all routes here
    this._router.get('/eth-mainnet/estimate-fee', this.estimateFee);
  }

  // use arrow function to preserve `this` context in setupRoutes
  private readonly estimateFee = (
    req: express.Request,
    res: express.Response,
  ): void => {
    try {
      this._logger.info(
        req,
        `[${this.constructor.name}] estimateFee called with request:`,
      );
      res.status(200).json({
        baseFeePerGas: Number(this._ethService.latestBaseFeePerGas), // Express doesn't support BigInt
        averagePriorityFee: Number(this._ethService.latestAveragePriorityFee), // Not a BigInt but converting to Number for consistency
        latestBlockNumber: Number(this._ethService.latestBlockNumber), // Express doesn't support BigInt
        isFeeUpdated: this._ethService.isFeeCurrent,
      });
    } catch (error) {
      this._logger.error(
        error,
        `[${this.constructor.name}] estimateFee failed with error:`,
      );
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  public get router(): Router {
    return this._router;
  }
}

export default ApiService;
