// src/components/tsdashboard.tsx
"use client";

import { useReadContract, useActiveAccount } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCard } from "./marketCard";
import { Navbar } from "./navbar";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { Footer } from "./footer";
import { useState, useEffect, useRef } from "react";
import { readContract } from "thirdweb";

const marketCategories = [
  { marketId: 0, category: "Pop Culture" },
];
const OWNER_ADDRESS = "0xb56Df4020eeA60088E4FC5c350B823689797EC77";

interface MarketInfo {
  id: number;
  endTime: bigint;
  resolved: boolean;
}

export function TruthStakeDashboard() {
  const { data: marketCount, isLoading: isLoadingMarketCount } = useReadContract({
    contract,
    method: "function marketCount() view returns (uint256)",
    params: [],
  });
  const account = useActiveAccount();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [banners, setBanners] = useState<{ id: number; imageUrl: string; marketId: number; title: string }[]>([]);
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const marketRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load banners from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBanners = localStorage.getItem("truthstakeBanners");
      if (savedBanners) {
        setBanners(JSON.parse(savedBanners));
      }
    }
  }, []);

  // Save banners to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("truthstakeBanners", JSON.stringify(banners));
    }
  }, [banners]);

  // Fetch all market info
  useEffect(() => {
    const fetchMarkets = async () => {
      if (!marketCount) return;
      const marketData: MarketInfo[] = [];
      for (let i = 0; i < Number(marketCount); i++) {
        const data = await readContract({
          contract,
          method: "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAStake, uint256 totalOptionBStake, bool resolved)",
          params: [BigInt(i)],
        });
        marketData.push({ id: i, endTime: data[3], resolved: data[7] });
      }
      setMarkets(marketData);
    };
    fetchMarkets();
  }, [marketCount]);

  const activeMarkets = markets.filter(m => {
    const now = Math.floor(Date.now() / 1000);
    return m.endTime > now && !m.resolved;
  });

  const pendingMarkets = markets.filter(m => {
    const now = Math.floor(Date.now() / 1000);
    return m.endTime <= now && !m.resolved;
  });

  const resolvedMarkets = markets.filter(m => m.resolved);

  const categories = [
    "All",
    "Crypto",
    "Politics",
    "Sports",
    "Technology & AI",
    "Stock Market",
    "Pop Culture",
    "Science",
    "Global News",
    "Business",
  ];
  const skeletonCards = Array.from({ length: 6 }, (_, i) => <MarketCardSkeleton key={`skeleton-${i}`} />);

  const handleBannerClick = (marketId: number) => {
    const marketElement = marketRefs.current.get(marketId);
    if (marketElement) {
      marketElement.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      console.log(`Market ${marketId} not found on page`);
    }
  };

  const handleBannerUpload = (imageUrl: string, marketId: number, title: string) => {
    setBanners(prev => {
      const id = Date.now();
      const newBanner = { id, imageUrl, marketId, title }; // Use Vercel Blob URL
      if (prev.length < 4) return [newBanner, ...prev];
      return [newBanner, ...prev.slice(0, 3)];
    });
  };

  const handleDeleteBanner = (marketId: number) => {
    setBanners(prev => {
      const deletedBanner = prev.find(b => b.marketId === marketId);
      if (deletedBanner) {
        console.log(`Banner ${deletedBanner.imageUrl} removed from display - stored in Vercel Blob`);
      }
      return prev.filter(banner => banner.marketId !== marketId);
    });
    console.log(`Market ${marketId} marked for deletion - requires contract update`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto p-4">
        <Navbar onBannerUpload={handleBannerUpload} />
        <div className="mb-4 overflow-x-auto whitespace-nowrap">
          {banners.map(banner => (
            <div key={banner.id} className="inline-block mr-4 relative" onClick={() => handleBannerClick(banner.marketId)}>
              <img src={banner.imageUrl} alt={`Banner for ${banner.title}`} className="w-[400px] h-[150px] rounded-lg cursor-pointer" />
              <div className="absolute bottom-12 left-2 text-white text-lg font-bold">{banner.title}</div>
              <button
                className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded"
                onClick={() => handleBannerClick(banner.marketId)}
              >
                View Prediction
              </button>
              {account?.address === OWNER_ADDRESS && (
                <button
                  className="absolute bottom-2 right-2 bg-red-500 text-white text-sm px-2 py-1 rounded"
                  onClick={() => handleDeleteBanner(banner.marketId)}
                >
                  Delete Market
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mb-4 overflow-x-auto whitespace-nowrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === "All" ? null : category)}
              className={`inline-block px-3 py-1 mr-2 rounded-lg text-sm ${selectedCategory === category || (category === "All" && !selectedCategory) ? "bg-[#0076a3] text-white" : "bg-gray-200 text-gray-700"}`}
            >
              {category}
            </button>
          ))}
        </div>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          {isLoadingMarketCount ? (
            <TabsContent value="active" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">{skeletonCards}</div>
            </TabsContent>
          ) : (
            <>
              <TabsContent value="active">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeMarkets.map(m => {
                    const category = marketCategories.find(mc => mc.marketId === m.id)?.category;
                    if (selectedCategory && category !== selectedCategory) return null;
                    return (
                      <div
                        ref={(el) => {
                          if (el) marketRefs.current.set(m.id, el);
                          else marketRefs.current.delete(m.id);
                        }}
                        key={m.id}
                      >
                        <MarketCard index={m.id} filter="active" />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="pending">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pendingMarkets.map(m => {
                    const category = marketCategories.find(mc => mc.marketId === m.id)?.category;
                    if (selectedCategory && category !== selectedCategory) return null;
                    return (
                      <div
                        ref={(el) => {
                          if (el) marketRefs.current.set(m.id, el);
                          else marketRefs.current.delete(m.id);
                        }}
                        key={m.id}
                      >
                        <MarketCard index={m.id} filter="pending" />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="resolved">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {resolvedMarkets.map(m => {
                    const category = marketCategories.find(mc => mc.marketId === m.id)?.category;
                    if (selectedCategory && category !== selectedCategory) return null;
                    return (
                      <div
                        ref={(el) => {
                          if (el) marketRefs.current.set(m.id, el);
                          else marketRefs.current.delete(m.id);
                        }}
                        key={m.id}
                      >
                        <MarketCard index={m.id} filter="resolved" />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}