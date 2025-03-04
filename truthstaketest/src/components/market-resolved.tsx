// src/components/market-resolved.tsx
'use client'

import { Button } from "./ui/button"
import { useState, useEffect } from "react"
import { useSendAndConfirmTransaction, useReadContract, useActiveAccount } from "thirdweb/react"
import { prepareContractCall } from "thirdweb"
import { contract } from "@/constants/contract"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface MarketResolvedProps {
    marketId: number
    outcome: number
    optionA: string
    optionB: string
}

export function MarketResolved({ marketId, outcome, optionA, optionB }: MarketResolvedProps) {
    const [isCollecting, setIsCollecting] = useState(false)
    const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction()
    const account = useActiveAccount() // Added Thirdweb hook

    // Fetch user's stake balance
    const { data: stakeBalanceData } = useReadContract({
        contract,
        method: "function getStakeBalance(uint256 _marketId, address _user) view returns (uint256 optionAStake, uint256 optionBStake)",
        params: [BigInt(marketId), account?.address || "0x0000000000000000000000000000000000000000"]
    });

    // Fetch market info for total stakes
    const { data: marketData } = useReadContract({
        contract,
        method: "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAStake, uint256 totalOptionBStake, bool resolved)",
        params: [BigInt(marketId)]
    });

    const [netWinnings, setNetWinnings] = useState<string | null>(null)

    useEffect(() => {
        if (stakeBalanceData && marketData && account) {
            const [optionAStake, optionBStake] = stakeBalanceData
            const [, , , , , totalOptionAStake, totalOptionBStake] = marketData

            let userStake = BigInt(0)
            let winningStake = BigInt(0)
            let losingStake = BigInt(0)

            if (outcome === 1) { // OPTION_A
                userStake = BigInt(optionAStake)
                winningStake = BigInt(totalOptionAStake)
                losingStake = BigInt(totalOptionBStake)
            } else if (outcome === 2) { // OPTION_B
                userStake = BigInt(optionBStake)
                winningStake = BigInt(totalOptionBStake)
                losingStake = BigInt(totalOptionAStake)
            }

            if (userStake > 0 && winningStake > 0) {
                const rewardRatio = (losingStake * BigInt(1e18)) / winningStake
                const grossWinnings = userStake + (userStake * rewardRatio) / BigInt(1e18)
                const fee = (grossWinnings * BigInt(200)) / BigInt(10000) // 2% fee
                const netWinningsBigInt = grossWinnings - fee
                const netWinningsUSDT = Number(netWinningsBigInt) / 1_000_000 // Convert from 6 decimals
                setNetWinnings(netWinningsUSDT.toFixed(2))
            }
        }
    }, [stakeBalanceData, marketData, outcome, marketId, account])

    const handleCollectWinnings = async () => {
        setIsCollecting(true)
        try {
            const tx = await prepareContractCall({
                contract,
                method: "function claimWinnings(uint256 _marketId)",
                params: [BigInt(marketId)]
            })
            await mutateTransaction(tx)
            toast.success(`Winnings collected: ${netWinnings} USDT (after 2% fee)`)
        } catch (error) {
            console.error(error)
            toast.error("There was an error collecting your winnings")
        } finally {
            setIsCollecting(false)
        }
    }

    return (
        <div className="flex flex-col items-start border-2 border-gray-200 rounded-lg p-4">
            <span className="font-bold mb-2">
                Outcome: {outcome === 1 ? optionA : outcome === 2 ? optionB : "Unresolved"}
            </span>
            {netWinnings && (
                <p className="text-sm text-gray-700 mb-2">
                    Your winnings: {netWinnings} USDT (after 2% fee)
                </p>
            )}
            <Button disabled={isCollecting || !netWinnings} onClick={handleCollectWinnings}>
                {isCollecting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Collecting...
                    </>
                ) : (
                    "Collect Winnings"
                )}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
                Note: A 2% platform fee is deducted from winnings.
            </p>
        </div>
    )
}