import {
  ALL_MODEL_NAMES,
  ALL_MODELS,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_MODEL_NAME,
} from "@opencanvas/shared/models";
import { CustomModelConfig } from "@opencanvas/shared/types";
import { Thread } from "@langchain/langgraph-sdk";
import { createClient } from "../hooks/utils";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useUserContext } from "./UserContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryState } from "nuqs";
import { useDebouncedCallback } from "use-debounce";

// Operation timeout in milliseconds (15 seconds)
const OPERATION_TIMEOUT = 15000;

// Query parameter name for thread ID
const THREAD_ID_QUERY_PARAM = "threadId";

type ThreadContentType = {
  threadId: string | null;
  threads: Thread[];
  createThreadLoading: boolean;
  createNonEmptyThreadLoading: boolean;
  threadsLoading: boolean;
  modelName: ALL_MODEL_NAMES;
  modelConfig: CustomModelConfig;
  modelConfigs: Record<ALL_MODEL_NAMES, CustomModelConfig>;
  setThreadId: (threadId: string | null) => void;
  setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
  createThread: () => Promise<Thread>;
  deleteThread: (threadId: string) => Promise<void>;
  getAllThreads: () => Promise<void>;
  getThread: (threadId: string) => Promise<Thread | null>;
  setModelName: (modelName: ALL_MODEL_NAMES) => void;
  setModelConfig: (
    modelName: ALL_MODEL_NAMES,
    modelConfig: CustomModelConfig
  ) => void;
  clearState: () => void;
};

const ThreadContext = createContext<ThreadContentType | undefined>(undefined);

export function ThreadProvider({ children }: { children: ReactNode }) {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [createThreadLoading, setCreateThreadLoading] = useState(false);
  const [_createNonEmptyThreadLoading, _setCreateNonEmptyThreadLoading] =
    useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [modelName, _setModelName] = useState<ALL_MODEL_NAMES>(DEFAULT_MODEL_NAME);
  const [threadId, setQueryThreadId] = useQueryState(THREAD_ID_QUERY_PARAM);

  const [modelConfigs, setModelConfigs] = useState<
    Record<ALL_MODEL_NAMES, CustomModelConfig>
  >(() => {
    // Initialize with default configs for all models
    const initialConfigs: Record<ALL_MODEL_NAMES, CustomModelConfig> =
      {} as Record<ALL_MODEL_NAMES, CustomModelConfig>;

    ALL_MODELS.forEach((model) => {
      const modelKey = model.modelName || model.name;

      initialConfigs[modelKey] = {
        ...model.config,
        provider: model.config.provider,
        temperatureRange: {
          ...(model.config.temperatureRange ||
            DEFAULT_MODEL_CONFIG.temperatureRange),
        },
        maxTokens: {
          ...(model.config.maxTokens || DEFAULT_MODEL_CONFIG.maxTokens),
        },
        ...(model.config.provider === "azure_openai" && {
          azureConfig: {
            azureOpenAIApiKey: process.env._AZURE_OPENAI_API_KEY || "",
            azureOpenAIApiInstanceName:
              process.env._AZURE_OPENAI_API_INSTANCE_NAME || "",
            azureOpenAIApiDeploymentName:
              process.env._AZURE_OPENAI_API_DEPLOYMENT_NAME || "",
            azureOpenAIApiVersion:
              process.env._AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
            azureOpenAIBasePath: process.env._AZURE_OPENAI_API_BASE_PATH,
          },
        }),
      };
    });
    return initialConfigs;
  });

  // Define the computed model config
  const activeModelConfig = useMemo(() => {
    // Try exact match first, then try without "azure/" or "groq/" prefixes
    return (
      modelConfigs[modelName] || modelConfigs[modelName.replace("azure/", "")]
    );
  }, [modelName, modelConfigs]);

  // Helper function to gracefully timeout async operations
  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number = OPERATION_TIMEOUT,
    operation: string
  ): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Operation '${operation}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result as T;
    } catch (error) {
      console.error(`Error in ${operation}:`, error);
      throw error;
    }
  };

  const setModelConfig = useDebouncedCallback(
    (modelName: ALL_MODEL_NAMES, newModelConfig: CustomModelConfig) => {
      setModelConfigs(prev => ({
        ...prev,
        [modelName]: newModelConfig
      }));
    },
    300
  );

  const setThreadId = useDebouncedCallback((newThreadId: string | null) => {
    setQueryThreadId(newThreadId);
  }, 300);

  const setModelName = useDebouncedCallback((newModelName: ALL_MODEL_NAMES) => {
    _setModelName(newModelName);
  }, 300);

  const createThread = async (): Promise<Thread> => {
    if (!user) {
      toast({
        title: "Failed to create thread",
        description: "User not authenticated",
        duration: 5000,
        variant: "destructive",
      });
      throw new Error("User not authenticated");
    }

    setCreateThreadLoading(true);

    try {
      const client = createClient();

      const thread = await withTimeout(
        client.threads.create({
          metadata: {
            firebase_user_id: user.uid,
            customModelName: modelName,
            modelConfig: activeModelConfig,
          },
        }),
        OPERATION_TIMEOUT,
        "createThread"
      );
      
      setThreadId(thread.thread_id);
      return thread;
    } catch (e) {
      console.error("Failed to create thread", e);
      toast({
        title: "Failed to create thread",
        description:
          "An error occurred while trying to create a new thread. Please try again.",
        duration: 5000,
        variant: "destructive",
      });
      throw e;
    } finally {
      setCreateThreadLoading(false);
    }
  };

  const deleteThread = async (threadId: string): Promise<void> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const client = createClient();

      await withTimeout(
        client.threads.delete(threadId),
        OPERATION_TIMEOUT,
        "deleteThread"
      );

      setThreads((prev) => prev.filter((t) => t.thread_id !== threadId));

      if (threadId === threadId) {
        setThreadId(null);
      }
    } catch (e) {
      console.error("Failed to delete thread", e);
      toast({
        title: "Failed to delete thread",
        description: "An error occurred while trying to delete the thread.",
        duration: 5000,
        variant: "destructive",
      });
    }
  };

  const getAllThreads = async (): Promise<void> => {
    if (!user) {
      return;
    }

    setThreadsLoading(true);
    try {
      const client = createClient();

      const res = await withTimeout(
        client.threads.search({
          metadata: {
            firebase_user_id: user.uid,
          },
        }),
        OPERATION_TIMEOUT,
        "getAllThreads"
      );

      setThreads(res);
    } catch (e) {
      console.error("Failed to get threads", e);
      toast({
        title: "Failed to get threads",
        description: "An error occurred while trying to get threads.",
        duration: 5000,
        variant: "destructive",
      });
    } finally {
      setThreadsLoading(false);
    }
  };

  const getThread = async (threadId: string): Promise<Thread | null> => {
    if (!user) {
      return null;
    }
    
    try {
      const client = createClient();

      return await withTimeout(
        client.threads.get(threadId),
        OPERATION_TIMEOUT,
        "getThread"
      );
    } catch (e) {
      console.error("Failed to get thread", e);
      toast({
        title: "Failed to get thread",
        description: "An error occurred while trying to get the thread.",
        duration: 5000,
        variant: "destructive",
      });
      return null;
    }
  };

  const clearState = () => {
    setThreadId(null);
    _setModelName(DEFAULT_MODEL_NAME);
  };

  const contextValue: ThreadContentType = {
    threadId: threadId ?? null,
    threads,
    createThreadLoading,
    createNonEmptyThreadLoading: _createNonEmptyThreadLoading,
    threadsLoading,
    modelName,
    modelConfig: activeModelConfig,
    modelConfigs,
    setThreadId,
    setThreads,
    createThread,
    deleteThread,
    getAllThreads,
    getThread,
    setModelName,
    setModelConfig,
    clearState,
  };

  return (
    <ThreadContext.Provider value={contextValue}>
      {children}
    </ThreadContext.Provider>
  );
}

export function useThreadContext() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreadContext must be used within a ThreadProvider");
  }
  return context;
}
