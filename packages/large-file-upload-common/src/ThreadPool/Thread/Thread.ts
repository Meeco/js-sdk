import Events from './Thread.events';
import Status from './Thread.status';

class Thread {
  status: any;
  events: any;
  constructor() {
    this.status = Status.IDDLE;
    this.events = new Events();
  }

  /**
   * Is thread working
   */
  get isWorking() {
    return this.status === Status.WORKING;
  }

  /**
   * Event handling
   * @param {String} event `done` or `error`
   * @param {Function} callback
   */
  on(event, callback) {
    // Check params types
    if (typeof event !== 'string') {
      throw new Error('event must be a string');
    }

    if (!(callback instanceof Function)) {
      throw new Error('callback must be a funtion');
    }

    // Set event callback
    this.events.setCallback(event, callback);
  }

  /**
   * Run a job
   * @param {Function} job
   */
  async run(job) {
    // Check job type
    if (!(job instanceof Function)) {
      throw new Error('job must be a funtion');
    }

    // Set as currently working
    this.status = Status.WORKING;

    try {
      // Run the job
      await job();

      // Set it as iddle
      this.status = Status.COMPLETED;
      this.events.callOnCompleted(this);
    } catch (error) {
      this.status = Status.FAILED;
      this.events.callOnError(this, error);
    }
  }
}

export default Thread;
