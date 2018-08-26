const Promise = require("./promise");

// -------------------------
//  Example Usage #1
// -------------------------
(function() {
  Promise.resolve(233)
    .then()
    .then(function(value) {
      console.log(`#1: ${value}`);
    });
})();

// -------------------------
//  Example Usage #2
// -------------------------
(function() {
  function delay(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }

  async function print() {
    console.time("#2");
    await delay(1000);
    console.timeEnd("#2");
  }

  print();
})();

// -------------------------
//  Example Usage #3
// -------------------------
(function() {
  const promise1 = Promise.resolve(3);
  const promise2 = 42;
  const promise3 = new Promise(function(resolve, reject) {
    setTimeout(resolve, 100, "foo");
  });
  const promise4 = new Promise(function(resolve, reject) {
    setTimeout(resolve, 200, "bar");
  });

  console.time("#3");
  Promise.all([promise1, promise2, promise3, promise4]).then(function(values) {
    console.log(`#3: ${values}`);
    console.timeEnd("#3");
  });
})();

// -------------------------
//  Example Usage #4
// -------------------------
(function() {
  const promise1 = new Promise(function(resolve, reject) {
    setTimeout(resolve, 500, "one");
  });

  const promise2 = new Promise(function(resolve, reject) {
    setTimeout(resolve, 100, "two");
  });

  console.time("#4");
  Promise.race([promise1, promise2]).then(function(value) {
    console.timeEnd("#4");
    console.log(`#4: ${value}`);
  });
})();
