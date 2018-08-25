const Promise = require("./promise");

// -------------------------
//  Example Usage #1
// -------------------------
// (function() {
//   Promise.resolve(233)
//     .then()
//     .then(function(value) {
//       console.log(`#1: ${value}`);
//     });
// })();

// -------------------------
//  Example Usage #2
// -------------------------
// (function() {
//   function delay(ms) {
//     return new Promise(function(resolve) {
//       setTimeout(resolve, ms);
//     });
//   }

//   async function print() {
//     console.time("#2");
//     await delay(1000);
//     console.timeEnd("#2");
//   }

//   print();
// })();

// -------------------------
//  Example Usage #3
// -------------------------
(function() {
  var promise1 = Promise.resolve(3);
  var promise2 = 42;
  var promise3 = new Promise(function(resolve, reject) {
    setTimeout(resolve, 100, "foo");
  });
  var promise4 = new Promise(function(resolve, reject) {
    setTimeout(resolve, 200, "bar");
  });

  console.time("#3");
  Promise.all([promise1, promise2, promise3, promise4]).then(function(values) {
    console.timeEnd("#3");
    console.log(`#3: ${values}`);
  });
})();

// -------------------------
//  Example Usage #4
// -------------------------
// (function() {
//   var promise1 = new Promise(function(resolve, reject) {
//     setTimeout(resolve, 500, "one");
//   });

//   var promise2 = new Promise(function(resolve, reject) {
//     setTimeout(resolve, 100, "two");
//   });

//   console.time("#4");
//   Promise.race([promise1, promise2]).then(function(value) {
//     console.timeEnd("#4");
//     console.log(`#4: ${value}`);
//   });
// })();
