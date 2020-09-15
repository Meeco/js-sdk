export type SimpleLogger = (message: string) => void;
export const noopLogger = () => {};

export interface IFullLogger {
  error: SimpleLogger;
  warn: SimpleLogger;
  log: SimpleLogger;
}

export type Logger = SimpleLogger | IFullLogger;

export function toFullLogger(l: Logger): IFullLogger {
  if (typeof l === 'function') {
    return {
      error: m => l('ERROR: ' + m),
      warn: m => l('WARNING: ' + m),
      log: l,
    };
  } else {
    return l;
  }
}
