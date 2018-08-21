function Handler (onResolved, onRejected, promise) {
  this.onResolved = typeof onResolved === 'function' ? onResolved : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

function resolve (promise, value) {
  // 非 pending 状态不可变
  if (promise._state !== 0) return;

  // promise 和 value 指向同一对象
  // 对应 Promise A+ 规范 2.3.1
  if (value === promise) {
    return reject( promise, new TypeError('A promise cannot be resolved with itself.') );
  }

  // 如果 value 为 Promise，则使 promise 接受 value 的状态
  // 对应 Promise A+ 规范 2.3.2
  if (value && value instanceof Promise && value.then === promise.then) {
    var deferreds = promise._deferreds

    if (value._state === 0) {
      // value 为 pending 状态
      // 将 promise._deferreds 传递 value._deferreds
      // 偷个懒，使用 ES6 展开运算符
      // 对应 Promise A+ 规范 2.3.2.1
      value._deferreds.push(...deferreds)
    } else if (deferreds.length !== 0) {
      // value 为 非pending 状态
      // 使用 value 作为当前 promise，执行 then 注册回调处理
      // 对应 Promise A+ 规范 2.3.2.2、2.3.2.3
      for (var i = 0; i < deferreds.length; i++) {
        handleResolved(value, deferreds[i]);
      }
      // 清空 then 注册回调处理数组
      value._deferreds = [];
    }
    return;
  }

  // value 是对象或函数
  // 对应 Promise A+ 规范 2.3.3
  if (value && (typeof value === 'object' || typeof value === 'function')) {
    try {
      // 对应 Promise A+ 规范 2.3.3.1
      var then = obj.then;
    } catch (err) {
      // 对应 Promise A+ 规范 2.3.3.2
      return reject(promise, err);
    }

    // 如果 then 是函数，将 value 作为函数的作用域 this 调用之
    // 对应 Promise A+ 规范 2.3.3.3
    if (typeof then === 'function') {
      try {
        // 执行 then 函数
        then.call(value, function (value) {
          resolve(promise, value);
        }, function (reason) {
          reject(promise, reason);
        })
      } catch (err) {
        reject(promise, err);
      }
      return;
    }
  }

  // 改变 promise 内部状态为 `resolved`
  // 对应 Promise A+ 规范 2.3.3.4、2.3.4
  promise._state = 1;
  promise._value = value;

  // promise 存在 then 注册回调函数
  if (promise._deferreds.length !== 0) {
    for (var i = 0; i < promise._deferreds.length; i++) {
      handleResolved(promise, promise._deferreds[i]);
    }
    // 清空 then 注册回调处理数组
    promise._deferreds = [];
  }
}

function reject (promise, reason) {
  // 非 pending 状态不可变
  if (promise._state !== 0) return;

  // 改变 promise 内部状态为 `rejected`
  promise._state = 2;
  promise._value = reason;

  // 判断是否存在 then(..) 注册回调处理
  if (promise._deferreds.length !== 0) {
    // 异步执行回调函数
    for (var i = 0; i < promise._deferreds.length; i++) {
      handleResolved(promise, promise._deferreds[i]);
    }
    promise._deferreds = [];
  }
}

function handleResolved (promise, deferred) {
  // 异步执行注册回调
  asyncFn(function () {
    var cb = promise._state === 1 ?
            deferred.onResolved : deferred.onRejected;

    // 传递注册回调函数为空情况
    if (cb === null) {
      if (promise._state === 1) {
        resolve(deferred.promise, promise._value);
      } else {
        reject(deferred.promise, promise._value);
      }
      return;
    }

    // 执行注册回调操作
    try {
      var res = cb(promise._value);
    } catch (err) {
      reject(deferred.promise, err);
    }

    // 处理链式 then(..) 注册处理函数调用
    resolve(deferred.promise, res);
  });
}

function Promise (fn) {
  // 省略非 new 实例化方式处理
  // 省略 fn 非函数异常处理

  // promise 状态变量
  // 0 - pending
  // 1 - resolved
  // 2 - rejected
  this._state = 0;
  // promise 执行结果
  this._value = null;

  // then(..) 注册回调处理数组
  this._deferreds = [];

  // 立即执行 fn 函数
  try {
    fn(value => {
      resolve(this, value);
    },reason => {
      reject(this, reason);
    })
  } catch (err) {
    // 处理执行 fn 异常
    reject(this, err);
  }
}

Promise.prototype.then = function (onResolved, onRejected) {
  var res = new Promise(function () {});
  // 使用 onResolved，onRejected 实例化处理对象 Handler
  var deferred = new Handler(onResolved, onRejected, res);

  // 当前状态为 pendding，存储延迟处理对象
  if (this._state === 0) {
    this._deferreds.push(deferred);
    return res;
  }

  // 当前 promise 状态不为 pending
  // 调用 handleResolved 执行onResolved或onRejected回调
  handleResolved(this, deferred);

  // 返回新 promise 对象，维持链式调用
  return res;
};

Promise.resolve(233)
  .then()
  .then(function (value) {
    console.log(value)
  })
