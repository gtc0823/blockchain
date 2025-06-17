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
import eduDaoContractABI from '../edu-support/abi/EduDAO-abi.json';
import eduDaoContractAddr from '../edu-support/abi/EduDAO-addr.json';

const CreateProposalPage = () => {
  const { walletAddress } = useOutletContext();
  const [factoryContract, setFactoryContract] = useState(null);
  const [eduDaoContract, setEduDaoContract] = useState(null);

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
      setFactoryContract(factoryInstance);

      const eduDaoInstance = new web3.eth.Contract(
        eduDaoContractABI,
        eduDaoContractAddr.address
      );
      setEduDaoContract(eduDaoInstance);

      setProposal((prev) => ({ ...prev, beneficiary: walletAddress }));
    }
  }, [walletAddress]);

  const handleChange = (e) => {
    setProposal({ ...proposal, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!factoryContract || !eduDaoContract || !walletAddress) {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      // 1. 先用 Factory 建募款專案
      const receipt = await factoryContract.methods
        .createFundraiser(
          proposal.name,
          proposal.url,
          proposal.imageURL,
          proposal.description,
          proposal.beneficiary
        )
        .send({ from: walletAddress });

      // 2. 從事件抓新募款合約地址
      // 事件名稱跟參數依你 Factory 合約事件定義改
      const fundraiserAddress =
        receipt.events.FundraiserCreated.returnValues.fundraiserAddress;

      // 3. 呼叫 EduDAO 建提案
      const daoReceipt = await eduDaoContract.methods
        .createProposal(fundraiserAddress, proposal.description)
        .send({ from: walletAddress });

      // 4. 跳轉到提案詳情頁面
      window.location.href = `/proposal/${fundraiserAddress}`;
    } catch (error) {
      console.error('Error creating proposal:', error);
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
