"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NftService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const abi_json_1 = __importDefault(require("../../abi.json"));
const channelAbi_json_1 = __importDefault(require("../../channelAbi.json"));
let NftService = NftService_1 = class NftService {
    constructor() {
        this.logger = new common_1.Logger(NftService_1.name);
        this.contractAddress = '0x0Dfa72B4A32557a1F3EeFc669b40d09b9E7932aa';
        this.channelContractAddress = '0x45409989d54eb2f2dcDE91687b1e80A6a8c7505d';
        this.provider = new ethers_1.ethers.JsonRpcProvider('https://rpc2.bahamut.io');
        this.contract = new ethers_1.ethers.Contract(this.contractAddress, [...abi_json_1.default], this.provider);
        this.channel = new ethers_1.ethers.Contract(this.channelContractAddress, [...channelAbi_json_1.default], this.provider);
    }
    async getNfts(gameType = 1) {
        this.logger.log(`Fetching NFTs for gameType: ${gameType}`);
        console.log('getNFTs');
        try {
            let totalSupply;
            try {
                totalSupply = await this.channel.balanceOf('0xbb78EFAaAf9223b4840eA7DefDc379a13b16399B');
            }
            catch (err) {
                this.logger.error('Error fetching total supply', err.message);
                throw new common_1.HttpException('Error fetching total supply', common_1.HttpStatus.BAD_REQUEST);
            }
            if (totalSupply === 0) {
                throw new common_1.HttpException('No NFTs available', common_1.HttpStatus.BAD_REQUEST);
            }
            const matchingNfts = [];
            for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
                const stats = await this.contract.cardStats(tokenId);
                if (stats.gameType == gameType) {
                    matchingNfts.push(tokenId);
                }
            }
            if (new Set(matchingNfts).size < 5) {
                throw new common_1.HttpException('Not enough unique NFTs with the specified gameType', common_1.HttpStatus.BAD_REQUEST);
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
            const nfts = await Promise.all(randomIds.map(async (tokenId) => {
                const tokenURI = await this.channel.tokenURI(tokenId);
                let metadataJson;
                try {
                    metadataJson = Buffer.from(tokenURI.split('base64,')[1], 'base64').toString('utf-8');
                    metadataJson = metadataJson.replace(/"media":"\[(.*?)\]"/, (_, match) => `"media":[${match}]`);
                }
                catch (err) {
                    this.logger.error(`Error decoding metadata for token ID ${tokenId}`, err.message);
                    throw new common_1.HttpException(`Invalid metadata format for token ID ${tokenId}`, common_1.HttpStatus.BAD_REQUEST);
                }
                return { id: tokenId, metadata: metadataJson };
            }));
            this.logger.log(`Fetched ${nfts.length} NFTs for gameType ${gameType}`);
            return { nfts };
        }
        catch (error) {
            this.logger.error('Error fetching NFTs', error.message);
            throw new common_1.HttpException('Failed to fetch NFTs', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getNftById(id) {
        try {
            const tokenURI = await this.channel.tokenURI(id);
            let metadataJson;
            try {
                metadataJson = Buffer.from(tokenURI.split('base64,')[1], 'base64').toString('utf-8');
                metadataJson = metadataJson.replace(/"media":"\[(.*?)\]"/, (_, match) => `"media":[${match}]`);
            }
            catch (err) {
                this.logger.error(`Error decoding metadata for token ID ${id}`, err.message);
                throw new common_1.HttpException('Invalid metadata format', common_1.HttpStatus.BAD_REQUEST);
            }
            const metadata = JSON.parse(metadataJson);
            return {
                id,
                name: metadata.name || 'Unknown',
                description: metadata.description || 'No description available',
                image: metadata.image || '',
                attributes: metadata.attributes || [],
            };
        }
        catch (error) {
            this.logger.error(`Error fetching NFT with ID ${id}`, error.message);
            throw new common_1.HttpException('NFT not found or failed to fetch metadata', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getLeaderboard(gameType) {
        try {
            const rawLeaderboard = await this.contract.getLeaderboard(gameType);
            this.logger.log(`Raw leaderboard data for gameType ${gameType}:`, rawLeaderboard);
            this.logger.log('NftService ~ getLeaderboard ~ rawLeaderboard:', rawLeaderboard);
            const leaderboard = await Promise.all(rawLeaderboard.map(async (entry, index) => {
                this.logger.log('🚀 ~ NftService ~ rawLeaderboard.map ~ entry:', entry);
                const rank = Number(entry[0]);
                const score = Number(entry[1]);
                console.log('🚀 ~ NftService ~ rawLeaderboard.map ~ score:', score);
                let name = `Token ${rank}`;
                try {
                    if (rank != 0) {
                        const tokenURI = await this.channel.tokenURI(rank);
                        const metadataJson = Buffer.from(tokenURI.split('base64,')[1], 'base64').toString('utf-8');
                        const metadataReplaced = metadataJson.replace(/"media":"\[(.*?)\]"/, (_, match) => `"media":[${match}]`);
                        const metadata = JSON.parse(metadataReplaced);
                        this.logger.log('🚀 ~ NftService ~ rawLeaderboard.map ~ metadata:', metadata);
                        name = metadata.name || name;
                    }
                }
                catch (error) {
                    this.logger.warn(`Failed to fetch metadata for token ${rank}`, error.message);
                }
                return {
                    rank,
                    name,
                    score,
                };
            }));
            return { leaderboard };
        }
        catch (error) {
            this.logger.error(`Error fetching leaderboard for gameType ${gameType}:`, error.message);
            throw new common_1.HttpException('Failed to fetch leaderboard', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.NftService = NftService;
exports.NftService = NftService = NftService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NftService);
//# sourceMappingURL=nft.service.js.map