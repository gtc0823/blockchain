const fs = require('fs');
const path = require('path');

console.log("🚀 Starting ABI and address synchronization script...");

// Define paths
const contractsOutDir = path.resolve(__dirname, '../../Solidity/edu-support/out');
const broadcastDir = path.resolve(__dirname, '../../Solidity/edu-support/broadcast/DeployDAO.s.sol/31337');
const abiTargetDir = path.resolve(__dirname, './src/edu-support/abi');

try {
    // --- Read Deployment Information ---
    const deploymentFile = path.join(broadcastDir, 'run-latest.json');
    if (!fs.existsSync(deploymentFile)) {
        throw new Error(`Deployment file not found at: ${deploymentFile}. Please run the deployment script first.`);
    }
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

    // The deploy script returns (address eduDAO, address fundraiserFactory)
    // These are in the 'returns' object of the broadcast file
    const eduDAOAddress = deployment.returns['0'].value;
    const fundraiserFactoryAddress = deployment.returns['1'].value;
    
    console.log(`✅ EduDAO address found: ${eduDAOAddress}`);
    console.log(`✅ FundraiserFactory address found: ${fundraiserFactoryAddress}`);

    // --- Process Contracts ---
    const contractsToProcess = {
        'EduDAO': { address: eduDAOAddress, abiFile: 'EduDAO.sol/EduDAO.json' },
        'FundraiserFactory': { address: fundraiserFactoryAddress, abiFile: 'FundraiserFactory.sol/FundraiserFactory.json' },
        'Fundraiser': { address: null, abiFile: 'Fundraiser.sol/Fundraiser.json' } // Fundraiser has no single deployed address
    };

    for (const [name, info] of Object.entries(contractsToProcess)) {
        // Copy ABI
        const abiSourcePath = path.join(contractsOutDir, info.abiFile);
        if (!fs.existsSync(abiSourcePath)) {
            throw new Error(`ABI file not found at: ${abiSourcePath}`);
        }
        const abiData = JSON.parse(fs.readFileSync(abiSourcePath, 'utf8')).abi;
        const abiDestPath = path.join(abiTargetDir, `${name}-abi.json`);
        fs.writeFileSync(abiDestPath, JSON.stringify(abiData, null, 2));
        console.log(`📝 Wrote ${name} ABI to ${abiDestPath}`);

        // Copy Address if it exists
        if (info.address) {
            const addrDestPath = path.join(abiTargetDir, `${name}-addr.json`);
            fs.writeFileSync(addrDestPath, JSON.stringify({ address: info.address }, null, 2));
            console.log(`📝 Wrote ${name} address to ${addrDestPath}`);
        }
    }

    console.log("✅ Synchronization complete!");

} catch (error) {
    console.error("❌ An error occurred during synchronization:");
    console.error(error);
    process.exit(1);
}
