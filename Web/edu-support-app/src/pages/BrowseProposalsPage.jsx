import Web3 from 'web3';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import FundraiserCard from '../components/FundraiserCard'; // Adjusted path

export const ETHEREUM_URL = 'http://127.0.0.1:8545';
import fundraiserFactoryContractABI from '../edu-support/abi/FundraiserFactory-abi.json'; // Path is correct relative to this file
import fundraiserFactoryContractAddr from '../edu-support/abi/FundraiserFactory-addr.json'; // Adjusted path

export { fundraiserFactoryContractABI, fundraiserFactoryContractAddr };

const BrowseProposalsPage = () => {
  const { walletAddress } = useOutletContext();
  const [funds, setFunds] = useState([]);

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3 = new Web3(ETHEREUM_URL);
        const instance = new web3.eth.Contract(
          fundraiserFactoryContractABI,
          fundraiserFactoryContractAddr.address
        );
        const newFunds = await instance.methods.getAllFundraisers().call();
        setFunds(newFunds);
      } catch (error) {
        console.error(error);
        alert('Failed to load Web3 or contract');
      }
    };
    initWeb3();
  }, []);

  return (
    <Container sx={{ mt: 2 }} maxWidth="xl">
        <Typography variant="h4" align="center" gutterBottom>
          Browse Student Proposals
        </Typography>

        <Grid container spacing={2} justifyContent="center">
          {funds.map((fundraiser) => (
            <Grid
              item // Use item prop for Grid container
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={fundraiser}
            >
              <FundraiserCard fundraiser={fundraiser} connectedAccount={walletAddress} />
            </Grid>
          ))}
        </Grid>
    </Container>
  );
};

export default BrowseProposalsPage; 