import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Types
type Platform = "twitter" | "instagram" | "facebook" | "linkedin" | "all";

interface Comment {
  id: string;
  platform: Platform;
  username: string;
  content: string;
  timestamp: string;
  answered: boolean;
}

const platformColors: Record<Platform, string> = {
  twitter: "bg-blue-100 text-blue-800",
  instagram: "bg-purple-100 text-purple-800",
  facebook: "bg-indigo-100 text-indigo-800",
  linkedin: "bg-sky-100 text-sky-800",
  all: "bg-gray-100 text-gray-800",
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SocialMonitoring() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("all");
  const [showAnsweredOnly, setShowAnsweredOnly] = useState(false);
  const [showUnansweredOnly, setShowUnansweredOnly] = useState(false);

  // Construct API URL based on filters
  const apiUrl = `/api/social/fetch-comments?platform=${selectedPlatform}${
    showAnsweredOnly ? "&answered=true" : ""
  }${showUnansweredOnly ? "&answered=false" : ""}`;

  // Fetch comments data
  const { data, error, isLoading, mutate } = useSWR<{ comments: Comment[] }>(apiUrl, fetcher);

  // Handle marking a comment as answered
  const handleMarkAsAnswered = useCallback(async (commentId: string) => {
    try {
      const response = await fetch("/api/social/mark-answered", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark comment as answered");
      }

      // Refresh the comments data
      mutate();

      toast({
        title: "Success",
        description: "Comment marked as answered",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark comment as answered",
        variant: "destructive",
      });
    }
  }, [mutate, toast]);

  // Update filter logic
  useEffect(() => {
    if (showAnsweredOnly && showUnansweredOnly) {
      // If both are selected, it's the same as showing all
      setShowAnsweredOnly(false);
      setShowUnansweredOnly(false);
    }
  }, [showAnsweredOnly, showUnansweredOnly]);

  // Handle filter changes
  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value as Platform);
  };

  const handleAnsweredFilterChange = (checked: boolean) => {
    setShowAnsweredOnly(checked);
    if (checked) setShowUnansweredOnly(false);
  };

  const handleUnansweredFilterChange = (checked: boolean) => {
    setShowUnansweredOnly(checked);
    if (checked) setShowAnsweredOnly(false);
  };

  // Handle error state
  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Comments</h2>
        <p>Please try again later or contact support if the issue persists.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Social Media Monitoring</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select onValueChange={handlePlatformChange} defaultValue={selectedPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="Select Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="answered"
            checked={showAnsweredOnly}
            onCheckedChange={handleAnsweredFilterChange}
          />
          <label htmlFor="answered" className="text-sm font-medium">
            Show Answered Only
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="unanswered"
            checked={showUnansweredOnly}
            onCheckedChange={handleUnansweredFilterChange}
          />
          <label htmlFor="unanswered" className="text-sm font-medium">
            Show Unanswered Only
          </label>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* No comments state */}
      {!isLoading && data?.comments.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-600">No comments found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters or check back later</p>
        </div>
      )}

      {/* Comments list */}
      <div className="grid grid-cols-1 gap-4">
        {data?.comments.map((comment: Comment) => (
          <Card key={comment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{comment.username}</CardTitle>
                  <CardDescription>{new Date(comment.timestamp).toLocaleString()}</CardDescription>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${platformColors[comment.platform]}`}>
                  {comment.platform.charAt(0).toUpperCase() + comment.platform.slice(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p>{comment.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${comment.answered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {comment.answered ? 'Answered' : 'Awaiting Response'}
                </span>
              </div>
              {!comment.answered && (
                <Button variant="outline" onClick={() => handleMarkAsAnswered(comment.id)}>
                  Mark as Answered
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 