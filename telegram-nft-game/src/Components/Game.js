import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import ABI from "../abi.json";
import Card from "./Card";
// import LeaderboardModal from "./LeaderboardModal";

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
  // const [isModalOpen, setIsModalOpen] = useState(false);

  const backendUrl = "https://yo-crush-repo-ktap.vercel.app";
  const contractAddress = "0x1D3A65b3a41b007451364F7baD8C956C4A29d6Fc";

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
          images: [metadata.image, ...(metadata.media ? metadata.media.split(",") : [])],
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
    console.log(nfts);    
  }, [gameType]);

  const handleAssignRank = (rank) => {
    const currentNFT = nfts[activeIndex]; // Get the active NFT

    console.log(nfts);    

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


  const sortNFTsByPoints = () => {
    return [...nfts].sort((a, b) => {
      const pointsA = parseInt(a.metadata.statistics?.totalPoints || 0, 10);
      const pointsB = parseInt(b.metadata.statistics?.totalPoints || 0, 10);
      return pointsB - pointsA; // Sort in descending order
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

    // Extract NFT IDs sorted by their assigned ranks
    const rankedIds = Object.keys(rankings)
      .sort((a, b) => rankings[a] - rankings[b]) // Sort IDs by rank
      .map((id) => id); // Map to sorted NFT IDs

    console.log("🚀 Ranked IDs to Submit:", rankedIds);

    try {
      setLoading(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("Ethereum provider not found. Install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("🚀 Wallet Address:", await signer.getAddress());

      const contract = new ethers.Contract(contractAddress, ABI, signer);

      // Check if the method exists
      if (!contract.submit) {
        throw new Error("Contract method 'submit' not found. Check ABI.");
      }

      console.log("🚀 Sending transaction...");
      const tx = await contract.submit(rankedIds); // Submit ranked NFT IDs
      console.log("🚀 Transaction Hash:", tx.hash);

      const receipt = await tx.wait(); // Wait for confirmation
      console.log("✅ Transaction Receipt:", receipt);

      fetchGameData(); // Refresh data after submission
    } catch (err) {
      console.error("❌ Error submitting rankings:", err.message || err);
      setError(err.message || "Failed to submit rankings. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // Check if leaderboard button should be active
  const filteredLeaderboard = leaderboard.filter((entry) => entry.name !== "Token0");
  const isLeaderboardButtonDisabled =
  filteredLeaderboard.length === 0 ||
  filteredLeaderboard.every((entry) => entry.name === filteredLeaderboard[0].name);

  const getLeaderboardPosition = (nftId) => {
    console.log(leaderboard);
    
    const position = leaderboard.findIndex((entry) => entry.rank === nftId);
    return position >= 0 ? position + 1 : null; // Return position (1-based) or null if not found
  };
  return (
    <>
    <div className="nft-cards-container">
      {loading && <LoadingSpinner />}
      {!loading && (
        <>

          {activeIndex !== null ? (
          <>
            <div className="hint-container">
              <p className="hint-text">
                <strong>Ready to rank some famous faces? Here’s how it works:</strong>
                You’ll see <strong>5 people, one at a time.</strong>
                For each person, choose a rank from <strong>1 to 5</strong> (1 is the top spot!). <br />
                Once you pick a rank, it’s locked, and the next person will appear.
                Keep going until all <strong>5 ranks</strong> are filled.
                Let’s see how your choices play out! <strong>Enjoy the challenge!</strong>
              </p>
            </div>
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
            </>
          ) : (
            <>
            {!isSwapped &&
              <div className="hint-container">
                <p className="hint-text">
                  Great job! <strong>Your first ranking is complete.</strong>
                  Now, it’s time for one final adjustment:
                  <strong>
                    You must switch the positions of exactly two people by clicking on their pictures.
                  </strong>
                  <br />
                  This switch is mandatory and can only be done once.
                  After the switch, your ranking will be locked, and no further changes can be made.
                  <strong>Make your move wisely—this is your final chance!</strong>
                </p>
              </div>}
              <div className="all-ranked">
                {[...nfts]
                  .sort((a, b) => {
                    const rankA = rankings[a.id] ?? Infinity;
                    const rankB = rankings[b.id] ?? Infinity;
                    return rankA - rankB;
                  })
                  .map((nft, index) => (
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
                        <p>Assigned Rank: {rankings[nft.id] || "Not Assigned"}</p>
                      </Card>
                    </div>
                  ))}
              </div>
            </>
          )}

          {isSwapped && (
            <>
            <h3 className="community-header">
              This is the community’s official Top 5, based on the choices of all users so far.
            </h3>
            <div className="sorted-by-points">
            
            {sortNFTsByPoints().map((nft, index) => {
                    const leaderboardPosition = getLeaderboardPosition(nft.id);
                    console.log("🚀 ~ {sortNFTsByPoints ~ leaderboardPosition:", leaderboardPosition)
                    return (
                      <Card
                        key={nft.id}
                        images={nft.images || []}
                        name={nft.metadata.name || `NFT ${index + 1}`}
                        isSingle={false}
                      >
                        <p>Total Points: {nft.metadata.statistics?.totalPoints || 0}</p>
                        {leaderboardPosition && (
                        <span className="badge leaderboard-badge">
                          Leaderboard: {leaderboardPosition}
                        </span>
                        )}
                      </Card>
                    );
                  })}
            </div>
            <div className="hint-container">
              <p className="hint-text">
                Want to make a difference? <strong>Submit your final ranking now</strong> and help shape the overall statistics! <br />
                <em>Your input matters!</em>
              </p>
            </div>

            <div className="action-buttons">
              <button
                onClick={handleSubmitRanks}
                className="submit-ranks-button"
                disabled={loading}
              >
                Submit Rankings
              </button>
              {/* <button
                onClick={() => setIsModalOpen(true)}
                disabled={isLeaderboardButtonDisabled}
                className="leaderboard-button"
              >
                View Leaderboard
              </button> */}
            </div>
            </>
          )}
        </>
      )}
    </div>


{/* <LeaderboardModal
isOpen={isModalOpen}
onClose={() => setIsModalOpen(false)}
leaderboard={filteredLeaderboard}
/> */}
</>
  );
};

export default NFTCards;
