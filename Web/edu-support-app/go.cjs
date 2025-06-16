const fs = require('fs');
const path = require('path');

const abi = require('C:/Users/Administrator/Desktop/blockchain/blockchain/Solidity/edu-support/out/FundraiserFactory.sol/FundraiserFactory.json').abi;
console.log("Contract ABI loaded successfully");

const deployment = require('C:/Users/Administrator/Desktop/blockchain/blockchain/Solidity/edu-support/broadcast/FundraiserFactory.s.sol/31337/run-latest.json');
const address = deployment.transactions[0].contractAddress;
console.log("Contract address:", address);

fs.writeFileSync(
  path.join(__dirname, './src/edu-support/abi/FundraiserFactory-abi.json'),
  JSON.stringify(abi, null, 2)
);

fs.writeFileSync(
  path.join(__dirname, './src/edu-support/abi/FundraiserFactory-addr.json'),
  JSON.stringify({ address }, null, 2)
);

const abi2 = require('C:/Users/Administrator/Desktop/blockchain/blockchain/Solidity/edu-support/out/Fundraiser.sol/Fundraiser.json').abi;
console.log("Contract ABI loaded successfully");

fs.writeFileSync(
  path.join(__dirname, './src/edu-support/abi/Fundraiser-abi.json'),
  JSON.stringify(abi2, null, 2)
);
