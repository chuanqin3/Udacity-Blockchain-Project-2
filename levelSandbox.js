/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

// Add data to levelDB with key/value pair
async function addLevelDBData(key,value){
  // return new Promise((resolve, reject) => {
  //   db.put(key, value, function(err) {
  //     if (err) return console.log('Block ' + key + ' submission failed', err);
  //     resolve();
  //   })
  // })
  await db.put(key, value)
  // return result
}

// Get data from levelDB with key
function getLevelDBData(key){
  return db.get(key)
}

// Add data to levelDB with value
// This function iterates all the blocks from height 0, when it finishes the last block,
// it will trigger the addLevelDBData() to add a new block at the end of the blockchain
async function addBlocktoChain(value) {
  let i = 0;
  db.createReadStream().on('data', function(data) {
      i++;
    }).on('error', function(err) {
        return console.log('Unable to read data stream!', err)
    }).on('close', function() {
      console.log('Block #' + i);
      addLevelDBData(i, value);
    });
}

// get the blockchain height, aka the number of blocks in this chain
function getBlockchainHeight() {
  let height = -1;
  return new Promise(function(resolve, reject) {
    db.createReadStream()
    .on('data', function (data) {
      // count each object isnerted
      height = height + 1
    })
    .on('error', function (err) {
      // reject with error
      console.log('Oh my!', err)
    })
    .on('close', function () {
      // resolve with the count value
      console.log('getBlockchainHeight() invoked. The block height is ', height)
      resolve(height)
    });
  });
}

module.exports = {
  addLevelDBData,
  getLevelDBData,
  addBlocktoChain,
  getBlockchainHeight,
}
