"use client";

import React, { useState } from "react";

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

      const data = await response.json();

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
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl p-6 space-y-4">
        <h1 className="text-3xl font-bold text-center text-gray-800">Studio Ghibli Animator</h1>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a whimsical Ghibli-style scene or upload an image..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none shadow-sm"
        />

        <div className="flex items-center gap-3">
          <label className="cursor-pointer text-blue-800 text-sm underline">
            Upload Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
          {image && <span className="text-xs text-gray-600">{image.name}</span>}
        </div>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          onClick={generateAnimation}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Animation"}
        </button>

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
      </div>
    </div>
  );
}