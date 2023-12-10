import pino from 'pino';
import pretty from 'pino-pretty';

export interface ILogger {
  fatal: (obj: any, message: string, ...args: any[]) => void;
  error: (obj: any, message: string, ...args: any[]) => void;
  warn: (obj: any, message: string, ...args: any[]) => void;
  info: (obj: any, message: string, ...args: any[]) => void;
  debug: (obj: any, message: string, ...args: any[]) => void;
  trace: (obj: any, message: string, ...args: any[]) => void;
}

export class Logger implements ILogger {
  private readonly _logger;

  constructor() {
    this._logger = pino(
      pretty({
        colorize: true,
        ignore: 'pid,hostname',
        colorizeObjects: true,
      }),
    );
  }

  public fatal(obj: any, message: string, ...args: any[]): void {
    this._logger.fatal(obj, message, ...args);
  }

  public error(obj: any, message: string, ...args: any[]): void {
    this._logger.error(obj, message, ...args);
  }

  public warn(obj: any, message: string, ...args: any[]): void {
    this._logger.warn(obj, message, ...args);
  }

  public info(obj: any, message: string, ...args: any[]): void {
    this._logger.info(obj, message, ...args);
  }

  public debug(obj: any, message: string, ...args: any[]): void {
    this._logger.debug(obj, message, ...args);
  }

  public trace(obj: any, message: string, ...args: any[]): void {
    this._logger.trace(obj, message, ...args);
  }
}

export default Logger;
