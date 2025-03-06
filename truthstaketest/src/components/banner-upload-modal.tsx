// src/components/banner-upload-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReadContract } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { put } from "@vercel/blob";
import { readContract } from "thirdweb";

// Props for BannerUploadModal
interface BannerUploadModalProps {
  onClose: () => void;
  onUpload?: (imageUrl: string, marketId: number, title: string) => void;
}

// Market info type
interface MarketInfo {
  id: number;
  question: string;
}

export function BannerUploadModal({ onClose, onUpload }: BannerUploadModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [marketId, setMarketId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [markets, setMarkets] = useState<MarketInfo[]>([]);

  const { data: marketCount } = useReadContract({
    contract,
    method: "function marketCount() view returns (uint256)",
    params: [],
  });

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
        marketData.push({ id: i, question: data[0] || `Market ${i}` });
      }
      setMarkets(marketData);
    };
    fetchMarkets();
  }, [marketCount]);

  const filteredMarkets = markets.filter(m => m.question.toLowerCase().includes(search.toLowerCase()));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!image || !marketId || !title) {
      console.log("Please upload an image, select a market, and enter a title");
      return;
    }
    const id = Date.now();
    const filename = `banner_${id}.png`;
    const { url } = await put(filename, image, { access: "public" });
    onUpload?.(url, Number(marketId), title);
    setImage(null);
    setMarketId("");
    setTitle("");
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Banner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="image">Banner Image (400x150)</Label>
            <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <div>
            <Label htmlFor="market">Market</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {marketId ? markets.find(m => m.id.toString() === marketId)?.question : "Select a market"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search markets..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No markets found.</CommandEmpty>
                    <CommandGroup>
                      {filteredMarkets.map(m => (
                        <CommandItem
                          key={m.id}
                          value={m.question}
                          onSelect={() => {
                            setMarketId(m.id.toString());
                            setOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", marketId === m.id.toString() ? "opacity-100" : "opacity-0")} />
                          {m.question}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Bitcoin Surge Prediction" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}