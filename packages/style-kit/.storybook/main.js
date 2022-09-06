const path = require('path');

module.exports = {
  // this dirname is because we run tests from project root
  stories: ['../stories/*.stories.@(ts|js)'],
  addons: ['@storybook/addon-storysource', '@storybook/addon-controls', '@storybook/addon-docs'],
  logLevel: 'debug',
  webpackFinal: async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.
    // Make whatever fine-grained changes you need
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        {
          loader: 'css-loader',
          options: {
            modules: {
              mode: 'global',
              auto: /\.stories\.\w+$/i,
            },
          },
        },
        'sass-loader',
      ],
      include: path.resolve(__dirname, '../'),
    }); // Return the altered config

    return config;
  },
  core: {
    builder: 'webpack5',
  },
};
