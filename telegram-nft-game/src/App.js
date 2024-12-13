import React, { useState, useEffect } from "react";
import Game from "./Components/Game";
import Header from "./Components/Header";
import "./styles/styles.css";

const App = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [gameType, setGameType] = useState(1); // Default game type is Singers (1)

  useEffect(() => {
    const storedWallet = localStorage.getItem("connectedAccount");
    if (storedWallet) {
      setWalletAddress(storedWallet);
      console.log("Restored wallet address from localStorage:", storedWallet);
    }
  }, []);

  const handleLogout = () => {
    setWalletAddress(null);
    localStorage.removeItem("connectedAccount");
    console.log("User disconnected.");
  };

  const connectMetaMask = async () => {
    const isMetaMaskInstalled = typeof window.ethereum !== "undefined";

    if (isMetaMaskInstalled) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const connectedAddress = accounts[0];

        setWalletAddress(connectedAddress);
        localStorage.setItem("connectedAccount", connectedAddress);

        alert(`Connected to account: ${connectedAddress}`);
      } catch (err) {
        console.error("MetaMask connection failed:", err);
      }
    } else {
      const dAppUrl = "7ece-37-157-219-187.ngrok-free.app";
      const metamaskDeepLink = `https://metamask.app.link/dapp/${dAppUrl}`;

      alert("Redirecting to MetaMask. Please return to the app after connecting.");
      window.location.href = metamaskDeepLink;
    }
  };

  return (
    <div className="App">
      <Header
        walletAddress={walletAddress}
        onConnect={connectMetaMask}
        onDisconnect={handleLogout}
        onGameTypeChange={setGameType} // Pass setGameType to Header
      />
      <Game gameType={gameType} /> {/* Pass gameType to Game */}
    </div>
  );
};

export default App;
