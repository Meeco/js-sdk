// Storybook integration
import 'cypress-storybook/cypress';
// Visual regression testing
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
  failureThreshold: 0.1, // threshold for entire image
  failureThresholdType: 'percent' // percent of image or number of pixels
});
