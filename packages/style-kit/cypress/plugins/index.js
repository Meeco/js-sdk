// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  addMatchImageSnapshotPlugin(on, config);

  // https://github.com/cypress-io/cypress/issues/2102#issuecomment-582829959
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.name === 'chrome') {
      launchOptions.args.push('--window-size=1440,900');
      return launchOptions;
    } else if (browser.name === 'electron') {
      launchOptions.preferences['width'] = 1280;
      launchOptions.preferences['height'] = 1024;
      return launchOptions;
    }
  });
  return config;
};
