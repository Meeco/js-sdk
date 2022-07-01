const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    styles: './src/styles.scss',
    basic: './src/basic/index.ts',
    shares: './src/shares/index.ts',
  },
  mode: 'development',
  devServer: {
    port: 1234,
    hot: true,
  },
  watchOptions: {
    ignored: /.*\.#.*/,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: path.resolve('./tsconfig.json'),
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
    plugins: [new TsconfigPathsPlugin({ configFile: path.resolve('./tsconfig.json') })],
    fallback: {
      stream: false,
      crypto: false,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/index.html'),
      chunks: ['styles'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/basic/index.html'),
      filename: 'basic/index.html',
      chunks: ['styles', 'basic'],
      // emit non-blocking scripts to improve page load appearance
      scriptLoading: 'defer',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/shares/index.html'),
      filename: 'shares/index.html',
      chunks: ['styles', 'shares'],
      scriptLoading: 'defer',
    }),
    new ProgressBarPlugin(),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, '../../docs/sdk-demo'),
  },
};
