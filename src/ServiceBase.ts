import type { ILogger } from 'app/Logger';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IServiceBase {}

export type ServiceBaseProps = {
  logger: ILogger;
};

export abstract class ServiceBase implements IServiceBase {
  protected readonly _logger;

  constructor(props: ServiceBaseProps) {
    const { logger } = props;
    this._logger = logger;
  }
}

export default ServiceBase;
