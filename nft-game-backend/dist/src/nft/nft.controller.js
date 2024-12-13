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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftController = void 0;
const common_1 = require("@nestjs/common");
const nft_service_1 = require("./nft.service");
let NftController = class NftController {
    constructor(nftService) {
        this.nftService = nftService;
    }
    async getNfts(gameType) {
        console.log(`Request received for /nfts with gameType: ${gameType}`);
        const parsedGameType = parseInt(gameType, 10) || 1;
        return this.nftService.getNfts(parsedGameType);
    }
    async getNftById(id) {
        return this.nftService.getNftById(id);
    }
    async getLeaderboard(gameType) {
        common_1.Logger.log('Fetching leaderboard for gameType:', gameType);
        const parsedGameType = parseInt(gameType, 10);
        if (isNaN(parsedGameType)) {
            throw new Error('Invalid gameType provided');
        }
        return this.nftService.getLeaderboard(parsedGameType);
    }
};
exports.NftController = NftController;
__decorate([
    (0, common_1.Get)('nfts'),
    __param(0, (0, common_1.Query)('gameType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getNfts", null);
__decorate([
    (0, common_1.Get)('nft/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getNftById", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    __param(0, (0, common_1.Query)('gameType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getLeaderboard", null);
exports.NftController = NftController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [nft_service_1.NftService])
], NftController);
//# sourceMappingURL=nft.controller.js.map