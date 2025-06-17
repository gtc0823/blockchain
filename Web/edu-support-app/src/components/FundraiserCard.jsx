// FundraiserCard.jsx - Displays a fundraising campaign card with donation, withdrawal, and beneficiary features

import { ethers } from 'ethers'; // Use ethers instead of Web3
import cc from 'cryptocompare';
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

import { RouterLink } from '/src/components/router-link';

import { ETHEREUM_URL } from '../pages/BrowseProposalsPage'; // Adjusted Path
import fundraiserContractABI from '../edu-support/abi/Fundraiser-abi.json'; // Adjusted Path

const FundraiserCard = ({ fundraiser, connectedAccount }) => {
  // State variables for ethers, contract instance, UI control, and contract data
  const [contract, setContract] = useState(null);
  const [newFundBeneficiary, setNewFundBeneficiary] = useState('');
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false); // State for copy tooltip

  // Contract metadata and donation state
  const [contractData, setContractData] = useState({
    fundName: '',
    fundURL: '',
    fundImageURL: '',
    fundDescription: '',
    fundBeneficiary: '',
    fundTotalDonationsWei: 0n, // Use BigInt for ethers v6
  });

  const [totalDonations, setTotalDonations] = useState(0);
  const [userDonations, setUserDonations] = useState({ values: [], dates: [] });
  const [donationAmount, setDonationAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [open, setOpen] = useState(false);

  // Convert USD donation amount to ETH using exchange rate
  const ethAmount = (donationAmount / exchangeRate || 0).toFixed(4);

  const init = async () => {
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

      // Load contract metadata
      const [
        fundName,
        fundURL,
        fundImageURL,
        fundDescription,
        fundBeneficiary,
        fundTotalDonationsWei,
      ] = await Promise.all([
        fundraiserContract.name(),
        fundraiserContract.url(),
        fundraiserContract.imageURL(),
        fundraiserContract.description(),
        fundraiserContract.beneficiary(),
        fundraiserContract.totalDonations(),
      ]);

      setContractData({
        fundName,
        fundURL,
        fundImageURL,
        fundDescription,
        fundBeneficiary,
        fundTotalDonationsWei,
      });

      try {
        const prices = await cc.price('ETH', ['USD']); // Fetch the current exchange rate of ETH to USD
        setExchangeRate(prices.USD);
        // Use ethers.formatEther for BigInt
        const eth = ethers.formatEther(fundTotalDonationsWei);
        setTotalDonations((prices.USD * eth).toFixed(2));
      } catch (error) {
        console.error('Exchange rate fetch error:', error);
      }

      if (connectedAccount) {
        const userDonationsData = await fundraiserContract.myDonations();
        setUserDonations({
            values: userDonationsData[0], // Assuming values are the first element
            dates: userDonationsData[1]  // Assuming dates are the second
        });

        const owner = await fundraiserContract.owner();
        setIsOwner(owner.toLowerCase() === connectedAccount.toLowerCase());
      }
    } catch (error) {
      console.error(error);
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
    if (!contract || !connectedAccount) {
      alert("Please connect your wallet to donate.");
      return;
    }
    try {
      const ethTotal = parseFloat(donationAmount) / exchangeRate;
      // Use ethers.parseEther for BigInt conversion
      const donation = ethers.parseEther(ethTotal.toString());

      const tx = await contract.donate({ value: donation });
      await tx.wait(); // Wait for transaction to be mined

      alert('Donation successful');
      setOpen(false);
      init(); // Refresh data after donation
    } catch (error) {
      console.error('Donation failed:', error);
      alert(error.reason || 'Donation failed');
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
  const renderDonationsList = () => {
    if (!userDonations?.values?.length || !userDonations?.dates?.length) {
      return <p>No donations yet from you.</p>;
    }

    return userDonations.values.map((value, i) => {
      // Use ethers.formatEther for BigInt
      const eth = ethers.formatEther(value);
      const usd = (exchangeRate * eth).toFixed(2);
      const date = new Date(Number(userDonations.dates[i]) * 1000).toLocaleDateString();
      return (
        <div key={i}>
          <Typography variant="body2" color="text.secondary">
            On {date}, you donated ${usd}
          </Typography>
        </div>
      );
    });
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
          <Typography gutterBottom variant="h5" component="h2">
            <Link
              href={contractData.fundURL}
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
              color="inherit"
            >
              {contractData.fundName}
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contractData.fundDescription}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
              ${totalDonations} Raised
            </Typography>
            <Typography variant="body2" color="text.secondary">
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