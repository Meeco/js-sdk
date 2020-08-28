import { isRunningOnWeb } from '../app';

module.exports = isRunningOnWeb ? require('./FileUtils.web') : require('./FileUtils.node');
