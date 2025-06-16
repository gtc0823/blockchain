import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

const DAOPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          DAO Governance
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          This is where the community will vote on proposals. This feature is currently under development.
        </Typography>
        <Box sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.200',
          borderRadius: 2
        }}>
          <Typography variant="h6" color="text.secondary">
            [Voting and Proposal List Coming Soon]
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DAOPage; 