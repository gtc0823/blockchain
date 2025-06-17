import Web3 from 'web3';
import { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import { ETHEREUM_URL } from './BrowseProposalsPage';
import fundraiserContractABI from '../edu-support/abi/Fundraiser-abi.json';
import eduDaoContractABI from '../edu-support/abi/EduDAO-abi.json';
import eduDaoContractAddr from '../edu-support/abi/EduDAO-addr.json';

const getStateName = (state) => {
  switch (state) {
    case '0': return 'Pending';
    case '1': return 'Approved';
    case '2': return 'Rejected';
    case '3': return 'Executed';
    default: return 'Unknown';
  }
};

const ProposalDetailPage = () => {
  const navigate = useNavigate();
  const { contractAddress } = useParams();
  const { walletAddress } = useOutletContext();
  const [fundDetails, setFundDetails] = useState(null);
  const [proposalDetails, setProposalDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingPower, setVotingPower] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!contractAddress) return;
      setLoading(true);
      try {
        const web3 = new Web3(ETHEREUM_URL);
        const contract = new web3.eth.Contract(fundraiserContractABI, contractAddress);
        const daoContract = new web3.eth.Contract(eduDaoContractABI, eduDaoContractAddr.address);

        const [
          name,
          url,
          imageURL,
          description,
          beneficiary,
          totalDonations,
          owner,
          proposal
        ] = await Promise.all([
          contract.methods.name().call(),
          contract.methods.url().call(),
          contract.methods.imageURL().call(),
          contract.methods.description().call(),
          contract.methods.beneficiary().call(),
          contract.methods.totalDonations().call(),
          contract.methods.owner().call(),
          daoContract.methods.getProposal(contractAddress).call()
        ]);

        const totalDonationsEth = web3.utils.fromWei(totalDonations, 'ether');
        const votingPower = await daoContract.methods.getVotingPower(contractAddress, walletAddress).call();

        setFundDetails({
          name,
          url,
          imageURL,
          description,
          beneficiary,
          totalDonations: totalDonationsEth,
          owner
        });

        setProposalDetails({
          proposer: proposal.proposer,
          state: proposal.state,
          forVotes: web3.utils.fromWei(proposal.forVotes, 'ether'),
          againstVotes: web3.utils.fromWei(proposal.againstVotes, 'ether'),
          votingEndTime: new Date(proposal.votingEndTime * 1000).toLocaleString(),
          creationTime: new Date(proposal.creationTime * 1000).toLocaleString()
        });

        setVotingPower(web3.utils.fromWei(votingPower, 'ether'));
      } catch (error) {
        console.error("Failed to fetch proposal details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [contractAddress, walletAddress]);

  const handleVote = async (inFavor) => {
    try {
      const web3 = new Web3(ETHEREUM_URL);
      const dao = new web3.eth.Contract(eduDaoContractABI, eduDaoContractAddr.address);
      await dao.methods.vote(contractAddress, inFavor).send({ from: walletAddress });
      alert(`Vote ${inFavor ? 'for' : 'against'} submitted successfully!`);
      navigate(0); // Refresh page
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Failed to submit vote.');
    }
  };

  const handleExecuteProposal = async () => {
    try {
      const web3 = new Web3(ETHEREUM_URL);
      const dao = new web3.eth.Contract(eduDaoContractABI, eduDaoContractAddr.address);
      await dao.methods.executeProposal(contractAddress).send({ from: walletAddress });
      alert('Proposal executed successfully!');
      navigate(0); // Refresh page
    } catch (error) {
      console.error('Execute proposal failed:', error);
      alert('Failed to execute proposal.');
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
        {proposalDetails && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              DAO Proposal Details
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip 
                label={`Status: ${getStateName(proposalDetails.state)}`} 
                color={
                  proposalDetails.state === '0' ? 'primary' :
                  proposalDetails.state === '1' ? 'success' :
                  proposalDetails.state === '2' ? 'error' : 'default'
                }
              />
              <Chip label={`For: ${proposalDetails.forVotes} ETH`} color="success" />
              <Chip label={`Against: ${proposalDetails.againstVotes} ETH`} color="error" />
              <Chip label={`Voting Ends: ${proposalDetails.votingEndTime}`} />
            </Stack>

            {proposalDetails.state === '0' && (
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={() => handleVote(true)}
                  disabled={!walletAddress || votingPower <= 0}
                >
                  Vote For
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={() => handleVote(false)}
                  disabled={!walletAddress || votingPower <= 0}
                >
                  Vote Against
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Your voting power: {votingPower} ETH
                </Typography>
              </Box>
            )}

            {proposalDetails.state === '0' && 
              new Date() > new Date(proposalDetails.votingEndTime) && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleExecuteProposal}
                  sx={{ mt: 2 }}
                >
                  Execute Proposal
                </Button>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="contained" size="large">
            Donate to this Proposal
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProposalDetailPage;
