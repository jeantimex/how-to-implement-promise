# How to Implement Promise

A tutorial to show how to implement Promise using vanilla JavaScript

## Example Usage

Import our Promise
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

## Test with Promise/A+ Specs
```
npm install
npm run test
```
