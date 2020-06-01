import * as _cryppo from '@meeco/cryppo';

/**
 * Module stubbing does not work across ts project boundaries
 */
export const cryppoFactory = () => ((<any>global).cryppo || _cryppo) as typeof _cryppo;
