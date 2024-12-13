import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { NftService } from './nft.service';

@Controller()
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Get('nfts') // This matches the /nfts route
  async getNfts(@Query('gameType') gameType: string) {
    console.log(`Request received for /nfts with gameType: ${gameType}`);
    const parsedGameType = parseInt(gameType, 10) || 1;
    return this.nftService.getNfts(parsedGameType);
  }

  @Get('nft/:id')
  async getNftById(@Param('id') id: number) {
    return this.nftService.getNftById(id);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('gameType') gameType: string) {
    Logger.log('Fetching leaderboard for gameType:', gameType);
    const parsedGameType = parseInt(gameType, 10);
    if (isNaN(parsedGameType)) {
      throw new Error('Invalid gameType provided');
    }
    return this.nftService.getLeaderboard(parsedGameType);
  }
}
