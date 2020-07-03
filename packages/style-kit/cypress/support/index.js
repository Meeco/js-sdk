// Storybook integration
import 'cypress-storybook/cypress';
// Visual regression testing
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand();
