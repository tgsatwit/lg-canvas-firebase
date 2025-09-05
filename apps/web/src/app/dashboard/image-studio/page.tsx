"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

const QUICK_PROMPTS = [
  "Remove the background completely",
  "Make this image black and white with good contrast",
  "Enhance the image quality and make it more vibrant", 
  "Create a professional thumbnail version",
  "Blur the background but keep the subject in focus",
  "Add a subtle artistic border around the image",
  "Crop this to a perfect square focusing on the main subject",
  "Make the colors more vivid and saturated"
];

const SOCIAL_MEDIA_SIZES = [
  { name: "YouTube Thumbnail", width: 1280, height: 720, ratio: "16:9" },
  { name: "YouTube Shorts", width: 1080, height: 1920, ratio: "9:16" },
  { name: "Instagram Post", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Instagram Story", width: 1080, height: 1920, ratio: "9:16" },
  { name: "Facebook Post", width: 1200, height: 630, ratio: "1.91:1" },
  { name: "LinkedIn Post", width: 1200, height: 627, ratio: "1.91:1" },
  { name: "Square (1:1)", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Standard (4:3)", width: 1024, height: 768, ratio: "4:3" },
  { name: "Widescreen (16:9)", width: 1920, height: 1080, ratio: "16:9" }
];

export default function ImageStudioPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<typeof SOCIAL_MEDIA_SIZES[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "resize">("edit");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setCustomPrompt(prompt);
  };

  const processImage = async () => {
    if (!selectedImage) return;
    
    // Check requirements based on active tab
    if (activeTab === "edit" && !customPrompt.trim()) return;
    if (activeTab === "resize" && !selectedSize) return;

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      if (activeTab === "edit") {
        formData.append('prompt', customPrompt);
      } else if (activeTab === "resize" && selectedSize) {
        const resizePrompt = `Resize and crop this image to ${selectedSize.width}x${selectedSize.height} pixels (${selectedSize.ratio} aspect ratio) for ${selectedSize.name}. Maintain the main subject and ensure high quality.`;
        formData.append('prompt', resizePrompt);
        formData.append('resize_width', selectedSize.width.toString());
        formData.append('resize_height', selectedSize.height.toString());
      }

      const response = await fetch('/api/image-studio/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403) {
          alert(`🔧 Setup Required: The Generative Language API needs to be enabled.\n\n${errorData.instructions?.join('\n') || 'Please enable the API in Google Cloud Console.'}\n\nActivation URL: ${errorData.activationUrl || 'Google Cloud Console'}`);
        } else if (response.status === 401) {
          alert(`🔑 API Key Issue: ${errorData.details || 'Invalid or missing API key.'}\n\n${errorData.instructions?.join('\n') || 'Please check your GEMINI_API_KEY.'}`);
        } else if (response.status === 422) {
          alert(`Gemini 2.5 Flash Image responded with text instead of an edited image. This might happen if the request is unclear or not supported. Try being more specific in your prompt.`);
        } else {
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to process image`);
        }
        return;
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setResult(imageUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to process image: ${errorMessage}\n\nTip: Try making your prompt more specific or use one of the quick actions.`);
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (result) {
      const link = document.createElement('a');
      link.href = result;
      link.download = `processed-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetStudio = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCustomPrompt("");
    setResult(null);
    setSelectedSize(null);
    setActiveTab("edit");
  };

  return (
    <div 
      className="relative min-h-screen"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(148, 163, 184, 0.08) 0%,
            rgba(203, 213, 225, 0.04) 50%,
            rgba(148, 163, 184, 0.08) 100%
          )
        `,
      }}
    >
      {/* Ambient background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at 35% 25%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 65% 75%, rgba(203, 213, 225, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 10%, rgba(156, 163, 175, 0.08) 0%, transparent 40%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 p-6">
        <div className="w-full max-w-none">
          {/* Header */}
          <div 
            className="p-6 rounded-2xl border mb-8"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Image Studio</h1>
              <p className="text-gray-600 mt-1">Transform your images with AI-powered editing</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="p-6 border-2 border-dashed border-gray-200 hover:border-pink-300 transition-all duration-200">
                <div className="text-center">
                  {!imagePreview ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Upload an Image
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Choose an image to start editing
                      </p>
                      <p className="text-xs text-gray-400 mb-4">
                        Tip: Gemini 2.5 Flash Image can blend multiple images, maintain character consistency, and perform advanced edits with natural language
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 cursor-pointer"
                      >
                        Choose File
                      </label>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative w-full h-48 rounded-xl overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Uploaded image"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex justify-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-replace"
                        />
                        <label
                          htmlFor="image-replace"
                          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          Replace
                        </label>
                        <button
                          onClick={resetStudio}
                          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {imagePreview && (
                <Card className="p-6">
                  {/* Tab Navigation */}
                  <div className="flex mb-6 border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab("edit")}
                      className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200",
                        activeTab === "edit"
                          ? "border-pink-500 text-pink-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      )}
                    >
                      AI Edit
                    </button>
                    <button
                      onClick={() => setActiveTab("resize")}
                      className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200",
                        activeTab === "resize"
                          ? "border-pink-500 text-pink-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      )}
                    >
                      Social Media Resize
                    </button>
                  </div>

                  {/* AI Edit Tab */}
                  {activeTab === "edit" && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Quick Actions
                      </h3>
                      <div className="space-y-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => handlePromptClick(prompt)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                              customPrompt === prompt
                                ? "bg-pink-100 text-pink-800 border border-pink-200"
                                : "border border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50"
                            )}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Social Media Resize Tab */}
                  {activeTab === "resize" && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Social Media Formats
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {SOCIAL_MEDIA_SIZES.map((size) => (
                          <button
                            key={size.name}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex justify-between items-center",
                              selectedSize?.name === size.name
                                ? "bg-pink-100 text-pink-800 border border-pink-200"
                                : "border border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50"
                            )}
                          >
                            <span>{size.name}</span>
                            <span className="text-xs text-gray-500">
                              {size.width}×{size.height} ({size.ratio})
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              )}

              {imagePreview && (
                <Card className="p-6">
                  {activeTab === "edit" ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Custom Instructions
                      </h3>
                      <div className="space-y-4">
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Describe how you want to edit this image. Be specific! Examples:
• Remove the person from the background
• Change the sky to a sunset
• Make the subject's hair blonde
• Add a vintage film effect
• Combine this with another artistic style"
                          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                          rows={6}
                        />
                        <Button
                          onClick={processImage}
                          disabled={!customPrompt.trim() || processing}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl py-3 font-medium"
                        >
                          {processing ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            "Transform Image"
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Resize for Social Media
                      </h3>
                      <div className="space-y-4">
                        {selectedSize ? (
                          <div className="p-4 bg-pink-50 border border-pink-200 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-pink-800">{selectedSize.name}</span>
                              <span className="text-sm text-pink-600">{selectedSize.ratio}</span>
                            </div>
                            <p className="text-sm text-pink-700">
                              Will resize to {selectedSize.width}×{selectedSize.height} pixels
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-600">
                              Select a social media format above to resize your image
                            </p>
                          </div>
                        )}
                        <Button
                          onClick={processImage}
                          disabled={!selectedSize || processing}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl py-3 font-medium"
                        >
                          {processing ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Resizing...
                            </div>
                          ) : (
                            `Resize for ${selectedSize?.name || 'Social Media'}`
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Result
                </h3>
                {!result ? (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
                    <div className="text-center text-gray-500">
                      <p>Your processed image will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full h-64 rounded-xl overflow-hidden">
                      <Image
                        src={result}
                        alt="Processed result"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={downloadResult}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                      >
                        Download
                      </Button>
                      <Button
                        onClick={() => setResult(null)}
                        variant="outline"
                      >
                        Clear Result
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}