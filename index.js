const MiniPromise = require('./mini-promise');

// -------------------------
//  Example Usage #1
// -------------------------
MiniPromise.resolve(233)
  .then()
  .then(function(value) {
    console.log(`#1: ${value}`);
  });

// -------------------------
//  Example Usage #2
// -------------------------
function delay(ms) {
  return new MiniPromise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

async function print() {
  console.time('#2: print');
  await delay(1000);
  console.timeEnd('#2: print');
}

print();

// -------------------------
//  Example Usage #3
// -------------------------
var promise1 = MiniPromise.resolve(3);
var promise2 = 42;
var promise3 = new MiniPromise(function(resolve, reject) {
  setTimeout(resolve, 100, 'foo');
});

MiniPromise.all([promise1, promise2, promise3]).then(function(values) {
  console.log(`#3: ${values}`);
});
