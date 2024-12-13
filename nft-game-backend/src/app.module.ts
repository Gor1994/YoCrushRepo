import { Module } from '@nestjs/common';
import { NftController } from './nft/nft.controller';
import { NftService } from './nft/nft.service';

@Module({
  imports: [],
  controllers: [NftController],
  providers: [NftService],
})
export class AppModule {}
