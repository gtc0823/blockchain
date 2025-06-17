import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CardActions from '@mui/material/CardActions';

// ABI and Address Imports
import EduDAOABI from '../edu-support/abi/EduDAO-abi.json';
import EduDAOAddress from '../edu-support/abi/EduDAO-addr.json';

const DAOPage = () => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [daoContract, setDaoContract] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [fundraiserAddress, setFundraiserAddress] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [votingStatus, setVotingStatus] = useState({}); // To track voting per proposal
    const [executeStatus, setExecuteStatus] = useState({}); // To track execution per proposal

    // Define the correct chain ID for the Anvil local network
    const ANVIL_CHAIN_ID = 31337;

    const fetchProposals = useCallback(async (contract, userAccount) => {
        if (!contract || !userAccount) return;
        setLoading(true);
        setError('');
        try {
            console.log("Fetching proposals from contract:", contract.address);
            // In ethers v6, this returns a BigInt
            const proposalCount = await contract.nextProposalId();
            console.log("Total proposals (BigInt):", proposalCount);
            const proposalCountNum = Number(proposalCount);
            console.log("Total proposals (number):", proposalCountNum);
            const fetchedProposals = [];

            for (let i = 0; i < proposalCountNum; i++) {
                console.log(`Fetching proposal with ID: ${i}`);
                let p, hasVoted = false; // Default to false

                try {
                    p = await contract.getProposal(i);
                    // Only check vote status if proposal was fetched successfully
                    if (p) {
                      hasVoted = await contract.checkIfVoted(i, userAccount);
                    }
                } catch (e) {
                    console.error(`Failed to fetch details for proposal #${i}:`, e);
                    // If fetching fails, skip this proposal and continue the loop
                    continue; 
                }

                console.log(`Received proposal data for ID ${i}:`, p);

                // Map the array values to an object, handling BigInt for numeric values
                fetchedProposals.push({
                    id: i,
                    proposer: p[0],
                    fundraiserContract: p[1],
                    description: p[2],
                    creationTime: new Date(Number(p[3]) * 1000).toLocaleString(),
                    forVotes: p[4].toString(),
                    againstVotes: p[5].toString(),
                    executed: p[6],
                    hasVoted: hasVoted, // Add hasVoted status
                });
            }
            setProposals(fetchedProposals.reverse()); // Show newest first
        } catch (err) {
            console.error("DETAILED ERROR in fetchProposals:", err);
            setError("Could not fetch proposals. Please check browser console (F12) for detailed errors and ensure contracts are re-deployed.");
        } finally {
            setLoading(false);
        }
    }, []);

    const initConnection = useCallback(async () => {
        if (typeof window.ethereum === 'undefined') {
            setError("MetaMask is not installed. Please install it to use this feature.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // ethers v6 uses BrowserProvider, not Web3Provider
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(web3Provider);

            // Check network
            const network = await web3Provider.getNetwork();
            // In ethers v6, chainId is a BigInt
            if (network.chainId !== BigInt(ANVIL_CHAIN_ID)) {
                setError(`Please switch your wallet to the Anvil network (Chain ID ${ANVIL_CHAIN_ID}).`);
                setLoading(false);
                return;
            }

            // In ethers v6, getSigner() is async and is the standard way to get the account
            const signer = await web3Provider.getSigner();
            const userAccount = await signer.getAddress();
            setAccount(userAccount);

            console.log("Using EduDAO contract at address:", EduDAOAddress.address);
            const contract = new ethers.Contract(EduDAOAddress.address, EduDAOABI, signer);
            setDaoContract(contract);
            console.log("DAO Contract object:", contract);
            
            const memberStatus = await contract.isMember(userAccount);
            setIsMember(memberStatus);

            // Fetch proposals after a successful connection, passing the account directly
            await fetchProposals(contract, userAccount);

        } catch (err) {
            console.error(err);
            setError("Failed to connect to wallet or load contract data.");
        } finally {
            setLoading(false);
        }
    }, [fetchProposals]);

    useEffect(() => {
        initConnection();

        // Set up event listeners for wallet changes
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                // On account change, re-initialize connection
                if (accounts.length > 0) {
                    initConnection();
                } else {
                    // Handle disconnection
                    setAccount(null);
                    setDaoContract(null);
                    setIsMember(false);
                    setError("Please connect your MetaMask wallet.");
                }
            };

            const handleChainChanged = () => {
                // On network change, reload the page to re-initialize everything
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Cleanup listeners on component unmount
            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [initConnection]);
    
    const handleCreateProposal = async (e) => {
        e.preventDefault();
        if (!daoContract || !fundraiserAddress || !description) {
            setError("Please fill in all fields.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const tx = await daoContract.createProposal(fundraiserAddress, description);
            await tx.wait();
            // Reset form and refetch proposals
            setFundraiserAddress('');
            setDescription('');
            await fetchProposals(daoContract, account);
        } catch (err) {
            console.error("Failed to create proposal:", err);
            setError(err.reason || "An error occurred while creating the proposal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (proposalId, voteType) => {
        if (!daoContract) return;
        setVotingStatus(prev => ({ ...prev, [proposalId]: true }));
        setError('');
        try {
            // voteType should be 0 for For, 1 for Against
            const tx = await daoContract.vote(proposalId, voteType);
            await tx.wait();
            // Refetch proposals to update vote counts and status
            await fetchProposals(daoContract, account);
        } catch (err) {
            console.error(`Failed to vote on proposal ${proposalId}:`, err);
            setError(err.reason || `An error occurred while voting on proposal #${proposalId}.`);
        } finally {
            setVotingStatus(prev => ({ ...prev, [proposalId]: false }));
        }
    };

    const handleExecuteProposal = async (proposalId) => {
        if (!daoContract) return;
        setExecuteStatus(prev => ({ ...prev, [proposalId]: true }));
        setError('');
        try {
            const tx = await daoContract.executeProposal(proposalId);
            await tx.wait();
            // Refetch proposals to update status
            await fetchProposals(daoContract, account);
        } catch (err) {
            console.error(`Failed to execute proposal ${proposalId}:`, err);
            setError(err.reason || `An error occurred while executing proposal #${proposalId}.`);
        } finally {
            setExecuteStatus(prev => ({ ...prev, [proposalId]: false }));
        }
    };

    const renderCreateProposalForm = () => {
        if (!isMember) {
            return (
                 <Alert severity="info" sx={{ mt: 2 }}>You must be a DAO member to create a proposal.</Alert>
            );
        }

        return (
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" gutterBottom>Create a New Proposal</Typography>
                <Box component="form" onSubmit={handleCreateProposal} noValidate>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Fundraiser Contract Address"
                        value={fundraiserAddress}
                        onChange={(e) => setFundraiserAddress(e.target.value)}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Proposal Description"
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ mt: 2 }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : "Submit Proposal"}
                    </Button>
                </Box>
            </Paper>
        );
    };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
            DAO Governance
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
            Here, DAO members can submit fundraisers for official approval and vote on them.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {account && renderCreateProposalForm()}

        <Typography variant="h5" sx={{ mt: 5, mb: 3 }}>Proposals</Typography>
        
        {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        ) : proposals.length === 0 ? (
            <Typography>No proposals found.</Typography>
        ) : (
            <Grid container spacing={4}>
                {proposals.map((p) => (
                    <Grid item xs={12} md={6} lg={4} key={p.id}>
                        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" component="div">
                                    Proposal #{p.id}
                                </Typography>
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    Status: {p.executed ? 'Executed' : 'Voting'}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {p.description}
                                </Typography>
                                <Typography variant="body2" component="p" sx={{ wordWrap: 'break-word' }}>
                                    <strong>Proposer:</strong> {p.proposer}
                                </Typography>
                                <Typography variant="body2" component="p" sx={{ wordWrap: 'break-word' }}>
                                    <strong>Fundraiser:</strong> {p.fundraiserContract}
                                </Typography>
                                <Typography variant="body2" component="p">
                                    <strong>Votes For:</strong> {p.forVotes}
                                </Typography>
                                <Typography variant="body2" component="p">
                                    <strong>Votes Against:</strong> {p.againstVotes}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Created: {p.creationTime}
                                </Typography>
                                {/* Voting and Execute buttons will be added in the next step */}
                            </CardContent>
                            {isMember && (
                                <CardActions sx={{ display: 'flex', justifyContent: 'space-around', p: 2 }}>
                                    <Button 
                                        size="small" 
                                        variant="outlined"
                                        onClick={() => handleVote(p.id, true)} // Pass boolean true for FOR
                                        disabled={p.executed || p.hasVoted || votingStatus[p.id]}
                                    >
                                        {votingStatus[p.id] ? <CircularProgress size={20} /> : "Vote For"}
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="outlined" 
                                        color="secondary"
                                        onClick={() => handleVote(p.id, false)} // Pass boolean false for AGAINST
                                        disabled={p.executed || p.hasVoted || votingStatus[p.id]}
                                    >
                                        {votingStatus[p.id] ? <CircularProgress size={20} /> : "Vote Against"}
                                    </Button>
                                    <Button 
                                        size="small" 
                                        variant="contained" 
                                        color="primary"
                                        onClick={() => handleExecuteProposal(p.id)}
                                        disabled={p.executed || executeStatus[p.id]}
                                    >
                                        {executeStatus[p.id] ? <CircularProgress size={20} /> : "Execute"}
                                    </Button>
                                </CardActions>
                            )}
                        </Card>
                    </Grid>
                ))}
            </Grid>
        )}
    </Container>
  );
};

export default DAOPage; 