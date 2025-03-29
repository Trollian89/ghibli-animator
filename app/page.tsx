"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus } from "lucide-react";

export default function GhibliAnimatorClone() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const generateAnimation = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt && !image) {
      setErrorMsg("Please enter a prompt or upload an image.");
      return;
    }

    setLoading(true);
    setVideoUrl(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("prompt", trimmedPrompt);
      if (image) formData.append("image", image);

      const response = await fetch("/api/generate-animation", {
        method: "POST",
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid JSON response from the server");
      }

      if (!response.ok) {
        throw new Error(data?.error || "API request failed");
      }

      if (!data.videoUrl || typeof data.videoUrl !== "string") {
        throw new Error("No valid video URL returned from API.");
      }

      setVideoUrl(data.videoUrl);
    } catch (error: unknown) {
      console.error("Error generating animation:", error);
      if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        setErrorMsg(error.message || "Something went wrong generating the animation.");
      } else {
        setErrorMsg("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-blue-200 p-6 flex flex-col items-center justify-center">
      <Card className="w-full max-w-xl shadow-2xl border-0">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-3xl font-bold text-center text-gray-800">Studio Ghibli Animator</h1>
          <Textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a whimsical Ghibli-style scene or upload an image..."
            className="rounded-xl shadow-sm"
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <ImagePlus className="w-5 h-5" />
              <span className="text-sm text-blue-800">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            {image && <span className="text-xs text-gray-600">{image.name}</span>}
          </div>

          <Button
            className="w-full text-white font-semibold text-lg"
            onClick={generateAnimation}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Generate Animation"}
          </Button>

          {errorMsg && (
            <p className="text-red-600 text-sm font-medium text-center">{errorMsg}</p>
          )}

          {videoUrl && (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              className="rounded-2xl mt-4 shadow-md"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}