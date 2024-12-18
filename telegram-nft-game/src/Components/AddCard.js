import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import "../styles/addCard.css";

const AddCard = ({ onWalletConnect }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    firstName: "",
    lastName: "",
    height: "",
    bornAt: "",
    gameType: "",
    image: "",
    media: [],
  });

  const [mainFile, setMainFile] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pinataApiKey = "d0c25b59e71e79a807fe"; // Replace with your API Key
  const pinataSecretApiKey = "ffa18455dea27e5d95d72d0c76e7886c9a6b71dbf1c421203e5e387a2cd21805"; // Replace with your Secret

  useEffect(() => {
    const storedWallet = localStorage.getItem("connectedAccount");
    if (storedWallet) setWalletAddress(storedWallet);
  }, []);
  // Upload Main File to Pinata

  const uploadMainFile = async () => {
    if (!mainFile) return;
    setLoading(true);
  
    try {
      // Step 1: Upload the main file to Pinata
      const formData = new FormData();
      formData.append("file", mainFile);
  
      const uploadResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
          },
        }
      );
  
      const cid = uploadResponse.data.IpfsHash;
      console.log("File uploaded successfully. CID:", cid);
  
      // Step 2: Pin the uploaded file explicitly using pinByHash
      const pinResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinByHash",
        {
          hashToPin: cid, // Pin the CID retrieved from the upload
          pinataMetadata: { name: "main_uploaded_file" }, // Add a custom name
        },
        {
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
          },
        }
      );
  
      console.log("File pinned successfully:", pinResponse.data);
  
      // Step 3: Save the CID to formData
      setFormData((prev) => ({ ...prev, image: `ipfs://${cid}` }));
      console.log("Main Image CID (Pinned):", `ipfs://${cid}`);
    } catch (err) {
      console.error("Error uploading or pinning main file:", err);
      setError("Failed to upload and pin the main file.");
    } finally {
      setLoading(false);
    }
  };
  

  // Upload Media Files to Pinata
  const uploadMediaFiles = async () => {
    if (mediaFiles.length === 0) return;
    setLoading(true);
  
    try {
      const uploadedCIDs = await Promise.all(
        mediaFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
  
          // Step 1: Upload the file to Pinata
          const uploadResponse = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataSecretApiKey,
              },
            }
          );
  
          const cid = uploadResponse.data.IpfsHash;
          console.log("File uploaded successfully. CID:", cid);
  
          // Step 2: Explicitly pin the uploaded file using pinByHash
          const pinResponse = await axios.post(
            "https://api.pinata.cloud/pinning/pinByHash",
            {
              hashToPin: cid, // CID to pin
              pinataMetadata: { name: `media_file_${cid}` }, // Optional: Set a custom name
            },
            {
              headers: {
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataSecretApiKey,
              },
            }
          );
  
          console.log("File pinned successfully:", pinResponse.data);
  
          // Return the CID with the ipfs:// prefix
          return `ipfs://${cid}`;
        })
      );
  
      setFormData((prev) => ({ ...prev, media: uploadedCIDs }));
      console.log("Media Files CIDs (Pinned):", uploadedCIDs);
    } catch (err) {
      console.error("Error uploading or pinning media files:", err);
      setError("Failed to upload and pin media files.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // 1. Debugging Form Data
    console.log("Form Data Submitted:", formData);
  
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }
  
    try {
      // 2. Transform formData into KeyValuePair[] format
      const { name, description, firstName, lastName, height, bornAt, gameType, image, media } = formData;
    //   const prefixedImage = image ? `ipfs://${image}` : ""; // Add prefix to the main image CID
    //   const prefixedMedia = media.map((cid) => `ipfs://${cid}`); 
      const userMetadata = [
        { key: "name", value: name },
        { key: "description", value: description },
        { key: "firstName", value: firstName },
        { key: "lastName", value: lastName },
        { key: "height", value: height },
        { key: "bornAt", value: bornAt },
        { key: "gameType", value: gameType },
        { key: "image", value: image },
        { key: "media", value: media.join(",") }, // Convert media array into a comma-separated string
      ].filter((item) => item.value); // Filter out empty fields
  
      console.log("Transformed KeyValuePair[]:", userMetadata);
  
      // 3. Connect to MetaMask and get signer
      if (!window.ethereum) throw new Error("MetaMask is not installed.");
  
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      // 4. Initialize the smart contract
      const contractAddress = "0x0Fc53F848320A5993277690362Ba8062A109CB94"; // Replace with your contract address
      const contractABI = [
        {
          inputs: [
            { name: "to_", type: "address" },
            {
              name: "userMetadata_",
              type: "tuple[]",
              components: [
                { name: "key", type: "string" },
                { name: "value", type: "string" },
              ],
            },
            { name: "gameType_", type: "uint256" },
          ],
          name: "createGameCard",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];
  
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
      // 5. Prepare parameters
      const toAddress = await signer.getAddress(); // Current wallet address
  
      console.log("Calling createGameCard with:", { toAddress, userMetadata, gameType });
  
      // 6. Call createGameCard function
      const tx = await contract.createGameCard(toAddress, userMetadata, gameType);
      console.log("Transaction sent:", tx.hash);
  
      alert("Transaction submitted! Waiting for confirmation...");
  
      // Wait for transaction confirmation
      await tx.wait();
      console.log("✅ Transaction confirmed!");
  
      alert("Game card created successfully!");
    } catch (err) {
      console.error("❌ Error calling createGameCard:", err.message || err);
      alert(`Failed to create game card: ${err.message}`);
    }
  };

  return (
    <div className="add-card">
      <h2>Add Card</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label>Description:</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <label>First Name:</label>
            <input type="text" value={formData.firstName} onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              } />
          </div>
          <div>
            <label>Last Name:</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>
          <div>
            <label>Height:</label>
            <input
              type="text"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: e.target.value })
              }
            />
          </div>
          <div>
            <label>Born At:</label>
            <input
              type="text"
              value={formData.bornAt}
              onChange={(e) =>
                setFormData({ ...formData, bornAt: e.target.value })
              }
            />
          </div>
          <div>
            <label>Game Type:</label>
            <input
              type="text"
              value={formData.gameType}
              onChange={(e) =>
                setFormData({ ...formData, gameType: e.target.value })
              }
            />
          </div>

          {/* Main File Upload */}
          <div>
            <label>Main Image:</label>
            <input type="file" onChange={(e) => setMainFile(e.target.files[0])} />
            <button type="button" onClick={uploadMainFile} disabled={loading}>
              Upload Main Image
            </button>
          </div>

          {/* Media Files Upload */}
          <div>
            <label>Media Files:</label>
            <input
              type="file"
              multiple
              onChange={(e) => setMediaFiles([...e.target.files])}
            />
            <button type="button" onClick={uploadMediaFiles} disabled={loading}>
              Upload Media Files
            </button>
          </div>

          <button type="submit" disabled={loading}>
            Submit
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    </div>
  );
};

export default AddCard;
