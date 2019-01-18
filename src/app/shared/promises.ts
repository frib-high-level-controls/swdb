/**
 * Utilities to help with native promises
 */

/**
 *  Return a promise that resolves to the elapsed time (ms) for the specified promise to be resolved.
 */
export function timer(p: Promise<void>): Promise<number> {
  const now = process.hrtime();
  return p.then(() => process.hrtime(now)[0]);
}

/**
 * Return a promise that will be resolved with the specified value after the timeout.
 */
export function resolveTimeout<T>(timeout: number, value?: T | PromiseLike<T>) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), timeout);
  });
}

/**
 * Return a promise that will be rejected with the specified reason after the timeout.
 */
export function rejectTimeout(timeout: number, reason?: any) {
  return new Promise<never>((resolve, reject) => {
    setTimeout(() => reject(reason), timeout);
  });
}

/**
 * Return a promise that will be resolved with the specified value immediately.
 */
export function resolveImmediate<T>(value?: T | PromiseLike<T>) {
  return new Promise<T>((resolve) => {
    setImmediate(() => resolve(value));
  });
}

/**
 * Return a promise that will be rejected with the specified reason immediately.
 */
export function rejectImmediate(reason?: any) {
  return new Promise<never>((resolve, reject) => {
    setImmediate(() => reject(reason));
  });
}

/**
 * It is occasionally useful to know the current state of a promise
 * without waiting for the promise to be either fulfilled or rejected.
 *
 * Stack Overflow provided many misleading answers, many of which
 * claimed that the state of a Promise can be determined SYNCHRONOUSLY!
 *
 * This is the most useful and accurate answer I found:
 * https://stackoverflow.com/questions/30564053/how-can-i-synchronously-determine-a-javascript-promises-state
 *
 * My understanding is the state of a promise can only be found ASYNCHRONOUSLY!!
 *
 * Futhermore, using the race() method to determine the state of a Promise
 * was difficult because the following promises resolve too quickly and always
 * win the race:
 * - true (ie using a raw value instead of a promise)
 * - Promise.resolve(true)
 * - new Promise((r) => (process.nextTick(() => (r(true)))))
 *
 * However, the following worked using setImmediate():
 * - new Promise((r) => (setImmediate(() => (r(true)))))
 */

/**
 * For the given promise, p, return true if it is not fulfilled
 * or not rejected, otherwise return false.
 */
export function isPending<T>(p: Promise<T>): Promise<boolean> {
  const pThen = p.then(() => false, () => false);
  return Promise.race([pThen, resolveImmediate(true)]);
}

/**
 * For the given promise, p, return true if it is fulfilled,
 * otherwise return false.
 */
export function isFulfilled<T>(p: Promise<T>): Promise<boolean> {
  const pThen = p.then(() => true, () => false);
  return Promise.race([pThen, resolveImmediate(false)]);
}

/**
 * For the given promise, p, return true if it is rejected,
 * otherwise return false
 */
export function isRejected<T>(p: Promise<T>): Promise<boolean> {
  const pThen = p.then(() => false, () => true);
  return Promise.race([pThen, resolveImmediate(false)]);
}

/**
 * A replacement for the proposed 'finally' method.
 *
 * (see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)
 */
export function finalize<T>(p: Promise<T>, finalizer: () => void | Promise<void>): Promise<T> {
  // Use the native method if available
  if (typeof (p as any).finally === 'function') {
    return (p as any).finally(finalizer);
  }
  return p.then(
    (v) => Promise.resolve(finalizer()).then(() => v),
    (err) => Promise.resolve(finalizer()).then(() => { throw err; }),
  );
}
