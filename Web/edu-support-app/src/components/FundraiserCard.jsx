// FundraiserCard.jsx - Displays a fundraising campaign card with donation, withdrawal, and beneficiary features

import Web3 from 'web3';
import cc from 'cryptocompare';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Input from '@mui/material/Input';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { RouterLink } from '/src/components/router-link';

import { ETHEREUM_URL } from '../pages/BrowseProposalsPage'; // Adjusted Path
import fundraiserContractABI from '../edu-support/abi/Fundraiser-abi.json'; // Adjusted Path

const FundraiserCard = ({ fundraiser, connectedAccount }) => { // Added connectedAccount to props
  // State variables for Web3, accounts, contract instance, UI control, and contract data
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [newFundBeneficiary, setNewFundBeneficiary] = useState('');

  // Contract metadata and donation state
  const [contractData, setContractData] = useState({
    fundName: '',
    fundURL: '',
    fundImageURL: '',
    fundDescription: '',
    fundBeneficiary: '',
    fundTotalDonationsWei: '',
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
      let web3Instance;
      
      // Use connected wallet if available, otherwise fallback to public provider
      if (window.ethereum) {
        web3Instance = new Web3(window.ethereum);
      } else {
        console.warn('MetaMask not detected. Using fallback provider.');
        web3Instance = new Web3(ETHEREUM_URL);
      }

      const fundraiserContract = new web3Instance.eth.Contract(fundraiserContractABI, fundraiser);

      setWeb3(web3Instance);
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
        fundraiserContract.methods.name().call(),
        fundraiserContract.methods.url().call(),
        fundraiserContract.methods.imageURL().call(),
        fundraiserContract.methods.description().call(),
        fundraiserContract.methods.beneficiary().call(),
        fundraiserContract.methods.totalDonations().call(),
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
        const eth = web3Instance.utils.fromWei(fundTotalDonationsWei, 'ether');
        setTotalDonations((prices.USD * eth).toFixed(2));
      } catch (error) {
        console.error('Exchange rate fetch error:', error);
      }

      if (connectedAccount) {
        const userDonationsData = await fundraiserContract.methods
          .myDonations()
          .call({ from: connectedAccount });
        setUserDonations(userDonationsData);

        const owner = await fundraiserContract.methods.owner().call();
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
    if (!connectedAccount) {
      alert("Please connect your wallet to donate.");
      return;
    }
    try {
      const ethTotal = parseFloat(donationAmount) / exchangeRate;
      const donation = web3.utils.toWei(ethTotal.toString(), 'ether');

      const gasEstimate = await contract.methods
        .donate()
        .estimateGas({ from: connectedAccount, value: donation })
        .catch(() => 650000);

      await contract.methods
        .donate()
        .send({ from: connectedAccount, value: donation, gas: gasEstimate });
      alert('Donation successful');
      setOpen(false);
      init(); // Refresh data after donation
    } catch (error) {
      console.error('Donation failed:', error);
      alert('Donation failed');
    }
  };

  // Handle owner withdrawal
  const withdrawFunds = async () => {
    try {
      await contract.methods.withdraw().send({ from: connectedAccount });
      alert('Withdrawal successful');
      setOpen(false);
      init(); // Refresh data after withdrawal
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed');
    }
  };

  // Owner sets new beneficiary address
  const setBeneficiary = async () => {
    try {
      await contract.methods.setBeneficiary(newFundBeneficiary).send({ from: connectedAccount });
      alert('Beneficiary updated');
      setOpen(false);
    } catch (error) {
      console.error('Set beneficiary failed:', error);
      alert('Set beneficiary failed');
    }
  };

  // Render list of user's past donations
  const renderDonationsList = () => {
    if (!userDonations?.values?.length || !userDonations?.dates?.length) {
      return <p>No donations yet from you.</p>;
    }

    return userDonations.values.map((value, i) => {
      const eth = web3.utils.fromWei(value, 'ether');
      const usd = (exchangeRate * eth).toFixed(2);
      const date = new Date(userDonations.dates[i] * 1000).toLocaleDateString();
      return (
        <div key={i}>
          <Typography variant="body2" color="text.secondary">
            On {date}, you donated ${usd}
          </Typography>
        </div>
      );
    });
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
          <Typography gutterBottom variant="h5" component="div">
            {contractData.fundName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {contractData.fundDescription}
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
            Total Raised: ${totalDonations}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
            Beneficiary: {`${contractData.fundBeneficiary.slice(0, 6)}...${contractData.fundBeneficiary.slice(-4)}`}
          </Typography>
        </CardContent>
        <Stack spacing={1} sx={{ p: 2, mt: 'auto' }}>
          <Button variant="contained" onClick={handleOpen}>
            Donate Now
          </Button>
          <Link href={contractData.fundURL} target="_blank" rel="noopener" sx={{ textAlign: 'center' }}>
            Learn More
          </Link>
        </Stack>
      </Card>
    </>
  );
};

export default FundraiserCard; 