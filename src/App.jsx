import React, { useMemo, useEffect, useState, useRef } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';

const App = () => {
  const network = 'mainnet-beta';
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const canvasRef = useRef(null);
  const nodes = useRef([]);
  const animationFrameId = useRef(null);

  // ⚡ Animated glowing nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createNode(x = Math.random() * canvas.width, y = Math.random() * canvas.height) {
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 2 + Math.random(),
      };
    }

    function initNodes() {
      nodes.current = [];
      for (let i = 0; i < 70; i++) {
        nodes.current.push(createNode());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.current.forEach((n, i) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00e0ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.fill();

        for (let j = i + 1; j < nodes.current.length; j++) {
          const n2 = nodes.current[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = 'rgba(0,255,255,0.06)';
            ctx.stroke();
          }
        }
      });
      animationFrameId.current = requestAnimationFrame(animate);
    }

    function handlePointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      nodes.current.push(createNode(e.clientX - rect.left, e.clientY - rect.top));
      if (nodes.current.length > 100) nodes.current.shift();
    }

    resizeCanvas();
    initNodes();
    animate();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  const sendTransaction = async () => {
    const wallet = window?.solana?.isConnected ? window.solana : null;
    if (!wallet || !wallet.publicKey) return alert('Connect wallet');
    if (!amount || !toAddress) return alert('Enter amount + recipient');

    const connection = new Connection(endpoint, 'confirmed');
    const recipient = new PublicKey(toAddress);
    const lamports = Math.floor(parseFloat(amount) * 1e9);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipient,
        lamports,
      })
    );

    transaction.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    try {
      const signed = await wallet.signTransaction(transaction);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig);

      await fetch('http://34.203.188.151:5000/solana-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: '123',
          amount,
          to: toAddress,
          wallet: wallet.publicKey.toString(),
          signature: sig,
        }),
      });

      new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-bonus-reached-2065.mp3').play();
      alert(`Transaction sent! Signature: ${sig}`);
    } catch (err) {
      alert('Transaction failed or cancelled');
    }
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-[-1]" />
          <div className="flex flex-col justify-center items-center min-h-screen text-white bg-transparent px-6 relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-cyan-300 drop-shadow-md text-center">
              Connect Your Solana Wallet
            </h1>

            <WalletMultiButton className="mb-5 !bg-purple-600 hover:!bg-purple-700 transition !text-white !rounded-full !px-6 !py-3 !shadow-lg" />

            <div className="w-full max-w-sm flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Recipient Address"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="w-full px-4 py-2 rounded bg-white/10 border border-cyan-400 text-white placeholder-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input
                type="number"
                placeholder="Amount (SOL)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 rounded bg-white/10 border border-cyan-400 text-white placeholder-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                onClick={sendTransaction}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-full shadow-xl transition"
              >
                ✨ Sign & Send
              </button>
            </div>

            <footer className="mt-10 text-sm text-purple-300 opacity-80">
              Powered by <span className="text-purple-400 font-bold">Gigi Labs ⚡</span>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
