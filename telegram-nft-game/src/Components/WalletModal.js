import React from "react";
import "../styles/WalletModal.css"; // Add CSS for styling

const WalletModal = ({ isOpen, onClose, onConnectMetaMask, onConnectWalletConnect }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Connect Wallet</h2>
                <div className="wallet-options">
                    <button className="wallet-button" onClick={onConnectMetaMask}>
                        <img src="/images/metamask_logo.png" alt="MetaMask" className="wallet-logo" />
                        MetaMask
                    </button>
                </div>
                <button onClick={onClose} className="modal-close">
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default WalletModal;