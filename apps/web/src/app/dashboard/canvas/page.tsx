"use client";

import { Canvas } from "@/components/canvas";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { GraphProvider } from "@/contexts/GraphContext";
import { ThreadProvider } from "@/contexts/ThreadProvider";
import { UserProvider } from "@/contexts/UserContext";

export default function CanvasPage() {
  return (
    <div className="h-full bg-background">     
      <div className="h-[calc(100vh-5rem)]">
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