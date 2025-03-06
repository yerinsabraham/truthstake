// src/components/create-prediction-modal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Add this
import { toast } from "sonner";
import { useActiveAccount, useSendAndConfirmTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { contract } from "@/constants/contract";

interface CreatePredictionModalProps {
  onClose: () => void;
}

const OWNER_ADDRESS = "0xb56Df4020eeA60088E4FC5c350B823689797EC77"; // Your wallet address

export function CreatePredictionModal({ onClose }: CreatePredictionModalProps) {
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [supportingLinks, setSupportingLinks] = useState("");
  const [category, setCategory] = useState("");
  const account = useActiveAccount();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();

  const categories = [
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

  const handleSubmit = async () => {
    if (!question || !optionA || !optionB || (account?.address !== OWNER_ADDRESS && !supportingLinks) || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (account?.address === OWNER_ADDRESS) {
      try {
        const tx = await prepareContractCall({
          contract,
          method: "function createMarket(string _question, string _optionA, string _optionB, uint256 _duration) returns (uint256)",
          params: [question, optionA, optionB, BigInt(30 * 24 * 60 * 60)], // 30-day duration
        });
        await mutateTransaction(tx);
        toast.success("Market created successfully");
        // Manually update marketCategories in tsdashboard.tsx
      } catch (error) {
        console.error(error);
        toast.error("Failed to create market");
        return;
      }
    } else {
      console.log({
        question,
        optionA,
        optionB,
        supportingLinks,
        category,
        submitter: account?.address
      });
      toast.success("Prediction submitted for review");
    }

    setQuestion("");
    setOptionA("");
    setOptionB("");
    setSupportingLinks("");
    setCategory("");
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Prediction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g., Will Bitcoin hit $100K?" />
          </div>
          <div>
            <Label htmlFor="optionA">Option A</Label>
            <Input id="optionA" value={optionA} onChange={(e) => setOptionA(e.target.value)} placeholder="e.g., Yes" />
          </div>
          <div>
            <Label htmlFor="optionB">Option B</Label>
            <Input id="optionB" value={optionB} onChange={(e) => setOptionB(e.target.value)} placeholder="e.g., No" />
          </div>
          {account?.address !== OWNER_ADDRESS && (
            <div>
              <Label htmlFor="supportingLinks">Supporting Links</Label>
              <Input id="supportingLinks" value={supportingLinks} onChange={(e) => setSupportingLinks(e.target.value)} placeholder="e.g., https://example.com/news" />
            </div>
          )}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-500">
            {account?.address === OWNER_ADDRESS ? "Market will be created instantly." : "Approval takes 6-24 hours."}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}