module.exports = {
  require: ['ts-node/register', 'tsconfig-paths/register'],
  'watch-extensions': ['ts'],
  reporter: 'spec',
  recursive: true,
  timeout: 50000
};
