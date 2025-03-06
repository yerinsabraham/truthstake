// src/components/market-buy-interface.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSendAndConfirmTransaction } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { prepareContractCall } from "thirdweb";
import { toast } from "sonner";

interface MarketBuyInterfaceProps {
  marketId: number;
  market: {
    question: string;
    optionA: string;
    optionB: string;
    totalOptionAStake: bigint;
    totalOptionBStake: bigint;
  };
}

export function MarketBuyInterface({ marketId, market }: MarketBuyInterfaceProps) {
  const [stakeAmountA, setStakeAmountA] = useState("");
  const [stakeAmountB, setStakeAmountB] = useState("");
  const { mutateAsync: sendTransaction } = useSendAndConfirmTransaction();

  const handleStake = async (option: "A" | "B") => {
    const amount = option === "A" ? stakeAmountA : stakeAmountB;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    try {
      const tx = await prepareContractCall({
        contract,
        method: "function stake(uint256 _marketId, uint8 _option, uint256 _amount)",
        params: [BigInt(marketId), option === "A" ? 0 : 1, BigInt(Number(amount) * 10 ** 18)],
      });
      await sendTransaction(tx);
      toast.success(`Successfully staked ${amount} on ${option === "A" ? market.optionA : market.optionB}`);
      setStakeAmountA("");
      setStakeAmountB("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to stake");
    }
  };

  const totalStakeA = Number(market.totalOptionAStake) / 10 ** 18;
  const totalStakeB = Number(market.totalOptionBStake) / 10 ** 18;
  const totalStake = totalStakeA + totalStakeB;

  const winningStake = totalStakeA; // Fixed: Changed from let to const
  const losingStake = totalStakeB;  // Fixed: Changed from let to const
  const oddsA = totalStake ? (winningStake / totalStake) * 100 : 50;
  const oddsB = totalStake ? (losingStake / totalStake) * 100 : 50;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`stakeA-${marketId}`}>{market.optionA} ({oddsA.toFixed(2)}%)</Label>
        <div className="flex gap-2">
          <Input
            id={`stakeA-${marketId}`}
            type="number"
            value={stakeAmountA}
            onChange={(e) => setStakeAmountA(e.target.value)}
            placeholder="Amount to stake"
          />
          <Button onClick={() => handleStake("A")}>Stake</Button>
        </div>
      </div>
      <div>
        <Label htmlFor={`stakeB-${marketId}`}>{market.optionB} ({oddsB.toFixed(2)}%)</Label>
        <div className="flex gap-2">
          <Input
            id={`stakeB-${marketId}`}
            type="number"
            value={stakeAmountB}
            onChange={(e) => setStakeAmountB(e.target.value)}
            placeholder="Amount to stake"
          />
          <Button onClick={() => handleStake("B")}>Stake</Button>
        </div>
      </div>
    </div>
  );
}