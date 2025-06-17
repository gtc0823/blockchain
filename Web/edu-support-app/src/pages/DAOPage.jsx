import Web3 from 'web3';
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
  Box, Container, Paper, Typography, Button, Grid, CircularProgress
} from '@mui/material';

import { ETHEREUM_URL } from './BrowseProposalsPage';
import eduDaoContractABI from '../edu-support/abi/EduDAO-abi.json';
import eduDaoContractAddr from '../edu-support/abi/EduDAO-addr.json';

const DAOPage = () => {
  const { walletAddress } = useOutletContext();
  const [web3, setWeb3] = useState(null);
  const [dao, setDao] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const _web3 = new Web3(ETHEREUM_URL);
      const _dao = new _web3.eth.Contract(eduDaoContractABI, eduDaoContractAddr.address);
      setWeb3(_web3);
      setDao(_dao);

      const all = [];
      let i = 0;
      try {
        while (true) {
          const state = await _dao.methods.getProposalState(i).call();
          const raw = await _dao.methods.getProposal(i).call();
          all.push({
            id: i,
            fundraiser: raw[0],
            proposer: raw[1],
            description: raw[2],
            forVotes: raw[4],
            againstVotes: raw[5],
            executed: raw[6],
            state
          });
          i++;
        }
      } catch {
        // Stop at missing proposal
      }
      setProposals(all);
      setLoading(false);
    };

    init();
  }, []);

  const vote = async (proposalId, inFavor) => {
    try {
      await dao.methods.vote(proposalId, inFavor).send({ from: walletAddress });
      alert('Voted!');
    } catch (err) {
      console.error(err);
      alert('Vote failed.');
    }
  };

  const execute = async (proposalId) => {
    try {
      await dao.methods.executeProposal(proposalId).send({ from: walletAddress });
      alert('Executed!');
    } catch (err) {
      console.error(err);
      alert('Execution failed.');
    }
  };

  if (loading) return (
    <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        DAO Governance Proposals
      </Typography>

      {proposals.length === 0 && (
        <Typography align="center">No proposals yet.</Typography>
      )}

      <Grid container spacing={3}>
        {proposals.map((p) => (
          <Grid item xs={12} md={6} key={p.id}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6">Proposal #{p.id}</Typography>
              <Typography>Proposer: {p.proposer}</Typography>
              <Typography>Description: {p.description}</Typography>
              <Typography>Fundraiser: {p.fundraiser}</Typography>
              <Typography>Status: {p.state === '0' ? 'Pending' : p.executed ? 'Executed' : 'Resolved'}</Typography>
              <Typography>For Votes: {p.forVotes}</Typography>
              <Typography>Against Votes: {p.againstVotes}</Typography>

              {p.state === '0' && !p.executed && (
                <>
                  <Button onClick={() => vote(p.id, true)} variant="contained" color="success" sx={{ mr: 1 }}>
                    Vote For
                  </Button>
                  <Button onClick={() => vote(p.id, false)} variant="contained" color="error">
                    Vote Against
                  </Button>
                  <Button onClick={() => execute(p.id)} variant="outlined" sx={{ mt: 1, ml: 1 }}>
                    Execute Proposal
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default DAOPage;
