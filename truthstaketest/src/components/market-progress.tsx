// src/components/market-progress.tsx
import { Progress } from "@/components/ui/progress";

interface MarketProgressProps {
    optionA: string;
    optionB: string;
    totalOptionAStake: bigint;
    totalOptionBStake: bigint;
}

export function MarketProgress({ 
    optionA, 
    optionB, 
    totalOptionAStake, 
    totalOptionBStake 
}: MarketProgressProps) {
    const totalStake = Number(totalOptionAStake) + Number(totalOptionBStake);
    const optionAPercentage = totalStake > 0 
        ? (Number(totalOptionAStake) / totalStake) * 100 
        : 50;

    return (
        <div className="mb-4">
            <div className="flex justify-between mb-2">
                <span>
                    <span className="font-bold text-sm">
                        {optionA}: {(Number(totalOptionAStake) / 1_000_000).toFixed(2)}
                    </span>
                    {totalStake > 0 && (
                        <span className="text-xs text-gray-500"> {Math.floor(optionAPercentage)}%</span>
                    )}
                </span>
                <span>
                    <span className="font-bold text-sm">
                        {optionB}: {(Number(totalOptionBStake) / 1_000_000).toFixed(2)}
                    </span>
                    {totalStake > 0 && (
                        <span className="text-xs text-gray-500"> {Math.floor(100 - optionAPercentage)}%</span>
                    )}
                </span>
            </div>
            <Progress value={optionAPercentage} className="h-2" />
        </div>
    );
}