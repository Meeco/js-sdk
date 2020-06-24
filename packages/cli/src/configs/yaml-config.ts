interface IKeyValue {
  [key: string]: any;
}

export interface IYamlConfig<M = IKeyValue, S = IKeyValue> {
  kind: string;
  metadata?: M;
  spec: S;
}

export interface IYamlConfigReader<T> {
  new (...args: any): T;
  fromYamlConfig(config: any): T;
}

/*
 * Decorator for config reader - because TS does not support abstract static methods yet
 * https://stackoverflow.com/a/43674389/5676565
 */
export function ConfigReader<T>() {
  return <U extends IYamlConfigReader<T>>(constructor: U) => {};
}
