/**
 * Class for dispatching Threads events
 */
class Events {
  constructor() {
    this.onCompleted = () => null;
    this.onError = () => null;
  }

  /**
   * Set callback
   * @param {String} event `done` or `error`
   * @param {Function} callback
   */
  setCallback(event, callback) {
    // Assign the callback to the event
    switch (event) {
      case 'done':
        this.onCompleted = callback;
        break;
      case 'error':
        this.onError = callback;
        break;
      default:
    }
  }

  /**
   * Call `on completed` callback
   * @param {Object} context thread context
   */
  callOnCompleted(context) {
    this.onCompleted(context);
  }

  /**
   * Call `on error` callback
   * @param {Object} context thread context
   * @param {Error} err error
   */
  callOnError(context, err) {
    this.onError(context, err);
  }
}

export default Events;
