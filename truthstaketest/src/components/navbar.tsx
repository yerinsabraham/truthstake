// src/components/navbar.tsx
import { ConnectButton, lightTheme, useActiveAccount } from "thirdweb/react";
import { client } from "@/app/client";
import { sepolia } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreatePredictionModal } from "./create-prediction-modal";
import { BannerUploadModal } from "./banner-upload-modal";

const OWNER_ADDRESS = "0xb56Df4020eeA60088E4FC5c350B823689797EC77";

interface NavbarProps {
  onBannerUpload?: (imageUrl: string, marketId: number, title: string) => void; // Added title
}

export function Navbar({ onBannerUpload }: NavbarProps) {
  const account = useActiveAccount();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">TruthStake</h1>
      <div className="items-center flex gap-2">
        {account && (
          <>
            <Button onClick={() => setIsCreateModalOpen(true)} className="h-10">Create</Button>
            {account.address === OWNER_ADDRESS && (
              <Button onClick={() => setIsBannerModalOpen(true)} className="h-10">Banners</Button>
            )}
          </>
        )}
        <ConnectButton 
          client={client} 
          theme={lightTheme()}
          chain={sepolia}
          connectButton={{ style: { fontSize: "0.75rem !important", height: "2.5rem !important" }, label: "Sign In" }}
          detailsButton={{ displayBalanceToken: { [sepolia.id]: "0xD7AaA81D7166B8De1bC0F378eE641183864D0405" } }}
          wallets={[inAppWallet({ auth: { options: ["wallet", "google", "x", "facebook", "email", "passkey"] } })]}
          accountAbstraction={{ chain: sepolia, sponsorGas: true }}
        />
        {isCreateModalOpen && <CreatePredictionModal onClose={() => setIsCreateModalOpen(false)} />}
        {isBannerModalOpen && <BannerUploadModal onClose={() => setIsBannerModalOpen(false)} onUpload={onBannerUpload} />}
      </div>
    </div>
  );
}