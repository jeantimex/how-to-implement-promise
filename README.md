# How to Implement Promise

[![Build Status](https://travis-ci.org/jeantimex/how-to-implement-promise.svg?branch=master)](https://travis-ci.org/jeantimex/how-to-implement-promise)

In this tutorial, you will learn how to implement a Promise that is Promises/A+ compliant.

## Source code structure

## Example Usage

```javascript
const Promise = require("./promise");
```

### Basic
```javascript
Promise.resolve(233)
  .then()
  .then(function(value) {
    console.log(value);
  });
```

### setTimeout
```javascript
function delay(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

(async function print() {
  console.time("setTimeout");
  await delay(1000);
  console.timeEnd("setTimeout");
})();
```

### Promise.all
```javascript
var promise1 = Promise.resolve(3);
var promise2 = 42;
var promise3 = new Promise(function(resolve, reject) {
  setTimeout(resolve, 100, "foo");
});
var promise4 = new Promise(function(resolve, reject) {
  setTimeout(resolve, 200, "bar");
});

Promise.all([promise1, promise2, promise3, promise4]).then(function(values) {
  console.log(values);
});
```

### Promise.race
```javascript
var promise1 = new Promise(function(resolve, reject) {
  setTimeout(resolve, 500, "one");
});

var promise2 = new Promise(function(resolve, reject) {
  setTimeout(resolve, 100, "two");
});

Promise.race([promise1, promise2]).then(function(value) {
  console.log(value);
});
```

## Test with Promise/A+ specs

The Promises/A+ compliance test suite can be found [here](https://github.com/promises-aplus/promises-tests).
```
npm install
npm run test
```

## References

1. [Promise/A+ Specs](https://promisesaplus.com/)
2. [MDN - Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
3. [Implementing Promise](https://www.promisejs.org/implementing/)
4. [Implementing promises from scratch](https://www.mauriciopoppe.com/notes/computer-science/computation/promises/)
5. [Promises, Next-Ticks and Immediates](https://jsblog.insiderattack.net/promises-next-ticks-and-immediates-nodejs-event-loop-part-3-9226cbe7a6aa)
6. [深入理解 Promise (中)](http://coderlt.coding.me/2016/12/04/promise-in-depth-an-introduction-2/)
7. [解读Promise内部实现原理](https://juejin.im/post/5a30193051882503dc53af3c)
