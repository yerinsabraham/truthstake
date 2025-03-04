// src/components/marketCard.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { MarketProgress } from "./market-progress";
import { MarketTime } from "./market-time";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { MarketResolved } from "./market-resolved";
import { MarketPending } from "./market-pending";
import { MarketBuyInterface } from "./market-buy-interface";
import { MarketSharesDisplay } from "./market-shares-display";

interface MarketCardProps {
  index: number;
  filter: 'active' | 'pending' | 'resolved';
}

interface Market {
  question: string;
  optionA: string;
  optionB: string;
  endTime: bigint;
  outcome: number;
  totalOptionAStake: bigint;
  totalOptionBStake: bigint;
  resolved: boolean;
}

interface StakeBalance {
  optionAStake: bigint;
  optionBStake: bigint;
}

export function MarketCard({ index, filter }: MarketCardProps) {
    const account = useActiveAccount();
    const { data: marketData, isLoading: isLoadingMarketData } = useReadContract({
        contract,
        method: "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAStake, uint256 totalOptionBStake, bool resolved)",
        params: [BigInt(index)]
    });

    const market: Market | undefined = marketData ? {
        question: marketData[0],
        optionA: marketData[1],
        optionB: marketData[2],
        endTime: marketData[3],
        outcome: marketData[4],
        totalOptionAStake: marketData[5],
        totalOptionBStake: marketData[6],
        resolved: marketData[7]
    } : undefined;

    const { data: stakeBalanceData } = useReadContract({
        contract,
        method: "function getStakeBalance(uint256 _marketId, address _user) view returns (uint256 optionAStake, uint256 optionBStake)",
        params: [BigInt(index), account?.address as string]
    });

    const stakeBalance: StakeBalance | undefined = stakeBalanceData ? {
        optionAStake: stakeBalanceData[0],
        optionBStake: stakeBalanceData[1]
    } : undefined;

    const isExpired = new Date(Number(market?.endTime) * 1000) < new Date();
    const isResolved = market?.resolved;

    const shouldShow = () => {
        if (!market) return false;
        switch (filter) {
            case 'active':
                return !isExpired;
            case 'pending':
                return isExpired && !isResolved;
            case 'resolved':
                return isExpired && isResolved;
            default:
                return true;
        }
    };

    if (!shouldShow()) {
        return null;
    }

    return (
        <Card key={index} className="flex flex-col">
            {isLoadingMarketData ? (
                <MarketCardSkeleton />
            ) : (
                <>
                    <CardHeader>
                        {market && <MarketTime endTime={market.endTime} />}
                        <CardTitle>{market?.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {market && (
                            <MarketProgress 
                                optionA={market.optionA}
                                optionB={market.optionB}
                                totalOptionAStake={market.totalOptionAStake}
                                totalOptionBStake={market.totalOptionBStake}
                            />
                        )}
                        {new Date(Number(market?.endTime) * 1000) < new Date() ? (
                            market?.resolved ? (
                                <MarketResolved 
                                    marketId={index}
                                    outcome={market.outcome}
                                    optionA={market.optionA}
                                    optionB={market.optionB}
                                />
                            ) : (
                                <MarketPending />
                            )
                        ) : (
                            <MarketBuyInterface 
                                marketId={index}
                                market={market!}
                            />
                        )}
                    </CardContent>
                    <CardFooter>
                        {market && stakeBalance && (
                            <MarketSharesDisplay 
                                market={market}
                                stakeBalance={stakeBalance}
                            />
                        )}
                    </CardFooter>
                </>
            )}
        </Card>
    );
}