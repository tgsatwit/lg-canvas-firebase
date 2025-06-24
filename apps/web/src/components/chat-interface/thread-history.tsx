import { isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState, useCallback } from "react";
import { Thread } from "@langchain/langgraph-sdk";
import { PiChatsCircleLight } from "react-icons/pi";
import { TighterText } from "../ui/header";
import { useGraphContext } from "@/contexts/GraphContext";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { useUserContext } from "@/contexts/UserContext";
import { useThreadContext } from "@/contexts/ThreadProvider";

interface ThreadHistoryProps {
  switchSelectedThreadCallback: (thread: Thread) => void;
}

interface ThreadProps {
  id: string;
  onClick: () => void;
  onDelete: () => void;
  label: string;
  createdAt: Date;
}

const ThreadItem = (props: ThreadProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="flex flex-row gap-0 items-center justify-start w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Button
        className="px-2 justify-start items-center flex-grow min-w-[191px] pr-0"
        size="sm"
        variant="ghost"
        onClick={props.onClick}
      >
        <TighterText className="truncate text-sm font-light w-full text-left">
          {props.label}
        </TighterText>
      </Button>
      {isHovering && (
        <TooltipIconButton
          tooltip="Delete thread"
          variant="ghost"
          onClick={props.onDelete}
        >
          <Trash2 className="w-12 h-12 text-[#575757] hover:text-red-500 transition-colors ease-in" />
        </TooltipIconButton>
      )}
    </div>
  );
};

const LoadingThread = () => <Skeleton className="w-full h-8" />;

const convertThreadActualToThreadProps = (
  thread: Thread,
  switchSelectedThreadCallback: (thread: Thread) => void,
  deleteThread: (id: string) => void
): ThreadProps => ({
  id: thread.thread_id,
  label:
    thread.metadata?.thread_title ??
    ((thread.values as Record<string, any>)?.messages?.[0]?.content ||
      "Untitled"),
  createdAt: new Date(thread.created_at),
  onClick: () => {
    return switchSelectedThreadCallback(thread);
  },
  onDelete: () => {
    return deleteThread(thread.thread_id);
  },
});

const groupThreads = (
  threads: Thread[] | undefined | null,
  switchSelectedThreadCallback: (thread: Thread) => void,
  deleteThread: (id: string) => void
) => {
  // Handle undefined threads array gracefully
  if (!threads || threads.length === 0) {
    return {
      today: [],
      yesterday: [],
      lastSevenDays: [],
      older: [],
    };
  }

  const today = new Date();
  const yesterday = subDays(today, 1);
  const sevenDaysAgo = subDays(today, 7);

  return {
    today: threads
      .filter((thread) => isToday(new Date(thread.created_at)))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(
          t,
          switchSelectedThreadCallback,
          deleteThread
        )
      ),
    yesterday: threads
      .filter((thread) => isYesterday(new Date(thread.created_at)))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(
          t,
          switchSelectedThreadCallback,
          deleteThread
        )
      ),
    lastSevenDays: threads
      .filter((thread) =>
        isWithinInterval(new Date(thread.created_at), {
          start: sevenDaysAgo,
          end: yesterday,
        })
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(
          t,
          switchSelectedThreadCallback,
          deleteThread
        )
      ),
    older: threads
      .filter((thread) => new Date(thread.created_at) < sevenDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(
          t,
          switchSelectedThreadCallback,
          deleteThread
        )
      ),
  };
};

const prettifyDateLabel = (group: string): string => {
  switch (group) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "lastSevenDays":
      return "Last 7 days";
    case "older":
      return "Older";
    default:
      return group;
  }
};

interface ThreadsListProps {
  groupedThreads: {
    today: ThreadProps[];
    yesterday: ThreadProps[];
    lastSevenDays: ThreadProps[];
    older: ThreadProps[];
  };
}

function ThreadsList(props: ThreadsListProps) {
  return (
    <div className="flex flex-col pt-3 gap-4">
      {Object.entries(props.groupedThreads).map(([group, threads]) =>
        threads.length > 0 ? (
          <div key={group}>
            <TighterText className="text-sm font-medium mb-1 pl-2">
              {prettifyDateLabel(group)}
            </TighterText>
            <div className="flex flex-col gap-1">
              {threads.map((thread) => (
                <ThreadItem key={thread.id} {...thread} />
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

export function ThreadHistoryComponent(props: ThreadHistoryProps) {
  const { toast } = useToast();
  const {
    graphData: { setMessages, switchSelectedThread },
  } = useGraphContext();
  const { deleteThread, getAllThreads, threads, threadsLoading } =
    useThreadContext();
  const { user } = useUserContext();
  const [open, setOpen] = useState(false);
  const [hasTriedLoadingThreads, setHasTriedLoadingThreads] = useState(false);

  const handleDeleteThread = useCallback(async (id: string) => {
    if (!user) {
      toast({
        title: "Failed to delete thread",
        description: "User not found",
        duration: 5000,
        variant: "destructive",
      });
      return;
    }

    await deleteThread(id);
    setMessages([]);
  }, [user, deleteThread, toast, setMessages]);

  // Only run once when user is available and threads haven't been loaded
  useEffect(() => {
    if (typeof window === "undefined" || !user || hasTriedLoadingThreads) return;

    getAllThreads();
    setHasTriedLoadingThreads(true);
  }, [user, hasTriedLoadingThreads]); // getAllThreads is intentionally omitted from deps

  const groupedThreads = React.useMemo(() => {
    return groupThreads(
      threads,
      (thread) => {
        switchSelectedThread(thread);
        props.switchSelectedThreadCallback(thread);
        setOpen(false);
      },
      handleDeleteThread
    );
  }, [threads, switchSelectedThread, props.switchSelectedThreadCallback, handleDeleteThread]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <TooltipIconButton
          tooltip="History"
          variant="ghost"
          className="w-fit h-fit p-2"
        >
          <PiChatsCircleLight
            className="w-6 h-6 text-gray-600"
            strokeWidth={8}
          />
        </TooltipIconButton>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="text-left">Thread History</SheetTitle>
        {threadsLoading ? (
          <div className="flex flex-col gap-2 mt-4">
            <LoadingThread />
            <LoadingThread />
            <LoadingThread />
          </div>
        ) : threads && threads.length > 0 ? (
          <ThreadsList groupedThreads={groupedThreads} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <TighterText className="text-gray-400">No threads found</TighterText>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export const ThreadHistory = React.memo(ThreadHistoryComponent);
