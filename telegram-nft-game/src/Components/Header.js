import React, { useState } from "react";
import "../styles/Header.css";

const Header = ({ walletAddress, onConnect, onDisconnect, onGameTypeChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const truncatedAddress =
    walletAddress?.slice(0, 6) + "..." + walletAddress?.slice(-4);
  return (
    <header className="header">
      <div className="logo">YoCrush</div>

      <nav className="menu">
        <button onClick={() => onGameTypeChange(1)} className="menu-item">
          Singers
        </button>
        <button onClick={() => onGameTypeChange(2)} className="menu-item">
          Football Players
        </button>
      </nav>

      <div className="wallet-section">
        {walletAddress ? (
          <div
            className="wallet-display"
            onClick={() => setIsModalOpen(true)}
            title="View Wallet Details"
          >
            <span className="wallet-icon"></span>
            <span className="wallet-address">{truncatedAddress}</span>
          </div>
        ) : (
          <button onClick={onConnect} className="connect-wallet-button">
            Connect Wallet
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className="wallet-modal-to-disconnect">
          <div className="wallet-modal-content-to-disconnect">
            <h3>Wallet Address</h3>
            <p>{walletAddress}</p>
            <button onClick={() => onDisconnect(() => setIsModalOpen(false))} className="disconnect-button">
              Disconnect
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="close-modal-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
