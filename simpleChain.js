/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Import LevelSandbox Class =============
|  For simplicity, no DB setup here             |
|  ===========================================*/

const db2 = require('./levelSandbox.js')

/* ===== Block Class ==============================
|  Class with a constructor for block 			       |
|  ===============================================*/

class Block {
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.timeStamp = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor() {
    // check if we need to initiate the Genesis block
    this.currentBlockHeight = this.getBlockHeight();
    if (this.currentBlockHeight === -1) {
      console.log('Adding Genesis block now...')
      this.addBlock(this.createGenesisBlock())
    }
  }

  createGenesisBlock() {
    return new Block("First block in the chain - Genesis block");
  }

  async addBlock(newBlock) {
    // UTC timestamp
    newBlock.timeStamp = new Date().getTime().toString().slice(0, -3);
    // Get the current blockchain height
    // const currentBlockHeight = await this.getBlockHeight()
    // Set new block's height
    newBlock.height = this.currentBlockHeight + 1;

    // If newBlock is Genesis, no previous hash; otherwise, it has a previous hash
    let prevBlock;
    if (this.currentBlockHeight > -1) {
      prevBlock = await this.getBlock(this.currentBlockHeight);
      newBlock.previousBlockHash = prevBlock.hash;
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    }
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

    // register new block to the chain
    db2.addBlocktoChain(JSON.stringify(newBlock));

    // return a value for test function to print
    return JSON.stringify(newBlock).toString()
  }

  // get block data
  async getBlock(blockHeight) {
    let block = await db2.getLevelDBData(blockHeight)
    return block
  }

  // get blockchain height
  async getBlockHeight() {
    await db2.getBlockchainHeight()
  }

  // validate block
  validateBlock(blockHeight){
    return new Promise((resolve, reject) => {
      // get block object
      this.getBlock(blockHeight).then(block => {
        // get block hash
        let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // Compare
        if (blockHash === validBlockHash) {
          console.log('Block #'+blockHeight+' is valid.')
          resolve(true);
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+' <> '+validBlockHash);
          resolve(false);
        }
      }).catch(err => {
        console.log('Having problem with validating block# ' + blockHeight + 'Error: ' + err)
        reject(false);
      })
    })
  }

  // Validate blockchain
  validateChain() {
    let errorLog = [];
    this.getBlockHeight().then(blockchainHeight => {
      // loop through blocks and validate one by one
      for (var i = 0; i <= blockchainHeight; i++) {
        this.validateBlock(i).then(result => {
          // result is either true or false
          if (!result) {
            errorLog.push(i);
          }
          // compare blocks hash link; skip the last block, which has no next block
          if (i === blockchainHeight) {
            let currentHash = this.getBlock(i).hash;
            let previousHash = this.getBlock(i+1).previousBlockHash;
            Promise.all([currentHash, previousHash]).then(hashes => {
              if (hashes[0] !== hashes[1]) {
                errorLog.push(i);
              }
            });
          }
        });
      }
      // report the result
      if (errorLog.length > 0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: ' + errorLog);
      } else {
        console.log('No errors detected');
      }
    }).catch(err => {
      console.log('Having error with validating this chain. Error: ' + err);
    });
  }
}

// Testing codes
let chain = new Blockchain();
(function theLoop (i) {
  setTimeout(async function () {
      let blockTest = new Block("Test Block - " + (i + 1));
      let result = await chain.addBlock(blockTest)
      console.log(result)
      i++;
      if (i < 10) theLoop(i);
  }, 1000);
})(0);
