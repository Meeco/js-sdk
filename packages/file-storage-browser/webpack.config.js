const path = require('path');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './demo/index.ts',
  mode: 'development',
  devServer: {
    port: 1234,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: path.resolve('./tsconfig.demo.json'),
        },
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({ configFile: path.resolve('./tsconfig.demo.json') })],
    fallback: {
      stream: require.resolve('stream-browserify'),
      crypto: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './demo/index.html'),
    }),
    new ProgressBarPlugin(),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, '../../docs/sdk-demo'),
  },
};
