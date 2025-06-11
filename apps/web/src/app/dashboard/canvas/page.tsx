"use client";

import { Canvas } from "@/components/canvas";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { GraphProvider } from "@/contexts/GraphContext";
import { ThreadProvider } from "@/contexts/ThreadProvider";
import { UserProvider } from "@/contexts/UserContext";
import { Suspense } from "react";

function CanvasPageContent() {
  return (
    <div className="h-full space-y-6">     
      <div className="h-[calc(100%-100px)]">
        <UserProvider>
          <ThreadProvider>
            <AssistantProvider>
              <GraphProvider>
                <Canvas />
              </GraphProvider>
            </AssistantProvider>
          </ThreadProvider>
        </UserProvider>
      </div>
    </div>
  );
}

export default function CanvasPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <CanvasPageContent />
    </Suspense>
  );
} 