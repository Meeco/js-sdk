import { isRunningOnWeb } from '../app';
import * as fileUtilsNode from './FileUtils.node';
import * as fileUtilsWeb from './FileUtils.web';

export default isRunningOnWeb ? fileUtilsWeb : fileUtilsNode;
