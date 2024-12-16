import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import abi from '../../abi.json';
import channelABI from '../../channelAbi.json';

@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);
  private readonly provider: ethers.JsonRpcProvider;
  private readonly contract: ethers.Contract;
  private readonly channel: ethers.Contract;
  private readonly contractAddress =
    '0x0Dfa72B4A32557a1F3EeFc669b40d09b9E7932aa'; // Replace with your contract address
  private readonly channelContractAddress =
    '0x45409989d54eb2f2dcDE91687b1e80A6a8c7505d'; // Replace with your contract address

  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://rpc2.bahamut.io');
    this.contract = new ethers.Contract(
      this.contractAddress,
      [...abi],
      this.provider,
    );
    this.channel = new ethers.Contract(
      this.channelContractAddress,
      [...channelABI],
      this.provider,
    );
  }

  // Fetch a list of NFTs filtered by gameType
  async getNfts(gameType = 1) {
    this.logger.log(`Fetching NFTs for gameType: ${gameType}`);
    console.log('getNFTs');
    try {
      let totalSupply;
      try {
        totalSupply = await this.channel.balanceOf(
          '0xbb78EFAaAf9223b4840eA7DefDc379a13b16399B',
        );
      } catch (err) {
        this.logger.error('Error fetching total supply', err.message);
        throw new HttpException(
          'Error fetching total supply',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (totalSupply === 0) {
        throw new HttpException('No NFTs available', HttpStatus.BAD_REQUEST);
      }

      const matchingNfts = [];
      for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
        const stats = await this.contract.cardStats(tokenId);
        if (stats.gameType == gameType) {
          matchingNfts.push(tokenId);
        }
      }

      if (new Set(matchingNfts).size < 5) {
        throw new HttpException(
          'Not enough unique NFTs with the specified gameType',
          HttpStatus.BAD_REQUEST,
        );
      }

      const randomIds = [];
      const selectedIndices = new Set();

      while (randomIds.length < 5) {
        const randomIndex = Math.floor(Math.random() * matchingNfts.length);
        if (!selectedIndices.has(randomIndex)) {
          selectedIndices.add(randomIndex);
          randomIds.push(matchingNfts[randomIndex]);
        }
      }
      const nfts = await Promise.all(
        randomIds.map(async (tokenId) => {
          const tokenURI = await this.channel.tokenURI(tokenId);
          let metadataJson;
          try {
            metadataJson = Buffer.from(
              tokenURI.split('base64,')[1],
              'base64',
            ).toString('utf-8');
            metadataJson = metadataJson.replace(
              /"media":"\[(.*?)\]"/,
              (_, match) => `"media":[${match.replace(/`/g, '"')}]`,
            );
          } catch (err) {
            this.logger.error(
              `Error decoding metadata for token ID ${tokenId}`,
              err.message,
            );
            throw new HttpException(
              `Invalid metadata format for token ID ${tokenId}`,
              HttpStatus.BAD_REQUEST,
            );
          }

          return { id: tokenId, metadata: metadataJson };
        }),
      );

      this.logger.log(`Fetched ${nfts.length} NFTs for gameType ${gameType}`);
      return { nfts };
    } catch (error) {
      this.logger.error('Error fetching NFTs', error.message);
      throw new HttpException(
        'Failed to fetch NFTs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Fetch details of a specific NFT by ID
  async getNftById(id: number) {
    try {
      const tokenURI = await this.channel.tokenURI(id);
      let metadataJson;
      try {
        metadataJson = Buffer.from(
          tokenURI.split('base64,')[1],
          'base64',
        ).toString('utf-8');

        metadataJson = metadataJson.replace(
          /"media":"\[(.*?)\]"/,
          (_, match) => `"media":[${match.replace(/`/g, '"')}]`,
        );
      } catch (err) {
        this.logger.error(
          `Error decoding metadata for token ID ${id}`,
          err.message,
        );
        throw new HttpException(
          'Invalid metadata format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const metadata = JSON.parse(metadataJson);
      return {
        id,
        name: metadata.name || 'Unknown',
        description: metadata.description || 'No description available',
        image: metadata.image || '',
        attributes: metadata.attributes || [],
      };
    } catch (error) {
      this.logger.error(`Error fetching NFT with ID ${id}`, error.message);
      throw new HttpException(
        'NFT not found or failed to fetch metadata',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getLeaderboard(gameType: number) {
    try {
      const rawLeaderboard = await this.contract.getLeaderboard(gameType);
      this.logger.log(
        `Raw leaderboard data for gameType ${gameType}:`,
        rawLeaderboard,
      );
      this.logger.log(
        'NftService ~ getLeaderboard ~ rawLeaderboard:',
        rawLeaderboard,
      );

      const leaderboard = await Promise.all(
        rawLeaderboard.map(async (entry: any, index: number) => {
          const rank = Number(entry[0]);
          const score = Number(entry[1]);
          console.log('🚀 ~ NftService ~ rawLeaderboard.map ~ score:', score);

          // Fetch additional metadata for the leaderboard entry, if needed
          let name = `Token ${rank}`;
          try {
            if (rank != 0) {
              const tokenURI = await this.channel.tokenURI(rank);
              const metadataJson = Buffer.from(
                tokenURI.split('base64,')[1],
                'base64',
              ).toString('utf-8');

              const metadataReplaced = metadataJson.replace(
                /"media":"\[(.*?)\]"/,
                (_, match) => `"media":[${match.replace(/`/g, '"')}]`,
              );
              const metadata = JSON.parse(metadataReplaced);
              name = metadata.name || name;
            }
          } catch (error) {
            this.logger.warn(
              `Failed to fetch metadata for token ${rank}`,
              error.message,
            );
          }

          return {
            rank,
            name,
            score,
          };
        }),
      );
      return { leaderboard };
    } catch (error) {
      this.logger.error(
        `Error fetching leaderboard for gameType ${gameType}:`,
        error.message,
      );
      throw new HttpException(
        'Failed to fetch leaderboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
