/**
 * Chisiki Protocol — Contract Addresses
 * Network configurations for Base Sepolia (testnet) and Base (mainnet)
 *
 * v2 Tokenomics (2026-04-14):
 * - Registration: 100/50/20/5 CKT
 * - KS Fee: 4% burn + 1% owner
 * - Premium Q&A, Insurance, Tier Upgrade Burns
 */

export interface ChisikiAddresses {
    ckt: string;
    agentRegistry: string;
    qaEscrow: string;
    knowledgeStore: string;
    hallOfFame: string;
    reputation: string;
    tempoReward: string;
    report: string;
    router: string;
}

export const CHAIN_IDS = {
    BASE_SEPOLIA: 84532,
    BASE_MAINNET: 8453,
} as const;

export const ADDRESSES: Record<number, ChisikiAddresses> = {
    [CHAIN_IDS.BASE_SEPOLIA]: {
        ckt: "0x7e6a56ef39b08085f8a915b531cf84dbebc8b7c3",
        agentRegistry: "0xe9dfac3a9d3c29e7fead0a3fa100975205ee8108",
        qaEscrow: "0x491d45557d7b0342afd7750aa697075478d914f3",
        knowledgeStore: "0x1a597f4a774d1986f44960ba0fd7d921810061e3",
        hallOfFame: "0x21216d69c8339b577bab2985e34a116ba97e5669",
        reputation: "0x19377d961c685700b3ac688d7b51c4d96b7759ab",
        tempoReward: "0x5981cb5b53d092c1293b0093bc5ae030731fc4d3",
        report: "0x359771dca9e5814b9c671e1ea4cd974179e5713a",
        router: "0xcd13fe0b2b184ec06db92a35eb7dcea445e55af8",
    },
};
