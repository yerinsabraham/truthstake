// src/components/marketCard.tsx
"use client";

import { useReadContract, useActiveAccount, useSendAndConfirmTransaction } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { MarketProgress } from "./market-progress";
import { MarketTime } from "./market-time";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { MarketResolved } from "./market-resolved";
import { MarketPending } from "./market-pending";
import { MarketBuyInterface } from "./market-buy-interface";
import { MarketSharesDisplay } from "./market-shares-display";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { prepareContractCall } from "thirdweb";
import { useState } from "react";

interface MarketCardProps {
  index: number;
  filter: "active" | "pending" | "resolved";
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

const OWNER_ADDRESS = "0xb56Df4020eeA60088E4FC5c350B823689797EC77";

export function MarketCard({ index, filter }: MarketCardProps) {
  const account = useActiveAccount();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();

  const { data: marketData, isLoading: isLoadingMarketData } = useReadContract({
    contract,
    method: "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAStake, uint256 totalOptionBStake, bool resolved)",
    params: [BigInt(index)],
  });

  const market: Market | undefined = marketData
    ? {
        question: marketData[0],
        optionA: marketData[1],
        optionB: marketData[2],
        endTime: marketData[3],
        outcome: marketData[4],
        totalOptionAStake: marketData[5],
        totalOptionBStake: marketData[6],
        resolved: marketData[7],
      }
    : undefined;

  const { data: stakeBalanceData } = useReadContract({
    contract,
    method: "function getStakeBalance(uint256 _marketId, address _user) view returns (uint256 optionAStake, uint256 optionBStake)",
    params: [BigInt(index), account?.address as string],
  });

  const stakeBalance: StakeBalance | undefined = stakeBalanceData
    ? {
        optionAStake: stakeBalanceData[0],
        optionBStake: stakeBalanceData[1],
      }
    : undefined;

  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async (outcome: number) => {
    if (!account || account.address !== OWNER_ADDRESS) return;
    setIsResolving(true);
    try {
      const tx = await prepareContractCall({
        contract,
        method: "function resolveMarket(uint256 _marketId, uint8 _outcome)",
        params: [BigInt(index), outcome],
      });
      await mutateTransaction(tx);
      toast.success(`Market ${index} resolved as ${outcome === 0 ? market?.optionA : market?.optionB}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to resolve market");
    } finally {
      setIsResolving(false);
    }
  };

  const isExpired = market && new Date(Number(market.endTime) * 1000) < new Date();
  const isResolved = market?.resolved;

  const shouldShow = () => {
    if (!market) return false;
    switch (filter) {
      case "active":
        return !isExpired;
      case "pending":
        return isExpired && !isResolved;
      case "resolved":
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
          <CardContent className="space-y-4">
            {market && (
              <MarketProgress
                optionA={market.optionA}
                optionB={market.optionB}
                totalOptionAStake={market.totalOptionAStake}
                totalOptionBStake={market.totalOptionBStake}
              />
            )}
            {isExpired ? (
              isResolved ? (
                <MarketResolved marketId={index} outcome={market!.outcome} optionA={market!.optionA} optionB={market!.optionB} />
              ) : account?.address === OWNER_ADDRESS ? (
                <div className="flex justify-between gap-4">
                  <Button className="flex-1" onClick={() => handleResolve(0)} disabled={isResolving}>
                    {isResolving ? "Resolving..." : `Resolve as ${market!.optionA}`}
                  </Button>
                  <Button className="flex-1" onClick={() => handleResolve(1)} disabled={isResolving}>
                    {isResolving ? "Resolving..." : `Resolve as ${market!.optionB}`}
                  </Button>
                </div>
              ) : (
                <MarketPending />
              )
            ) : (
              <MarketBuyInterface marketId={index} market={market!} />
            )}
          </CardContent>
          <CardFooter>
            {market && stakeBalance && (
              <MarketSharesDisplay market={market} stakeBalance={stakeBalance} />
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}