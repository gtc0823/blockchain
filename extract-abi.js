const fs = require('fs');
const path = require('path');

const contracts = [
  { name: 'EduDAO', file: 'EduDAO.sol/EduDAO.json' },
  { name: 'Edutoken', file: 'Edutoken.sol/Edutoken.json' },
  { name: 'FundraiserFactory', file: 'FundraiserFactory.sol/FundraiserFactory.json' },
  { name: 'Fundraiser', file: 'Fundraiser.sol/Fundraiser.json' },
];

const outDir = path.join(__dirname, '/Solidity/edu-support/out');
const destDir = path.join(__dirname, '/Web/edu-support-app/src/edu-support/abi');

for (const contract of contracts) {
  const fullPath = path.join(outDir, contract.file);
  const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const abi = raw.abi;

  const destPath = path.join(destDir, `${contract.name}-abi.json`);
  fs.writeFileSync(destPath, JSON.stringify(abi, null, 2));
  console.log(`✅ ${contract.name} ABI written to ${destPath}`);
}
