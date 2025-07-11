// FundraiserCard.jsx - Displays a fundraising campaign card with donation, withdrawal, and beneficiary features

import { ethers } from 'ethers'; // Use ethers instead of Web3
// import cc from 'cryptocompare'; // No longer needed
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Input from '@mui/material/Input';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip'; // For copy feedback
import IconButton from '@mui/material/IconButton'; // For copy button
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Icon for copy button
import TextField from '@mui/material/TextField'; // Added missing import
import VerifiedIcon from '@mui/icons-material/Verified';

import { RouterLink } from '/src/components/router-link';

import { ETHEREUM_URL } from '../pages/BrowseProposalsPage'; // Adjusted Path
import fundraiserContractABI from '../edu-support/abi/Fundraiser-abi.json'; // Adjusted Path

const FundraiserCard = ({ fundraiser, connectedAccount }) => {
  // State variables for ethers, contract instance, UI control, and contract data
  const [contract, setContract] = useState(null);
  const [newFundBeneficiary, setNewFundBeneficiary] = useState('');
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false); // State for copy tooltip
  const [isDAOApproved, setIsDAOApproved] = useState(false); // State for DAO approval status

  // Contract metadata and donation state
  const [contractData, setContractData] = useState({
    fundName: '',
    fundURL: '',
    fundImageURL: '',
    fundDescription: '',
    fundBeneficiary: '',
    fundTotalDonationsWei: 0n, // Use BigInt for ethers v6
  });

  const [totalDonationsUSD, setTotalDonationsUSD] = useState('0.00');
  const [totalDonationsETH, setTotalDonationsETH] = useState('0');
  const [myTotalDonation, setMyTotalDonation] = useState(0n);
  const [donationAmount, setDonationAmount] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Use a fixed exchange rate for demonstration purposes
  const exchangeRate = 3000; 

  // Convert USD donation amount to ETH using exchange rate
  const ethAmount = (donationAmount / exchangeRate || 0).toFixed(4);

  const init = async () => {
    console.log(`[FundraiserCard init for ${fundraiser}]`); // Log which card is initializing
    try {
      let provider;
      let signer;
      
      if (window.ethereum && connectedAccount) {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
      } else {
        console.warn('MetaMask not detected or not connected. Using fallback provider for read-only data.');
        provider = new ethers.JsonRpcProvider(ETHEREUM_URL);
        signer = provider; // Use provider for read-only calls
      }

      const fundraiserContract = new ethers.Contract(fundraiser, fundraiserContractABI, signer);

      setContract(fundraiserContract);

      console.log(`[FundraiserCard for ${fundraiser}] Fetching contract data...`);
      // Load contract metadata
      const [
        fundName,
        fundURL,
        fundImageURL,
        fundDescription,
        fundBeneficiary,
        fundTotalDonationsWei,
        daoApprovalStatus,
      ] = await Promise.all([
        fundraiserContract.name(),
        fundraiserContract.url(),
        fundraiserContract.imageURL(),
        fundraiserContract.description(),
        fundraiserContract.beneficiary(),
        fundraiserContract.totalDonations(),
        fundraiserContract.isDAOApproved(),
      ]);

      console.log(`[FundraiserCard for ${fundraiser}] Fetched contract data:`, { fundName, fundBeneficiary, daoApprovalStatus });
      
      const ethDonated = ethers.formatEther(fundTotalDonationsWei);
      setTotalDonationsETH(ethDonated);
      
      setContractData({
        fundName,
        fundURL,
        fundImageURL,
        fundDescription,
        fundBeneficiary,
        fundTotalDonationsWei,
      });
      setIsDAOApproved(daoApprovalStatus);

      // Directly use the fixed exchange rate for calculation
      const fallbackRate = 3000;
      setTotalDonationsUSD((fallbackRate * parseFloat(ethDonated)).toFixed(2));

      if (connectedAccount) {
        console.log(`[FundraiserCard for ${fundraiser}] Fetching user-specific data for ${connectedAccount}`);
        // Correctly fetch the total donation for the connected account
        const myDonationWei = await fundraiserContract.myDonations(connectedAccount);
        setMyTotalDonation(myDonationWei);

        const owner = await fundraiserContract.owner();
        setIsOwner(owner.toLowerCase() === connectedAccount.toLowerCase());
      }
    } catch (error) {
      console.error(`[FundraiserCard for ${fundraiser}] A critical error occurred during initialization:`, error);
      // alert('Failed to initialise Web3 or contract');
    }
  };

  // Load fundraiser on mount or address change
  useEffect(() => {
    if (fundraiser) init();
  }, [fundraiser, connectedAccount]); // Rerun init if connectedAccount changes


  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Handle donation transaction
  const donateFunds = async () => {
    console.log(`[FundraiserCard for ${fundraiser}] Attempting to donate...`);

    if (!contract || !connectedAccount) {
      console.error("[Donation Error] Contract or wallet not connected.");
      alert("Please connect your wallet to donate.");
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      console.error("[Donation Error] Invalid donation amount:", donationAmount);
      alert("Please enter a valid donation amount.");
      return;
    }

    // Since cryptocompare can fail, use a fallback exchange rate for demonstration.
    const currentExchangeRate = 3000; // Use fixed rate

    try {
      const ethTotal = parseFloat(donationAmount) / currentExchangeRate;
      const donationInWei = ethers.parseEther(ethTotal.toString());

      console.log("[Donation Info]", {
        usdAmount: donationAmount,
        exchangeRate: currentExchangeRate,
        ethCalculated: ethTotal,
        donationInWei: donationInWei.toString(),
      });

      if (donationInWei <= 0n) {
        console.error("[Donation Error] Calculated donation amount is too small.");
        alert("Donation amount is too small.");
        return;
      }

      console.log("[Donation] Sending transaction to contract...");
      const tx = await contract.donate({ value: donationInWei });
      console.log("[Donation] Transaction sent, waiting for confirmation:", tx.hash);

      await tx.wait();

      console.log("[Donation] Transaction confirmed!");
      alert('Donation successful');
      setOpen(false);
      init(); // Refresh data after donation
    } catch (error) {
      console.error('[Donation Failed] Full error object:', error);
      // Provide a more detailed error message from ethers.js if available
      const reason = error.reason || error.data?.message || error.message || "An unknown error occurred.";
      alert(`Donation failed: ${reason}`);
    }
  };

  // Handle owner withdrawal
  const withdrawFunds = async () => {
    try {
      const tx = await contract.withdraw();
      await tx.wait();
      alert('Withdrawal successful');
      setOpen(false);
      init(); // Refresh data after withdrawal
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert(error.reason || 'Withdrawal failed');
    }
  };

  // Owner sets new beneficiary address
  const setBeneficiary = async () => {
    try {
      const tx = await contract.setBeneficiary(newFundBeneficiary);
      await tx.wait();
      alert('Beneficiary updated');
      setOpen(false);
      init();
    } catch (error) {
      console.error('Set beneficiary failed:', error);
      alert(error.reason || 'Set beneficiary failed');
    }
  };

  // Render list of user's past donations
  const renderMyDonation = () => {
    if (!connectedAccount || myTotalDonation === 0n) {
      return null;
    }

    const eth = ethers.formatEther(myTotalDonation);
    const usd = (exchangeRate * parseFloat(eth)).toFixed(2);
    
    return (
      <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
        You have donated a total of ${usd} to this project. Thank you!
      </Typography>
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fundraiser);
    setCopyTooltipOpen(true);
    setTimeout(() => setCopyTooltipOpen(false), 2000); // Hide tooltip after 2 seconds
  };

  // Main render output
  return (
    <>
      {/* Donation dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Donate to {contractData.fundName}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2">{contractData.fundDescription}</Typography>
            <FormControl>
              <Input
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="0.00"
                startAdornment={<Typography variant="body1" sx={{ mr: 1 }}>$</Typography>}
              />
              <Typography variant="caption">~{ethAmount} ETH</Typography>
            </FormControl>
            {renderMyDonation()}
            {isOwner && (
              <Box mt={2}>
                <Typography variant="h6">Admin Controls</Typography>
                <Button onClick={withdrawFunds} variant="contained" color="secondary" fullWidth>
                  Withdraw Funds
                </Button>
                <TextField 
                  fullWidth
                  label="New Beneficiary Address" 
                  value={newFundBeneficiary}
                  onChange={(e) => setNewFundBeneficiary(e.target.value)}
                  sx={{ mt: 1 }}
                />
                <Button onClick={setBeneficiary} variant="outlined" sx={{ mt: 1 }} fullWidth>
                  Set Beneficiary
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={donateFunds} variant="contained">Donate</Button>
        </DialogActions>
      </Dialog>
      
      <Card sx={{ maxWidth: 345, m: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="140"
          image={contractData.fundImageURL || 'https://via.placeholder.com/345x140?text=EduDAO'}
          alt={contractData.fundName}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography gutterBottom variant="h5" component="div">
              <Link
                href={contractData.fundURL}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                color="inherit"
              >
                {contractData.fundName}
              </Link>
            </Typography>
            {isDAOApproved && (
              <Tooltip title="DAO Approved">
                <VerifiedIcon color="success" />
              </Tooltip>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {contractData.fundDescription}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
              ${totalDonationsUSD} Raised
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
              Beneficiary: {contractData.fundBeneficiary.slice(0, 6)}...{contractData.fundBeneficiary.slice(-4)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, wordBreak: 'break-all' }}>
                Contract: {fundraiser}
              </Typography>
              <Tooltip
                open={copyTooltipOpen}
                title="Copied!"
                placement="top"
                arrow
                leaveDelay={1000} // Hide tooltip after 1s of mouse leave
                onClose={() => setCopyTooltipOpen(false)}
              >
                <IconButton onClick={handleCopy} size="small">
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
        <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button variant="contained" onClick={handleOpen} fullWidth>
            Donate
          </Button>
        </Stack>
      </Card>
    </>
  );
};

export default FundraiserCard; 