import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import ABI from "../abi.json";

const LoadingSpinner = () => (
  <div className="loading-overlay">
    <div className="spinner"></div>
  </div>
);

const NFTCards = ({ gameType }) => {
  const [nfts, setNfts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [rankings, setRankings] = useState({});
  const [availableRanks, setAvailableRanks] = useState([]);

  const backendUrl = "https://yo-crush-repo-ktap.vercel.app";
  const contractAddress = "0xC1cCeb5adFE832bb5788Db8F10E8b083C037c89b"; // Replace with your contract address

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
      const parsedNFTs = nftResponse.data.nfts.map((nft) => ({
        id: nft.id,
        metadata: JSON.parse(nft.metadata),
      }));
      setNfts(parsedNFTs);

      // Reset rankings and available ranks
      setRankings({});
      setAvailableRanks([...Array(parsedNFTs.length).keys()].map((i) => i + 1));

      // Fetch leaderboard
      const leaderboardResponse = await axios.get(`${backendUrl}/leaderboard`, {
        params: { gameType },
      });
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
  }, [gameType]);

  const handleAssignRank = (index, rank) => {
    setRankings((prev) => ({ ...prev, [index]: rank }));
    setAvailableRanks((prev) => prev.filter((r) => r !== rank));
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

      // Refresh game data after submission
      setRankings({});
      setAvailableRanks([...Array(nfts.length).keys()].map((i) => i + 1));
      await fetchGameData()
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
          <div className="cards-wrapper">
            {nfts.map((nft, index) => (
              <div
                className={`nft-card ${rankings[index] ? "inactive-card" : ""}`}
                key={nft.id}
                style={{
                  opacity: rankings[index] ? 0.5 : 1,
                  pointerEvents: rankings[index] ? "none" : "auto",
                }}
              >
                <h3>{nft.metadata.name || `NFT ${index + 1}`}</h3>
                <img src={nft.metadata.image} alt={nft.metadata.name || "NFT"} />
                <div className="rank-buttons">
                  {!rankings[index] &&
                    availableRanks.map((rank) => (
                      <button
                        key={rank}
                        onClick={() => handleAssignRank(index, rank)}
                        disabled={
                          rankings[index] === rank ||
                          !!Object.values(rankings).includes(rank)
                        }
                      >
                        {`Rank ${rank}`}
                      </button>
                    ))}
                </div>
                {rankings[index] && <p>Assigned Rank: {rankings[index]}</p>}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitRanks}
            className="submit-ranks-button"
            disabled={Object.keys(rankings).length !== nfts.length || loading}
          >
            Submit Rankings
          </button>

          <div className="leaderboard-container">
            <h2>Leaderboard</h2>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.rank}</td>
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
