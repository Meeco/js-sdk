import Thread from './Thread';

/**
 * Thread pool for running tasks on parallel
 */
class ThreadPool {
  /**
   * Constructor
   * @param {Number} threads Number of threads
   */
  constructor(threads) {
    this.numberOfThreads = threads;
    this.pendingJobs = [];
    this.threads = [];
    this.toStop = false;

    this.initializeThreads(this.numberOfThreads);
  }

  /**
   * Initialize all the threads
   * @param {Number} numberOfThreads Number of threads
   */
  initializeThreads(numberOfThreads) {
    this.threads = new Array(numberOfThreads).fill(null).map(() => {
      const t = new Thread();
      t.on('done', this.onThreadDone.bind(this));
      t.on('error', (thread, err) => console.error(err));
      return t;
    });
  }

  /**
   * Method to be called when a thread finishes its job
   * @param {Thread} thread thread instance
   */
  onThreadDone(thread) {
    const nextJob = this.pendingJobs.shift();

    // If there's a pending job and the pool is not stopped
    if (nextJob instanceof Function && !this.toStop) {
      thread.run(nextJob);
    }
  }

  /**
   * Execute a function (job)
   * @param {Function} job
   */
  run(job) {
    // Chek params types
    if (!(job instanceof Function)) {
      throw new Error('job must be a funtion');
    }

    if (this.toStop) {
      throw new Error('pool has been stopped');
    }

    // Look for a thread that is not currently working
    const iddleThread = this.threads.find(t => !t.isWorking);

    if (iddleThread) {
      // If found, make it work on the job. Do not await, or this won't be async
      iddleThread.run(job);
    } else {
      // If no thread available, queue the job
      this.pendingJobs.push(job);
    }
  }

  /**
   * Stop the pool. Threads that are still working, will complete their current jobs
   */
  stop() {
    this.pendingJobs = [];
  }
}

export default ThreadPool;
