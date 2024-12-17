import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import ABI from "../abi.json";
import Card from "./Card";

const LoadingSpinner = () => (
  <div className="loading-overlay">
    <div className="spinner"></div>
  </div>
);

const NFTCards = ({ gameType }) => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [rankings, setRankings] = useState({});
  const [availableRanks, setAvailableRanks] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSwapped, setIsSwapped] = useState(false);

  const backendUrl = "https://yo-crush-repo-ktap.vercel.app";
  const contractAddress = "0x0Dfa72B4A32557a1F3EeFc669b40d09b9E7932aa";

  useEffect(() => {
    const storedWallet = localStorage.getItem("connectedAccount");
    if (storedWallet) setWalletAddress(storedWallet);
  }, []);

  const fetchGameData = async () => {
    setLoading(true);
    try {
      const nftResponse = await axios.get(`${backendUrl}/nfts`, {
        params: { gameType },
      });

      const parsedNFTs = nftResponse.data.nfts.map((nft) => {
        const metadata = JSON.parse(nft.metadata);
        return {
          id: nft.id,
          images: [metadata.image, ...(metadata.media || [])],
          metadata,
        };
      });

      setNfts(parsedNFTs);
      setRankings({});
      setAvailableRanks([...Array(parsedNFTs.length).keys()].map((i) => i + 1));
      setActiveIndex(0);

      const leaderboardResponse = await axios.get(`${backendUrl}/leaderboard`, {
        params: { gameType },
      });
      setLeaderboard(leaderboardResponse.data.leaderboard || []);
    } catch (err) {
      setError("Failed to load game data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();
  }, [gameType]);

  const handleAssignRank = (rank) => {
    const currentNFT = nfts[activeIndex]; // Get the active NFT
  
    setRankings((prev) => ({
      ...prev,
      [currentNFT.id]: rank, // Store rank by NFT ID
    }));
  
    setAvailableRanks((prev) => prev.filter((r) => r !== rank));
  
    if (activeIndex < nfts.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      setActiveIndex(null);
    }
  };
  
  const sortNFTsByRank = () => {
    setNfts((prevNfts) => {
      return [...prevNfts].sort((a, b) => {
        const rankA = rankings[a.id] || Infinity; // Fetch rank using NFT ID
        const rankB = rankings[b.id] || Infinity;
        return rankA - rankB; // Sort in ascending order
      });
    });
  };
  
useEffect(() => {
  if (Object.keys(rankings).length === nfts.length) {
    sortNFTsByRank();
  }
}, [rankings]);
const handleCardClick = (index) => {
  if (isSwapped) return; // Prevent further swaps

  if (selectedCardIndex === null) {
    // Select the first card
    setSelectedCardIndex(index);
  } else {
    // Swap NFTs and their ranks
    setNfts((prevNfts) => {
      const updatedNfts = [...prevNfts];
      
      // Swap the two NFTs in the array
      const tempNFT = updatedNfts[selectedCardIndex];
      updatedNfts[selectedCardIndex] = updatedNfts[index];
      updatedNfts[index] = tempNFT;

      return updatedNfts;
    });

    // Swap ranks between the two NFTs using their IDs
    setRankings((prevRankings) => {
      const updatedRankings = { ...prevRankings };
      const idA = nfts[selectedCardIndex].id;
      const idB = nfts[index].id;

      // Swap ranks in the rankings state
      const tempRank = updatedRankings[idA];
      updatedRankings[idA] = updatedRankings[idB];
      updatedRankings[idB] = tempRank;

      return updatedRankings;
    });

    setSelectedCardIndex(null); // Reset selection
    setIsSwapped(true); // Prevent further swaps
  }
};

  const handleSubmitRanks = async () => {
    if (!walletAddress) {
      setError("Please connect your wallet first.");
      return;
    }
  
    if (Object.keys(rankings).length !== nfts.length) {
      setError("Please assign ranks to all NFTs.");
      return;
    }
  
    const rankedIds = Object.entries(rankings)
      .sort(([, rankA], [, rankB]) => rankA - rankB)
      .map(([index]) => nfts[Number(index)].id);
  
    console.log("🚀 Ranked IDs to Submit:", rankedIds); // Debug output
  
    try {
      setLoading(true);
      setError("");
  
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found. Install MetaMask.");
      }
  
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("🚀 Wallet Address:", await signer.getAddress()); // Debug wallet address
  
      const contract = new ethers.Contract(contractAddress, ABI, signer);
  
      // Check contract existence and method
      if (!contract.submit) {
        throw new Error("Contract method 'submit' not found. Check ABI.");
      }
  
      console.log("🚀 Sending transaction...");
      const tx = await contract.submit(rankedIds); // Trigger transaction
      console.log("🚀 Transaction Hash:", tx.hash);
  
      const receipt = await tx.wait(); // Wait for confirmation
      console.log("✅ Transaction Receipt:", receipt);
  
      fetchGameData(); // Refresh data
    } catch (err) {
      console.error("❌ Error submitting rankings:", err.message || err);
      setError(err.message || "Failed to submit rankings. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="nft-cards-container">
      {loading && <LoadingSpinner />}
      {!loading && (
        <>
          {activeIndex !== null ? (
            <Card
              key={nfts[activeIndex]?.id}
              images={nfts[activeIndex]?.images || []}
              name={nfts[activeIndex]?.metadata.name || `NFT ${activeIndex + 1}`}
              isSingle={true}
            >
              <div className="rank-buttons">
                {availableRanks.map((rank) => (
                  <button key={rank} onClick={() => handleAssignRank(rank)}>
                    {`Rank ${rank}`}
                  </button>
                ))}
              </div>
            </Card>
          ) : (
            <div className="cards-wrapper all-ranked">
  {[...nfts]
    .sort((a, b) => {
      // Sort NFTs based on their assigned ranks
      const rankA = rankings[a.id] ?? Infinity; // Default to Infinity for unranked NFTs
      const rankB = rankings[b.id] ?? Infinity;
      return rankA - rankB;
    })
    .map((nft, index) => {
      const rank = rankings[nft.id] || "Not Assigned"; // Fetch rank dynamically
      return (
        <div
          key={nft.id}
          onClick={() => handleCardClick(index)}
          className={`card ${
            selectedCardIndex === index ? "selected-card" : ""
          } ${isSwapped ? "inactive-card" : ""}`}
        >
          <Card
            images={nft.images || []}
            name={nft.metadata.name || `NFT ${index + 1}`}
            isSingle={false}
          >
            <p>Assigned Rank: {rank}</p>
          </Card>
        </div>
      );
    })}
</div>

          )}
          
          {Object.keys(rankings).length === nfts.length && isSwapped && (
            <button
              onClick={handleSubmitRanks}
              className="submit-ranks-button"
              disabled={loading} // Disable while loading
            >
              Submit Rankings
            </button>
          )}

          {/* Leaderboard Section */}
          <div className="leaderboard-container">
            <h2>Leaderboard</h2>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.name}</td>
                    <td>{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default NFTCards;
