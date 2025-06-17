import Web3 from 'web3';
import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';

import { ETHEREUM_URL } from './BrowseProposalsPage';
import fundraiserContractABI from '../edu-support/abi/Fundraiser-abi.json';
import eduDaoContractABI from '../edu-support/abi/EduDAO-abi.json';
import eduDaoContractAddr from '../edu-support/abi/EduDAO-addr.json';

const ProposalDetailPage = () => {
  const { contractAddress } = useParams();
  const { walletAddress } = useOutletContext();
  const [fundDetails, setFundDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!contractAddress) return;
      setLoading(true);
      try {
        const web3 = new Web3(ETHEREUM_URL);
        const contract = new web3.eth.Contract(fundraiserContractABI, contractAddress);

        const [
          name,
          url,
          imageURL,
          description,
          beneficiary,
          totalDonations,
          owner
        ] = await Promise.all([
          contract.methods.name().call(),
          contract.methods.url().call(),
          contract.methods.imageURL().call(),
          contract.methods.description().call(),
          contract.methods.beneficiary().call(),
          contract.methods.totalDonations().call(),
          contract.methods.owner().call()
        ]);

        const totalDonationsEth = web3.utils.fromWei(totalDonations, 'ether');

        setFundDetails({
          name,
          url,
          imageURL,
          description,
          beneficiary,
          totalDonations: totalDonationsEth,
          owner
        });
      } catch (error) {
        console.error("Failed to fetch proposal details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [contractAddress]);

  const submitToDAO = async () => {
    try {
      const web3 = new Web3(ETHEREUM_URL);
      const dao = new web3.eth.Contract(eduDaoContractABI, eduDaoContractAddr.address);
      await dao.methods.createProposal(contractAddress, fundDetails.description).send({ from: walletAddress });
      alert('Proposal submitted to DAO!');
    } catch (error) {
      console.error('Submit to DAO failed:', error);
      alert('Failed to submit to DAO.');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!fundDetails) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 5 }}>
          Proposal not found.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          {fundDetails.name}
        </Typography>
        <Box sx={{ my: 3 }}>
          <img
            src={fundDetails.imageURL || 'https://via.placeholder.com/800x400?text=EduDAO'}
            alt={fundDetails.name}
            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px' }}
          />
        </Box>
        <Typography variant="h5" gutterBottom>
          About this proposal
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {fundDetails.description}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Total Raised: {fundDetails.totalDonations} ETH
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Beneficiary: {fundDetails.beneficiary}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Proposal Owner: {fundDetails.owner}
        </Typography>
        <Link href={fundDetails.url} target="_blank" rel="noopener" sx={{ my: 2, display: 'block' }}>
          Visit Learning Resource
        </Link>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant="contained" size="large">
            Donate to this Proposal
          </Button>
          <Button variant="outlined" onClick={submitToDAO} disabled={!walletAddress}>
            Submit to DAO
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProposalDetailPage;
