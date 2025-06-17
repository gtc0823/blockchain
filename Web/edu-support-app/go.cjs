const fs = require('fs');
const path = require('path');

function saveAbiAndAddress(contractName, outDir, broadcastDir) {
  const abiPath = path.join(outDir, `${contractName}.sol`, `${contractName}.json`);
  const broadcastPath = path.join(broadcastDir, '31337', 'run-latest.json');

  const abi = require(abiPath).abi;
  console.log(`${contractName} ABI loaded successfully`);

  const deployment = require(broadcastPath);
  const tx = deployment.transactions.find(tx => tx.contractName === contractName);
  if (!tx) {
    throw new Error(`Contract ${contractName} not found in broadcast log`);
  }

  const address = tx.contractAddress;
  console.log(`${contractName} address:`, address);

  const abiOutputPath = path.join(__dirname, `./src/edu-support/abi/${contractName}-abi.json`);
  const addrOutputPath = path.join(__dirname, `./src/edu-support/abi/${contractName}-addr.json`);

  fs.writeFileSync(abiOutputPath, JSON.stringify(abi, null, 2));
  fs.writeFileSync(addrOutputPath, JSON.stringify({ address }, null, 2));
}

// ✅ 請根據實際路徑調整這裡
const outDir = 'C:/Users/Administrator/Desktop/block/blockchain/Solidity/edu-support/out';
const broadcastDir = 'C:/Users/Administrator/Desktop/block/blockchain/Solidity/edu-support/broadcast/DeployAll.s.sol';

// 針對三個主要合約保存 ABI 和地址
saveAbiAndAddress('EduToken', outDir, broadcastDir);
saveAbiAndAddress('FundraiserFactory', outDir, broadcastDir);
saveAbiAndAddress('EduDAO', outDir, broadcastDir);

// 👉 額外保存 Fundraiser（只是 ABI，無部署）
try {
  const fundraiserAbiPath = path.join(outDir, 'Fundraiser.sol', 'Fundraiser.json');
  const abi = require(fundraiserAbiPath).abi;
  console.log('Fundraiser ABI loaded successfully');
  fs.writeFileSync(
    path.join(__dirname, './src/edu-support/abi/Fundraiser-abi.json'),
    JSON.stringify(abi, null, 2)
  );
} catch (e) {
  console.error('Failed to load Fundraiser ABI:', e.message);
}
