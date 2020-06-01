import * as _cryppo from '@meeco/cryppo';

export const cryppoFactory = () => {
  return (<any>global).cryppo || _cryppo;
};
