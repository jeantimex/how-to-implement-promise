const MiniPromise = require("./mini-promise");

// -------------------------
//  Example Usage #1
// -------------------------
MiniPromise.resolve(233)
  .then()
  .then(function (value) {
    console.log(value);
  });

// -------------------------
//  Example Usage #2
// -------------------------
function delay(ms) {
  return new MiniPromise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function print() {
  console.time('print');
  await delay(1000);
  console.timeEnd('print');
}

print();
