export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastCallTime = 0;
  private readonly minTimeBetweenCalls: number;

  constructor(requestsPerMinute: number) {
    // Calculate minimum time between calls in ms
    this.minTimeBetweenCalls = (60 * 1000) / requestsPerMinute;
  }

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Calculate time to wait
    const now = Date.now();
    const timeToWait = Math.max(
      0,
      this.lastCallTime + this.minTimeBetweenCalls - now
    );

    if (timeToWait > 0) {
      console.log(
        `Rate limiting - waiting ${(timeToWait / 1000).toFixed(1)} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }

    const fn = this.queue.shift();
    if (fn) {
      this.lastCallTime = Date.now();
      try {
        await fn();
      } catch (error) {
        console.error("Error in rate-limited function:", error);
      }
    }

    // Process next item in queue
    this.processQueue();
  }
}
