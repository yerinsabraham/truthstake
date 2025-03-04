// src/components/create-prediction-modal.tsx
'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface CreatePredictionModalProps {
    onClose: () => void;
}

export function CreatePredictionModal({ onClose }: CreatePredictionModalProps) {
    const [question, setQuestion] = useState("");
    const [optionA, setOptionA] = useState("");
    const [optionB, setOptionB] = useState("");
    const [supportingLinks, setSupportingLinks] = useState("");

    const handleSubmit = () => {
        // Validate all fields are filled
        if (!question || !optionA || !optionB || !supportingLinks) {
            toast.error("Please fill in all fields");
            return;
        }

        // Log data to console (placeholder for backend)
        console.log({
            question,
            optionA,
            optionB,
            supportingLinks
        });

        // Show confirmation toast
        toast.success("Prediction Submitted");

        // Reset form
        setQuestion("");
        setOptionA("");
        setOptionB("");
        setSupportingLinks("");

        // Close modal
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
                        <Input
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g., Will Davido drop an Album before August?"
                        />
                    </div>
                    <div>
                        <Label htmlFor="optionA">Option A</Label>
                        <Input
                            id="optionA"
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            placeholder="e.g., Yes"
                        />
                    </div>
                    <div>
                        <Label htmlFor="optionB">Option B</Label>
                        <Input
                            id="optionB"
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            placeholder="e.g., No"
                        />
                    </div>
                    <div>
                        <Label htmlFor="supportingLinks">Supporting Links</Label>
                        <Input
                            id="supportingLinks"
                            value={supportingLinks}
                            onChange={(e) => setSupportingLinks(e.target.value)}
                            placeholder="e.g., https://example.com/news"
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        Note: Approval takes 6-24 hours.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}