"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CompactAIEditTab } from "@/components/image-studio/CompactAIEditTab";
import { ImprovedResizeTab } from "@/components/image-studio/ImprovedResizeTab";
import { ImageUploader } from "@/components/image-studio/ImageUploader";

const IMAGE_FORMATS = [
  { value: "png", label: "PNG", ext: "png" },
  { value: "jpeg", label: "JPEG", ext: "jpg" },
  { value: "webp", label: "WebP", ext: "webp" },
  { value: "avif", label: "AVIF", ext: "avif" }
];

export default function ImageStudioPage() {
  const [activeTab, setActiveTab] = useState<"ai-edit" | "resize">("ai-edit");
  
  // AI Edit state
  const [aiImage, setAiImage] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{ blob: Blob; url: string; filename: string } | null>(null);

  // Resize state
  const [resizeImage, setResizeImage] = useState<File | null>(null);
  const [resizeImagePreview, setResizeImagePreview] = useState<string | null>(null);
  const [resizeProcessing, setResizeProcessing] = useState(false);
  const [resizeResult, setResizeResult] = useState<{ blob: Blob; url: string; filename: string } | null>(null);

  const handleAiImageSelect = (file: File, preview: string) => {
    setAiImage(file);
    setAiImagePreview(preview);
    setAiResult(null);
  };

  const handleResizeImageSelect = (file: File, preview: string) => {
    setResizeImage(file);
    setResizeImagePreview(preview);
    setResizeResult(null);
  };

  const processAIEdit = async () => {
    if (!aiImage || !aiCustomPrompt.trim()) return;

    setAiProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', aiImage);
      formData.append('prompt', aiCustomPrompt);
      formData.append('type', 'ai-edit');

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
      setAiResult({
        blob,
        url: imageUrl,
        filename: `ai-edited-${Date.now()}`
      });
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to process image: ${errorMessage}\n\nTip: Try making your prompt more specific or use one of the quick actions.`);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleResizeResult = (resultBlob: Blob, format: string, filename: string) => {
    const imageUrl = URL.createObjectURL(resultBlob);
    setResizeResult({
      blob: resultBlob,
      url: imageUrl,
      filename
    });
  };

  const downloadImage = (result: { blob: Blob; filename: string }, format: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(result.blob);
    link.download = `${result.filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCurrentState = () => {
    if (activeTab === "ai-edit") {
      return {
        image: aiImage,
        preview: aiImagePreview,
        result: aiResult,
        processing: aiProcessing
      };
    } else {
      return {
        image: resizeImage,
        preview: resizeImagePreview,
        result: resizeResult,
        processing: resizeProcessing
      };
    }
  };

  const state = getCurrentState();

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
              <p className="text-gray-600 mt-1">Transform images with AI editing and precision resizing</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
              <Button
                variant={activeTab === 'ai-edit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('ai-edit')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'ai-edit' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'ai-edit' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                AI Edit
              </Button>
              <Button
                variant={activeTab === 'resize' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('resize')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'resize' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'resize' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                Resize Image
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Image Upload */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload Image</h3>
                {activeTab === "ai-edit" ? (
                  <ImageUploader
                    onImageSelect={handleAiImageSelect}
                    currentPreview={aiImagePreview}
                  />
                ) : (
                  <ImageUploader
                    onImageSelect={handleResizeImageSelect}
                    currentPreview={resizeImagePreview}
                  />
                )}
              </Card>
            </div>

            {/* Middle Column - Controls */}
            <div className="lg:col-span-1">
              {state.preview && (
                <>
                  {activeTab === "ai-edit" && (
                    <CompactAIEditTab
                      customPrompt={aiCustomPrompt}
                      setCustomPrompt={setAiCustomPrompt}
                      onProcessImage={processAIEdit}
                      processing={aiProcessing}
                    />
                  )}
                  {activeTab === "resize" && resizeImage && (
                    <ImprovedResizeTab
                      imagePreview={resizeImagePreview!}
                      imageFile={resizeImage}
                      onResult={handleResizeResult}
                      processing={resizeProcessing}
                      setProcessing={setResizeProcessing}
                    />
                  )}
                </>
              )}
            </div>

            {/* Right Column - Result */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Generated Image</h3>
                {!state.result ? (
                  <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">Your processed image will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-50">
                      <Image
                        src={state.result.url}
                        alt="Processed result"
                        fill
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Download Options */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Download As:</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {IMAGE_FORMATS.map((format) => (
                          <button
                            key={format.value}
                            onClick={() => downloadImage(state.result!, format.ext)}
                            className="px-2 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded hover:bg-gray-50 hover:border-pink-300 transition-all"
                          >
                            {format.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (activeTab === "ai-edit") {
                          setAiResult(null);
                        } else {
                          setResizeResult(null);
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      Clear Result
                    </button>
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