// src/components/market-buy-interface.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSendAndConfirmTransaction, useActiveAccount } from "thirdweb/react";
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
  const [showInput, setShowInput] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);
  const { mutateAsync: sendTransaction } = useSendAndConfirmTransaction();
  const account = useActiveAccount();

  const handleButtonClick = (option: "A" | "B") => {
    setSelectedOption(option);
    setShowInput(true);
  };

  const handleCancel = () => {
    setShowInput(false);
    setStakeAmount("");
    setSelectedOption(null);
  };

  const handleStake = async () => {
    if (!account) {
      toast.error("Please connect your wallet to stake");
      return;
    }
    if (!stakeAmount || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    try {
      const tx = await prepareContractCall({
        contract,
        method: "function stake(uint256 _marketId, uint8 _option, uint256 _amount)",
        params: [BigInt(marketId), selectedOption === "A" ? 0 : 1, BigInt(Number(stakeAmount) * 10 ** 18)],
      });
      await sendTransaction(tx);
      toast.success(`Successfully staked ${stakeAmount} on ${selectedOption === "A" ? market.optionA : market.optionB}`);
      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error("Failed to stake");
    }
  };

  const totalStakeA = Number(market.totalOptionAStake) / 10 ** 18;
  const totalStakeB = Number(market.totalOptionBStake) / 10 ** 18;
  const totalStake = totalStakeA + totalStakeB || 1;
  const stakeNum = Number(stakeAmount) || 0;
  const potentialWinnings =
    selectedOption === "A"
      ? totalStakeB > 0
        ? stakeNum * (totalStake / totalStakeB)
        : stakeNum
      : totalStakeA > 0
      ? stakeNum * (totalStake / totalStakeA)
      : stakeNum;

  return (
    <div className="space-y-4">
      {!showInput ? (
        <div className="flex justify-between gap-4">
          <Button className="flex-1" onClick={() => handleButtonClick("A")} disabled={!account}>
            {market.optionA}
          </Button>
          <Button className="flex-1" onClick={() => handleButtonClick("B")} disabled={!account}>
            {market.optionB}
          </Button>
        </div>
      ) : (
        <div>
          <Label htmlFor={`stake-${marketId}`}>
            Stake on {selectedOption === "A" ? market.optionA : market.optionB}
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id={`stake-${marketId}`}
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Amount to stake"
              className="flex-1"
            />
            <Button onClick={handleStake}>Confirm</Button>
            <Button onClick={handleCancel} variant="outline">Cancel</Button>
          </div>
          {stakeAmount && (
            <p className="text-sm text-gray-500 mt-1">
              Potential winnings: {potentialWinnings.toFixed(2)} PREDICT
            </p>
          )}
        </div>
      )}
    </div>
  );
}