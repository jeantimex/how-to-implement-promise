//
// Promise
//
// A basic implementation that passes Promise/A+ spec https://promisesaplus.com/
//
// Methods:
//
// - Promise()
// - Promise.prototype.then()
//

const asyncFn = require("./utils").asyncFn;

/**
 * Promise/A+ spec 2.1
 * A promise must be in one of three states: pending, fulfilled, or rejected.
 */
const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

/**
 * Promise Constructor
 *
 * @param {Function} resolver
 */
function Promise(resolver) {
  if (resolver && typeof resolver !== "function") {
    throw new Error("Promise resolver is not a function");
  }

  // initially the promise doesn't have a value
  this.value = null;
  // default promise internal state
  this.state = PENDING;
  // callbacks that are registered via then(...)
  this.handlers = [];

  // call the resolver immediately
  doResolve(this, resolver);
}

/**
 * Promise/A+ spec 2.2
 * A promise must provide a then method to access its current or eventual value or reason
 *
 * Promise/A+ spec 2.2.7
 * then must return a promise
 *
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 * @returns {Promise}
 */
Promise.prototype.then = function(onFulfilled, onRejected) {
  const promise = new Promise(() => {});
  handleThen(this, { promise, onFulfilled, onRejected });
  return promise;
};

// -------------------------------
//  Helpers
// -------------------------------

/**
 * Promise/A+ spec 2.3.3.3
 * If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made,
 * the first call takes precedence, and any further calls are ignored.
 *
 * @param {Promise} promise
 * @param {Function} resolver
 */
function doResolve(promise, resolver) {
  let called = false;

  function wrapFulfill(value) {
    if (called) {
      return;
    }
    called = true;
    resolve(promise, value);
  }

  function wrapReject(reason) {
    if (called) {
      return;
    }
    called = true;
    reject(promise, reason);
  }

  try {
    resolver(wrapFulfill, wrapReject);
  } catch (error) {
    wrapReject(error);
  }
}

/**
 * Promise/A+ spec 2.3
 * The Promise Resolution Procedure
 *
 * @param {Promise} promise
 * @param {*} value
 */
function resolve(promise, value) {
  // Promise/A+ spec 2.1.2, 2.1.3
  // when fulfilled or rejected, a promise must not transition to any other state.
  if (promise.state !== PENDING) {
    return;
  }

  // Promise/A+ spec 2.3.1
  // when promise and value is the same object, reject the promise
  if (value === promise) {
    return reject(
      promise,
      new TypeError("A promise cannot be resolved with itself.")
    );
  }

  // Promise/A+ spec 2.3.3
  // value is object or function
  if (value && (typeof value === "object" || typeof value === "function")) {
    // Promise/A+ spec 2.3.3.1
    // try to get the then function from the thenable object
    let then;

    try {
      then = value.then;
    } catch (error) {
      // Promise/A+ spec 2.3.3.2
      return reject(promise, error);
    }

    // Promise/A+ spec 2.3.2
    // when value is Promise, resolve the promise
    if (then === promise.then && promise instanceof Promise) {
      promise.state = FULFILLED;
      promise.value = value;
      return finale(promise);
    }

    // thenable
    if (typeof then === "function") {
      return doResolve(promise, then.bind(value));
    }
  }

  // not thenable (primitive)
  promise.state = FULFILLED;
  promise.value = value;
  finale(promise);
}

/**
 * Reject the promise with a reason
 *
 * @param {Promise} promise
 * @param {*} reason
 */
function reject(promise, reason) {
  promise.state = REJECTED;
  promise.value = reason;
  finale(promise);
}

/**
 * Handle all the then callbacks registered in a promise
 *
 * @param {Promise} promise
 */
function finale(promise) {
  for (let handler of promise.handlers) {
    handleThen(promise, handler);
  }
  promise.handlers = [];
}

/**
 * Handle a single then(...) callback
 *
 * @param {Promise} promise
 * @param {Object} handler
 */
function handleThen(promise, handler) {
  // take the state of the returned promise
  while (promise.value instanceof Promise && promise.state !== REJECTED) {
    promise = promise.value;
  }

  if (promise.state === PENDING) {
    promise.handlers.push(handler);
  } else {
    // execute handler immediately
    handleResolved(promise, handler);
  }
}

/**
 * Call either the onFulfilled or onRejected function asynchronously
 *
 * @param {Promise} promise
 * @param {Object} handler
 */
function handleResolved(promise, handler) {
  asyncFn(function() {
    const callback =
      promise.state === FULFILLED ? handler.onFulfilled : handler.onRejected;

    if (typeof callback !== "function") {
      if (promise.state === FULFILLED) {
        resolve(handler.promise, promise.value);
      } else {
        reject(handler.promise, promise.value);
      }
      return;
    }

    try {
      const value = callback(promise.value);
      resolve(handler.promise, value);
    } catch (error) {
      reject(handler.promise, error);
    }
  });
}

/**
 * This function is required for running the tests against Promise/A+ specs
 * https://github.com/promises-aplus/promises-tests
 */
Promise.deferred = Promise.defer = function() {
  const dfd = {};
  dfd.promise = new Promise(function(resolve, reject) {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

module.exports = Promise;
