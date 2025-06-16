const fs = require('fs');
const path = require('path');

function saveAbiAndAddress(contractName, outDir, broadcastDir) {
  const abi = require(path.join(outDir, `${contractName}.sol`, `${contractName}.json`)).abi;
  console.log(`${contractName} ABI loaded successfully`);

  const deployment = require(path.join(broadcastDir, '31337', 'run-latest.json'));

  // 🔧 精準對應 contractName
  const tx = deployment.transactions.find(tx => tx.contractName === contractName);
  if (!tx) {
    throw new Error(`Contract ${contractName} not found in broadcast log`);
  }
  const address = tx.contractAddress;
  console.log(`${contractName} address:`, address);

  fs.writeFileSync(
    path.join(__dirname, `./src/edu-support/abi/${contractName}-abi.json`),
    JSON.stringify(abi, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, `./src/edu-support/abi/${contractName}-addr.json`),
    JSON.stringify({ address }, null, 2)
  );
}


// 請根據你實際的路徑調整
const outDir = 'C:/Users/Administrator/Desktop/blockchain/blockchain/Solidity/edu-support/out';
const broadcastDirEduDAO = 'C:/Users/Administrator/Desktop/blockchain/blockchain/Solidity/edu-support/broadcast/DeployEduDAO.s.sol';
const broadcastDirFundraiserFactory = 'C:/Users/Administrator/Desktop/blockchain/blockchain/Solidity/edu-support/broadcast/FundraiserFactory.s.sol';

// 針對不同合約及部署路徑呼叫
saveAbiAndAddress('EduDAO', outDir, broadcastDirEduDAO);
saveAbiAndAddress('EduToken', outDir, broadcastDirEduDAO);
saveAbiAndAddress('FundraiserFactory', outDir, broadcastDirFundraiserFactory);

try {
  const abi = require(path.join(outDir, 'Fundraiser.sol', 'Fundraiser.json')).abi;
  console.log('Fundraiser ABI loaded successfully');
  fs.writeFileSync(
    path.join(__dirname, './src/edu-support/abi/Fundraiser-abi.json'),
    JSON.stringify(abi, null, 2)
  );
} catch (e) {
  console.error('Failed to load Fundraiser ABI:', e.message);
}