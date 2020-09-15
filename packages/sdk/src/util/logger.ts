export type SimpleLogger = (message: string) => void;
export const noopLogger = () => {};

export interface IFullLogger {
  error: SimpleLogger;
  warn: SimpleLogger;
  report: SimpleLogger;
}

export type Logger = SimpleLogger | IFullLogger;

export function toFullLogger(l: Logger): IFullLogger {
  if (typeof l === 'function') {
    return {
      error: m => l('ERROR: ' + m),
      warn: m => l('WARNING: ' + m),
      report: l,
    };
  } else {
    return l;
  }
}
