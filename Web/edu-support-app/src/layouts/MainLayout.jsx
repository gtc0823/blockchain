import { Outlet } from 'react-router-dom';

import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { RouterLink } from '/src/components/router-link';

// ----------------------------------------------------------------------

export default function MainLayout({ onConnectWallet, walletAddress }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            EduDAO
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button color="inherit" component={RouterLink} href="/">
              Browse Proposals
            </Button>
            <Button color="inherit" component={RouterLink} href="/create-proposal">
              Create Proposal
            </Button>
            <Button color="inherit" component={RouterLink} href="/dao">
              DAO Governance
            </Button>
          </Box>
          <Button color="inherit" onClick={onConnectWallet}>
            {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet context={{ walletAddress }} />
      </Box>

      <Box component="footer" sx={{ p: 2, mt: 'auto', backgroundColor: 'primary.main', color: 'white', textAlign: 'center' }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} EduDAO. All Rights Reserved.
        </Typography>
      </Box>
    </Box>
  );
} 