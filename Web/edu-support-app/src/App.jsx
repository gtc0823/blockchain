import './App.css';
import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import BrowseProposalsPage from './pages/BrowseProposalsPage';
import CreateProposalPage from './pages/CreateProposalPage';
import DAOPage from './pages/DAOPage';
import PageReceipts from './edu-support/Receipts';

function App() {
  const [accounts, setAccounts] = useState([]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask not installed');
      return;
    }
    try {
      const userAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      setAccounts(userAccounts);
    } catch (error) {
      console.error('User denied account access:', error);
    }
  };

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const existingAccounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (existingAccounts.length > 0) {
            setAccounts(existingAccounts);
          }
        } catch (error) {
          console.error('Silent wallet check failed:', error);
        }
      }
    };
    checkWalletConnection();

    const handleAccountsChanged = (newAccounts) => {
      setAccounts(newAccounts);
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return (
    <Routes>
      <Route
        element={
          <MainLayout onConnectWallet={connectWallet} walletAddress={accounts[0]} />
        }
      >
        <Route path="/" element={<BrowseProposalsPage />} />
        <Route path="/create-proposal" element={<CreateProposalPage />} />
        <Route path="/dao" element={<DAOPage />} />
        <Route path="/edu-support/receipts" element={<PageReceipts />} />
      </Route>
    </Routes>
  );
}

export default App;
