import { useMemo } from "react";
import {Route, Routes, BrowserRouter as Router} from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { getLedgerWallet,getPhantomWallet,getSolflareWallet,getSolletExtensionWallet } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
// import { WalletConnect } from './wallet'
// import '@solana/wallet-adapter-react-ui/styles.css';
import 'bootstrap'
import './bootstrap.min.css';
import './chunk.css'
import 'antd/dist/antd.css';
import './assets/styles.scss'

import {Home, Invite} from './pages'

export default function App(){
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [getPhantomWallet(),getSolletExtensionWallet(),getSolflareWallet(),getLedgerWallet()], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Router>
            <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="invite">
                <Route path=":id" element={<Invite></Invite>}></Route>
              </Route>     
            </Routes>
          </Router>
          </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );  
}