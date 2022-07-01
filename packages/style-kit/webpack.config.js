const path = require('path');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  target: 'web',
  entry: './main.scss',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          MiniCssExtractPlugin.loader,
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
      {
        test: /\.(ttf|eot|svg|woff)$/,
        type: 'asset/inline',
      },
    ],
  },
  resolve: {
    fallback: {
      stream: false,
      crypto: false,
    },
  },
  plugins: [new MiniCssExtractPlugin(), new ProgressBarPlugin()],
  output: {
    filename: 'bundle.js', // extraneous but can't be avoided - it's an artifact of webpack
    path: path.resolve(__dirname, './build'),
  },
};
