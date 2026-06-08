interface QueueItem {
  run: () => void;
}

export type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

export const pLimit = (limit: number): Limiter => {
  let active = 0;
  const queue: QueueItem[] = [];

  const runNext = async () => {
    if (queue.length > 0 && active < limit) {
      const item = queue.shift();
      if (!item) {
        return;
      }

      active++;
      item.run();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            runNext();
          });
      };
      queue.push({ run });
      runNext();
    });
};
