import { NftService } from './nft.service';
export declare class NftController {
    private readonly nftService;
    constructor(nftService: NftService);
    getNfts(gameType: string): Promise<{
        nfts: {
            id: any;
            metadata: any;
        }[];
    }>;
    getNftById(id: number): Promise<{
        id: number;
        name: any;
        description: any;
        image: any;
        attributes: any;
    }>;
    getLeaderboard(gameType: string): Promise<{
        leaderboard: any[];
    }>;
}
