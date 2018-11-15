/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Import LevelSandbox Class =============
|  For simplicity, no DB setup here             |
|  ===========================================*/

const db = require('./levelSandbox.js')

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
    this.getBlockHeight().then(result => {
      if (result === -1) {
        console.log('Adding Genesis block now...')
        this.addBlock(this.createGenesisBlock())
      }
    })
  }

  createGenesisBlock() {
    return new Block("First block in the chain - Genesis block");
  }

  async addBlock(newBlock) {
    try {
      // UTC timestamp
      newBlock.timeStamp = new Date().getTime().toString().slice(0, -3);
      // Get the current blockchain height
      const currentBlockHeight = await this.getBlockHeight()
      // Set new block's height
      newBlock.height = currentBlockHeight + 1;

      // If newBlock is Genesis, no previous hash; otherwise, it has a previous hash
      let prevBlock;
      if (currentBlockHeight > -1) {
        prevBlock = await this.getBlock(currentBlockHeight);
        newBlock.previousBlockHash = prevBlock.hash;
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      } else {
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      }

      // register new block to the chain
      db.addBlocktoChain(JSON.stringify(newBlock));

      // return a value for test function to print
      return JSON.stringify(newBlock).toString()

    } catch(err) {
      console.log('Having error with adding the block. Error: '+err);
    }
  }

  // get block data
  async getBlock(blockHeight) {
    try {
      let block = await db.getLevelDBData(blockHeight)
      // return a JavaScript Object
      return JSON.parse(block)
    } catch(err) {
      console.log('Having error with getting block data. Error: '+err);
    }
  }

  // get blockchain height
  async getBlockHeight() {
    try {
      return await db.getBlockchainHeight()
    } catch(err) {
      console.log('Having error with getting blockchain height. Error: '+err);
    }
  }

  // validate block
  async validateBlock(blockHeight) {
    try {
      let block = await this.getBlock(blockHeight)
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash === validBlockHash) {
        console.log('Block #'+blockHeight+' is valid.')
        return true
      } else {
        console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+' <> '+validBlockHash);
        return false
      }
    } catch(err) {
      console.log('Having error with validating block '+blockHeight+' Error: '+err);
    }
  }

  // validate chain
  async validateChain() {
    try {
      let errorLog = [];
      let blockHeight = await this.getBlockHeight()
      // loop through blocks and validate one after one
      for (var i = 0; i <= blockHeight; i++) {
        let validateResult = await this.validateBlock(i)
        if (validateResult === false) {
          errorLog.push(i);
        }
        // compare blocks hash link; skip the last block, which has no next block
        if (i < blockHeight) {
          let currentHash = await this.getBlock(i).hash;
          let previousHash = await this.getBlock(i+1).previousBlockHash;
          if (currentHash !== previousHash) {
            errorLog.push(i);
          }
        }
      }
      // report the result
      if (errorLog.length > 0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: ' + errorLog);
      } else {
        console.log('No errors detected');
      }
    } catch(err) {
      console.log('Having error with validating this blockchain. Error: '+err);
    }
  }
}

// Pre-set the testing codes in Node REPL
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
