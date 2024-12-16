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
  const [nfts, setNfts] = useState([]); // Ensure nfts is an empty array by default
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [rankings, setRankings] = useState({});
  const [availableRanks, setAvailableRanks] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0); // Current active NFT index
  const [leaderboard, setLeaderboard] = useState([]);

  const backendUrl = "https://yo-crush-repo-ktap.vercel.app/"; // Replace with your backend URL
  // const backendUrl = "http://localhost:3001"; // Replace with your backend URL
  const contractAddress = "0x0Dfa72B4A32557a1F3EeFc669b40d09b9E7932aa";

  useEffect(() => {
    const storedWallet = localStorage.getItem("connectedAccount");
    if (storedWallet) setWalletAddress(storedWallet);
  }, []);

  const fetchGameData = async () => {
    setLoading(true);
    try {
      // Fetch NFTs
      const nftResponse = await axios.get(`${backendUrl}/nfts`, {
        params: { gameType },
      });
      const parsedNFTs = nftResponse.data.nfts.map((nft) => {
        const metadata = JSON.parse(nft.metadata);
        return {
          id: nft.id,
          images: metadata.image ? [metadata.image, ...(metadata.media || [])] : [], // Ensure `images` is always an array
          metadata,
        };
      });
      console.log("🚀 ~ parsedNFTs ~ parsedNFTs:", parsedNFTs)
      setNfts(parsedNFTs);

      // Reset rankings and available ranks
      setRankings({});
      setAvailableRanks([...Array(parsedNFTs.length).keys()].map((i) => i + 1));
      setActiveIndex(0); // Reset active index

      // Fetch leaderboard
      const leaderboardResponse = await axios.get(`${backendUrl}/leaderboard`, {
        params: { gameType },
      });
      console.log("🚀 ~ fetchGameData ~ leaderboardResponse:", leaderboardResponse)
      setLeaderboard(leaderboardResponse.data.leaderboard || []);
    } catch (err) {
      console.error("Error fetching game data:", err.message);
      setError("Failed to load game data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();

    console.log("🚀 ~ fetchGameData ~ parsedNFTs:", nfts.metadata)
  }, [gameType]);

  const handleAssignRank = (rank) => {
    setRankings((prev) => ({
      ...prev,
      [activeIndex]: rank,
    }));
    setAvailableRanks((prev) => prev.filter((r) => r !== rank));

    // Move to the next NFT or stop if the last NFT is ranked
    if (activeIndex < nfts.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      setActiveIndex(null); // Show all NFTs
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

    try {
      setLoading(true);
      setError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ABI, signer);

      const tx = await contract.submit(rankedIds);
      await tx.wait();

      fetchGameData(); // Refresh data
    } catch (err) {
      console.error("Error submitting rankings:", err.message);
      setError("Failed to submit rankings. Please try again.");
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
            // Show the active NFT
            <Card
              key={nfts[activeIndex]?.id}
              images={nfts[activeIndex]?.images || []} // Fallback to an empty array
              name={nfts[activeIndex]?.metadata.name || `NFT ${activeIndex + 1}`}
            >
              <div className="rank-buttons">
                {availableRanks.map((rank) => (
                  <button
                    key={rank}
                    onClick={() => handleAssignRank(rank)}
                    disabled={!!Object.values(rankings).includes(rank)}
                  >
                    {`Rank ${rank}`}
                  </button>
                ))}
              </div>
            </Card>
          ) : (
            // Show all NFTs with their assigned ranks
            <>
              <div className="cards-wrapper">
                {nfts.map((nft, index) => (
                  <Card
                    key={nft.id}
                    images={nft.images || []} // Fallback to an empty array
                    name={nft.metadata.name || `NFT ${index + 1}`}
                  >
                    <p>Assigned Rank: {rankings[index]}</p>
                  </Card>
                ))}
              </div>
              <button
                onClick={handleSubmitRanks}
                className="submit-ranks-button"
                disabled={Object.keys(rankings).length !== nfts.length || loading}
              >
                Submit Rankings
              </button>
            </>
          )}

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
                {leaderboard
                  .filter((entry) => entry.rank !== 0) // Exclude entries with rank 0
                  .map((entry, index) => (
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
