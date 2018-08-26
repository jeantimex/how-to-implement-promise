/**
 * A Promise/A+ Spec Implementation
 *
 * Properties:
 * - Promise.prototype
 *
 * Methods:
 * - Promise.prototype.then()
 * - Promise.prototype.catch()
 * - Promise.prototype.finally()
 * - Promise.all()
 * - Promise.race()
 * - Promise.reject()
 * - promise.resolve()
 */

// -------------------------------
//  Promise States
// -------------------------------

var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;

// -------------------------------
//  Helper Functions
// -------------------------------

/**
 * Returns an asynchronous function that is available
 */
var asyncFn = (function() {
  if (
    typeof process === "object" &&
    process !== null &&
    typeof process.nextTick === "function"
  ) {
    return process.nextTick;
  } else if (typeof setImmediate === "function") {
    return setImmediate;
  }
  return setTimeout;
})();

/**
 * Returns the then function if the input object is thenable
 *
 * @param {Object} obj
 */
function getThen(obj) {
  var then = obj && obj.then;
  if (obj && typeof obj === "object" && typeof then === "function") {
    return then;
  }
}

/**
 * @param {Function} onResolved
 * @param {Function} onRejected
 * @param {Promise} promise
 */
function Handler(onResolved, onRejected, promise) {
  this.onResolved = typeof onResolved === "function" ? onResolved : null;
  this.onRejected = typeof onRejected === "function" ? onRejected : null;
  this.promise = promise;
}

function resolve(promise, value) {
  // If the promise is resolved or rejected already, do nothing
  if (promise.state !== PENDING) return;

  // Promise A+ spec 2.3.1
  // when promise and value is the same object, reject the promise
  if (value === promise) {
    return reject(
      promise,
      new TypeError("A promise cannot be resolved with itself.")
    );
  }

  // Promise A+ spec 2.3.2
  // when value is Promise, resolve the promise
  if (value && value instanceof Promise && value.then === promise.then) {
    var callbacks = promise.callbacks;

    if (value.state === PENDING) {
      // Promise A+ spec 2.3.2.1
      // value is in pending state
      // add promise.callbacks to value.callbacks
      value.callbacks = value.callbacks.concat(callbacks);
    } else if (callbacks.length !== 0) {
      // value is not in pending state
      // execute the callbacks and use value as the current promise
      // Promise A+ spec 2.3.2.2、2.3.2.3
      callbacks.forEach(function(callback) {
        handleResolved(value, callback);
      });
      // clean up the registered callbacks
      value.callbacks = [];
    }
    return;
  }

  // Promise A+ spec 2.3.3
  // value is object or function
  if (value && (typeof value === "object" || typeof value === "function")) {
    try {
      // Promise A+ spec 2.3.3.1
      // try to get the then function from the thenable object
      var then = getThen(value);
    } catch (error) {
      // Promise A+ spec 2.3.3.2
      return reject(promise, error);
    }

    // Promise A+ spec 2.3.3.3
    // if then is a function, make value as the this scope
    if (typeof then === "function") {
      try {
        // execute the then function
        then.call(
          value,
          function(value) {
            resolve(promise, value);
          },
          function(reason) {
            reject(promise, reason);
          }
        );
      } catch (error) {
        reject(promise, error);
      }
      return;
    }
  }

  // Promise A+ spec 2.3.3.4、2.3.4
  // change the promise internal state to `resolved`
  promise.state = FULFILLED;
  promise.value = value;

  // promise has callbacks that were registered via then
  if (promise.callbacks.length !== 0) {
    promise.callbacks.forEach(function(callback) {
      handleResolved(promise, callback);
    });
    // clean up the callbacks
    promise.callbacks = [];
  }
}

function reject(promise, reason) {
  // If the promise is resolved or rejected already, do nothing
  if (promise.state !== PENDING) return;

  // change promise internal state to `rejected`
  promise.state = REJECTED;
  promise.value = reason;

  // check if there is any callback function that is registered via then(...)
  if (promise.callbacks.length !== 0) {
    // execute all the callback functions
    promise.callbacks.forEach(function(callback) {
      handleResolved(promise, callback);
    });
    promise.callbacks = [];
  }
}

function handleResolved(promise, callback) {
  // execute the callbacks asynchronously
  asyncFn(function() {
    var cb =
      promise.state === FULFILLED ? callback.onResolved : callback.onRejected;

    // if the callback is empty
    if (cb === null) {
      if (promise.state === FULFILLED) {
        resolve(callback.promise, promise.value);
      } else {
        reject(callback.promise, promise.value);
      }
      return;
    }

    // execute the registered callback
    try {
      var res = cb(promise.value);
    } catch (error) {
      reject(callback.promise, error);
    }

    // chain reaction
    resolve(callback.promise, res);
  });
}

// -------------------------------
//  Constructor
// -------------------------------

function Promise(resolver) {
  if (resolver && typeof resolver !== "function") {
    throw new Error("Promise resolver is not a function");
  }

  // default promise internal state
  this.state = PENDING;
  // default promise result
  this.value = null;
  // then(..) registered callbacks
  this.callbacks = [];

  // execute the resolver immediately
  try {
    resolver(
      value => {
        resolve(this, value);
      },
      reason => {
        reject(this, reason);
      }
    );
  } catch (error) {
    // handle the exception, if any
    reject(this, error);
  }
}

// -------------------------------
//  Prototype Functions
// -------------------------------

Promise.prototype.then = function(onResolved, onRejected) {
  if (
    (typeof onResolved !== "function" && this.state === FULFILLED) ||
    (typeof onRejected !== "function" && this.state === REJECTED)
  ) {
    return this;
  }

  var promise = new Promise(function() {});
  // instantiate a new handler with onResolved, onRejected
  var callback = new Handler(onResolved, onRejected, promise);

  // if current state is pendding, put the callback to the callback pool
  if (this.state === PENDING) {
    this.callbacks.push(callback);
    return promise;
  }

  // if current promise state is not pending
  // call handleResolved and execute onResolved or onRejected based on the current state
  handleResolved(this, callback);

  // return the new promise, keep then chainable
  return promise;
};

Promise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.finally = function(callback) {
  return this.then(
    function(value) {
      Promise.resolve(callback(value));
    },
    function(error) {
      Promise.resolve(callback(error));
    }
  );
};

// -------------------------------
//  Static Functions
// -------------------------------

Promise.resolve = function(value) {
  if (value instanceof Promise) {
    return value;
  }
  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  if (value instanceof Promise) {
    return value;
  }
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

/**
 * Returns a single Promise that resolves when all of the promises in the iterable argument have resolved
 * or when the iterable argument contains no promises. It rejects with the reason of the first promise that rejects.
 *
 * @param {Promise[]} promises
 */
Promise.all = function(promises) {
  var results = [];
  var completedPromises = 0;

  return new Promise(function(resolve, reject) {
    promises.forEach(function(promise, index) {
      Promise.resolve(promise)
        .then(
          function(value) {
            results[index] = value;
            completedPromises += 1;

            if (completedPromises === promises.length) {
              resolve(results);
            }
          },
          function(reason) {
            reject(reason);
          }
        )
        .catch(function(error) {
          reject(error);
        });
    });
  });
};

/**
 * Returns a promise that resolves or rejects as soon as one of the promises in the iterable resolves or rejects,
 * with the value or reason from that promise.
 *
 * @param {Promise[]} promises
 */
Promise.race = function(promises) {
  return new Promise(function(resolve, reject) {
    promises.forEach(function(promise) {
      Promise.resolve(promise)
        .then(
          function(value) {
            resolve(value);
          },
          function(reason) {
            reject(reason);
          }
        )
        .catch(function(error) {
          reject(error);
        });
    });
  });
};

// -------------------------------
//  Unit Test Functions
// -------------------------------

/**
 * This function is required for running the tests against Promise/A+ specs
 */
Promise.deferred = Promise.defer = function() {
  var dfd = {};
  dfd.promise = new Promise(function(resolve, reject) {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
};

module.exports = Promise;
