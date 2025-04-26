import { useState } from 'react';
import './App.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

function App() {
  const { publicKey, sendTransaction } = useWallet();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = async () => {
    if (!publicKey) return alert('Please connect your wallet');
    if (!to || !amount) return alert('Enter recipient and amount');

    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(to),
          lamports: parseFloat(amount) * 1e9, // SOL to lamports
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      alert('✅ Transaction sent!\nSignature: ' + signature);
      
      // Optionally call webhook or send to Telegram bot here
    } catch (err) {
      console.error('Transaction error:', err);
      alert('❌ Transaction failed. Check console.');
    }
  };

  return (
    <div className="container">
      <h1>Connect Your Solana Wallet</h1>
      <WalletMultiButton />
      <input
        type="text"
        placeholder="Recipient Address"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount (SOL)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend}>✨ Sign & Send</button>
      <p className="powered">Powered by Gigi Labs ⚡</p>
    </div>
  );
}

export default App;
