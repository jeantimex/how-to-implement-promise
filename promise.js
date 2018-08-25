var PENDING = 0;
var RESOLVED = 1;
var REJECTED = 2;

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

function getThen(obj) {
  var then = obj && obj.then;
  if (obj && typeof obj === "object" && typeof then === "function") {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}

function Handler(onResolved, onRejected, promise) {
  this.onResolved = typeof onResolved === "function" ? onResolved : null;
  this.onRejected = typeof onRejected === "function" ? onRejected : null;
  this.promise = promise;
}

function resolve(promise, value) {
  // 非 pending 状态不可变
  if (promise.state !== PENDING) return;

  // promise 和 value 指向同一对象
  // 对应 Promise A+ 规范 2.3.1
  if (value === promise) {
    return reject(
      promise,
      new TypeError("A promise cannot be resolved with itself.")
    );
  }

  // 如果 value 为 Promise，则使 promise 接受 value 的状态
  // 对应 Promise A+ 规范 2.3.2
  if (value && value instanceof Promise && value.then === promise.then) {
    var callbacks = promise.callbacks;

    if (value.state === PENDING) {
      // value 为 pending 状态
      // 将 promise.callbacks 传递 value.callbacks
      // 对应 Promise A+ 规范 2.3.2.1
      value.callbacks = value.callbacks.concat(callbacks);
    } else if (callbacks.length !== 0) {
      // value 为 非pending 状态
      // 使用 value 作为当前 promise，执行 then 注册回调处理
      // 对应 Promise A+ 规范 2.3.2.2、2.3.2.3
      callbacks.forEach(function(callback) {
        handleResolved(value, callback);
      });
      // 清空 then 注册回调处理数组
      value.callbacks = [];
    }
    return;
  }

  // value 是对象或函数
  // 对应 Promise A+ 规范 2.3.3
  if (value && (typeof value === "object" || typeof value === "function")) {
    try {
      // 对应 Promise A+ 规范 2.3.3.1
      var then = getThen(value);
    } catch (error) {
      // 对应 Promise A+ 规范 2.3.3.2
      return reject(promise, error);
    }

    // 如果 then 是函数，将 value 作为函数的作用域 this 调用之
    // 对应 Promise A+ 规范 2.3.3.3
    if (typeof then === "function") {
      try {
        // 执行 then 函数
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

  // 改变 promise 内部状态为 `resolved`
  // 对应 Promise A+ 规范 2.3.3.4、2.3.4
  promise.state = 1;
  promise.value = value;

  // promise 存在 then 注册回调函数
  if (promise.callbacks.length !== 0) {
    promise.callbacks.forEach(function(callback) {
      handleResolved(promise, callback);
    });
    // 清空 then 注册回调处理数组
    promise.callbacks = [];
  }
}

function reject(promise, reason) {
  // 非 pending 状态不可变
  if (promise.state !== PENDING) return;

  // 改变 promise 内部状态为 `rejected`
  promise.state = REJECTED;
  promise.value = reason;

  // 判断是否存在 then(..) 注册回调处理
  if (promise.callbacks.length !== 0) {
    // 异步执行回调函数
    promise.callbacks.forEach(function(callback) {
      handleResolved(promise, callback);
    });
    promise.callbacks = [];
  }
}

function handleResolved(promise, callback) {
  // 异步执行注册回调
  asyncFn(function() {
    var cb =
      promise.state === RESOLVED ? callback.onResolved : callback.onRejected;

    // 传递注册回调函数为空情况
    if (cb === null) {
      if (promise.state === RESOLVED) {
        resolve(callback.promise, promise.value);
      } else {
        reject(callback.promise, promise.value);
      }
      return;
    }

    // 执行注册回调操作
    try {
      var res = cb(promise.value);
    } catch (error) {
      reject(callback.promise, error);
    }

    // 处理链式 then(..) 注册处理函数调用
    resolve(callback.promise, res);
  });
}

function Promise(resolver) {
  if (resolver && typeof resolver !== "function") {
    throw new Error("Promise resolver is not a function");
  }

  // promise 状态变量
  this.state = PENDING;
  // promise 执行结果
  this.value = null;
  // then(..) 注册回调处理数组
  this.callbacks = [];

  // 立即执行 fn 函数
  try {
    resolver(
      value => {
        resolve(this, value);
      },
      reason => {
        reject(this, reason);
      }
    );
  } catch (err) {
    // 处理执行 fn 异常
    reject(this, err);
  }
}

Promise.prototype.then = function(onResolved, onRejected) {
  if (
    (typeof onResolved !== "function" && this.state === RESOLVED) ||
    (typeof onRejected !== "function" && this.state === REJECTED)
  ) {
    return this;
  }

  var res = new Promise(function() {});
  // 使用 onResolved，onRejected 实例化处理对象 Handler
  var callback = new Handler(onResolved, onRejected, res);

  // 当前状态为 pendding，存储延迟处理对象
  if (this.state === PENDING) {
    this.callbacks.push(callback);
    return res;
  }

  // 当前 promise 状态不为 pending
  // 调用 handleResolved 执行onResolved或onRejected回调
  handleResolved(this, callback);

  // 返回新 promise 对象，维持链式调用
  return res;
};

Promise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected);
};

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
