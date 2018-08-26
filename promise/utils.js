/**
 * Returns an asynchronous function that is available
 *
 * Promise A+ spec 3.1
 * Ensures that onFulfilled and onRejected execute asynchronously,
 * after the event loop turn in which then is called, and with a fresh stack.
 * This can be implemented with either a "macro-task" mechanism such as setTimeout or setImmediate,
 * or with a "micro-task" mechanism such as MutationObserver or process.nextTick.
 *
 * @returns {Function}
 */
const asyncFn = (function() {
  if (
    typeof process === "object" &&
    process !== null &&
    typeof process.nextTick === "function"
  ) {
    return process.nextTick;
  }

  if (typeof setImmediate === "function") {
    return setImmediate;
  }

  return setTimeout;
})();

module.exports = { asyncFn };
