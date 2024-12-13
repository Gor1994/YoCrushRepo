export declare class NftService {
    private readonly logger;
    private readonly provider;
    private readonly contract;
    private readonly channel;
    private readonly contractAddress;
    private readonly channelContractAddress;
    constructor();
    getNfts(gameType?: number): Promise<{
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
    getLeaderboard(gameType: number): Promise<{
        leaderboard: any[];
    }>;
}
