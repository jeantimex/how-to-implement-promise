//
// Promise/A+ Specs Extension
//
// Methods:
//
// - Promise.prototype.catch()
// - Promise.prototype.finally()
// - promise.resolve()
// - Promise.reject()
// - Promise.all()
// - Promise.race()
//

const Promise = require("./promise");

//
// Prototye Functions
//

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

//
// Static Functions
//

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
  const results = [];
  let completedPromises = 0;

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

module.exports = Promise;
