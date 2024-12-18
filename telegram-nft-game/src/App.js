import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Game from "./Components/Game";
import Header from "./Components/Header";
import AddCard from "./Components/AddCard"; // Import your new UserForm component
import "./styles/styles.css";

const App = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [gameType, setGameType] = useState(1); // Default game type is Singers (1)

  // Restore wallet address on page load
  useEffect(() => {
    const storedWallet = localStorage.getItem("connectedAccount");
    if (storedWallet) {
      setWalletAddress(storedWallet);
      console.log("Restored wallet address from localStorage:", storedWallet);
    }
  }, []);

  // Handle wallet disconnect
  const handleLogout = (closeModalCallback) => {
    setWalletAddress(null);
    localStorage.removeItem("connectedAccount");
    console.log("User disconnected.");

    if (closeModalCallback) {
      closeModalCallback(); // Close the modal after disconnecting
    }
  };

  // Connect to MetaMask
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
      } catch (err) {
        console.error("MetaMask connection failed:", err);
      }
    } else {
      const dAppUrl = "7ece-37-157-219-187.ngrok-free.app";
      const metamaskDeepLink = `https://metamask.app.link/dapp/${dAppUrl}`;

      window.location.href = metamaskDeepLink;
    }
  };

  return (
    <Router>
      <div className="App">
        <Header
          walletAddress={walletAddress}
          onConnect={connectMetaMask}
          onDisconnect={(closeModal) => handleLogout(closeModal)}
          onGameTypeChange={setGameType}
        />
        
        <Routes>
          {/* Game Page */}
          <Route
            path="/"
            element={<Game gameType={gameType} />} // Default route
          />

          {/* User Form Page */}
          <Route
            path="/add-card"
            element={<AddCard />} // Add your UserForm component
          />
          
          {/* Fallback route for unmatched paths */}
          <Route
            path="*"
            element={<div style={{ textAlign: "center", marginTop: "50px" }}>
              <h2>404 - Page Not Found</h2>
              <p>Sorry, this page doesn’t exist!</p>
            </div>}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
