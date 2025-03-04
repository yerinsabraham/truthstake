// src/components/navbar.tsx
import { ConnectButton, lightTheme, useActiveAccount } from "thirdweb/react";
import { client } from "@/app/client";
import { sepolia } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreatePredictionModal } from "./create-prediction-modal"; // New component

export function Navbar() {
    const account = useActiveAccount();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">TruthStake</h1>
            <div className="items-center flex gap-2">
                {account && (
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="h-10" // Match ConnectButton height
                    >
                        Create
                    </Button>
                )}
                <ConnectButton 
                    client={client} 
                    theme={lightTheme()}
                    chain={sepolia}
                    connectButton={{
                        style: {
                            fontSize: '0.75rem !important',
                            height: '2.5rem !important',
                        },
                        label: 'Sign In',
                    }}
                    detailsButton={{
                        displayBalanceToken: {
                            [sepolia.id]: "0xD7AaA81D7166B8De1bC0F378eE641183864D0405" // TruthStake USDT
                        }
                    }}
                    wallets={[
                        inAppWallet({
                            auth: {
                                options: [
                                    "wallet",
                                    "google",
                                    "x",
                                    "facebook",
                                    "email",
                                    "passkey"
                                ]
                            }
                        }),
                    ]}
                    accountAbstraction={{
                        chain: sepolia,
                        sponsorGas: true,
                    }}
                />
                {isModalOpen && (
                    <CreatePredictionModal 
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}