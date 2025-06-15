import Web3 from 'web3';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ETHEREUM_URL, fundraiserFactoryContractABI, fundraiserFactoryContractAddr } from './BrowseProposalsPage';

const CreateProposalPage = () => {
  const { walletAddress } = useOutletContext();
  const [contract, setContract] = useState(null);

  const [proposal, setProposal] = useState({
    name: '',
    url: '',
    imageURL: '',
    description: '',
    beneficiary: '',
  });

  useEffect(() => {
    if (walletAddress) {
      const web3 = new Web3(ETHEREUM_URL);
      const factoryInstance = new web3.eth.Contract(
        fundraiserFactoryContractABI,
        fundraiserFactoryContractAddr.address
      );
      setContract(factoryInstance);
      setProposal(prev => ({ ...prev, beneficiary: walletAddress }));
    }
  }, [walletAddress]);

  const handleChange = (e) => {
    setProposal({ ...proposal, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !walletAddress) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      await contract.methods.createFundraiser(
        proposal.name,
        proposal.url,
        proposal.imageURL,
        proposal.description,
        proposal.beneficiary
      ).send({ from: walletAddress });

      alert('Proposal created successfully!');
    } catch (error) {
      console.error('Failed to create proposal:', error);
      alert('Error creating proposal. See console for details.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Create Your Learning Proposal
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          Share your learning goals and get support from the community.
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Proposal Title (e.g., Learn Advanced React)"
              name="name"
              value={proposal.name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Learning Resource URL (e.g., Coursera link)"
              name="url"
              value={proposal.url}
              onChange={handleChange}
              required
            />
             <TextField
              label="Cover Image URL"
              name="imageURL"
              value={proposal.imageURL}
              onChange={handleChange}
            />
            <TextField
              label="Detailed Description & Motivation"
              name="description"
              value={proposal.description}
              onChange={handleChange}
              multiline
              rows={4}
              required
            />
            <TextField
              label="Beneficiary Address"
              name="beneficiary"
              value={proposal.beneficiary}
              onChange={handleChange}
              disabled
              helperText="This is your connected wallet address."
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!walletAddress}
            >
              Submit Proposal
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateProposalPage; 