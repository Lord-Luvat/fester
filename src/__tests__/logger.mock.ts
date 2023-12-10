import { type ILogger } from 'app/Logger';

export const mockLogger: jest.Mocked<ILogger> = {
  fatal: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
};
