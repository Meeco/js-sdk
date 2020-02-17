/**
 * Given an object and a list of valid keys - return the object with only the whitelisted keys
 */
export const whitelistObject = (whitelistKeys: string[], obj: { [key: string]: any }) =>
  whitelistKeys
    .filter(key => obj.hasOwnProperty(key))
    .reduce((prev, key) => ({ ...prev, [key]: obj[key] }), {});
