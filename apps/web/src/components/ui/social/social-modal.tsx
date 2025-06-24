'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, Wand2, RefreshCw, Send, Facebook, Instagram, Youtube, MessageSquare, CheckCircle2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// Define the comment type to match the SocialTable
type Comment = {
  id: number;
  platform: string;
  author: string;
  content: string;
  postTitle: string;
  date: string;
  answered: boolean;
};

interface SocialModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  comment?: Comment | null
  onSendReply?: (commentId: number, reply: string) => Promise<void>
  onGenerateReply?: (commentId: number) => Promise<string>
}

const SocialModal = ({ 
  open, 
  onOpenChange, 
  children,
  comment,
  onSendReply,
  onGenerateReply
}: SocialModalProps) => {
  const [reply, setReply] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)

  // Reset the reply when a different comment is loaded
  React.useEffect(() => {
    if (comment) {
      setReply("")
    }
  }, [comment?.id])

  const handleGenerateReply = async () => {
    if (!comment || !onGenerateReply) return
    setIsGenerating(true)
    try {
      const generatedReply = await onGenerateReply(comment.id)
      setReply(generatedReply)
    } catch (error) {
      console.error("Error generating reply:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendReply = async () => {
    if (!comment || !onSendReply || !reply.trim()) return
    setIsSending(true)
    try {
      await onSendReply(comment.id, reply)
      // Reply sent successfully
    } catch (error) {
      console.error("Error sending reply:", error)
    } finally {
      setIsSending(false)
    }
  }

  function getPlatformIcon(platform: string) {
    switch(platform) {
      case "instagram": return <Instagram className="h-4 w-4 text-pink-600" />;
      case "facebook": return <Facebook className="h-4 w-4 text-blue-600" />;
      case "youtube": return <Youtube className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent>
        {comment ? (
          <div className="p-4 h-full overflow-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(comment.platform)}
                  <h2 className="text-xl font-semibold">
                    Comment from {comment.author}
                  </h2>
                  <Badge className={cn(
                    comment.answered 
                      ? "bg-green-50 text-green-700" 
                      : "bg-yellow-50 text-yellow-700"
                  )}>
                    <div className="flex items-center gap-1">
                      {comment.answered ? <CheckCircle2 className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {comment.answered ? "Answered" : "Pending"}
                    </div>
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(comment.date)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-500 mb-2">Post: {comment.postTitle}</div>
                <div className="text-lg">{comment.content}</div>
              </div>
            </div>

            <Separator className="my-4" />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Reply</h3>
              
              <Textarea
                placeholder="Write your reply here..."
                className="min-h-[150px] mb-4"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleGenerateReply}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Generate Reply
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(reply)}
                    disabled={!reply.trim()}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  
                  <Button
                    onClick={handleSendReply}
                    disabled={!reply.trim() || isSending}
                    className="gap-2"
                  >
                    {isSending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Reply on {comment.platform}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 flex items-center justify-center h-full">
            <p className="text-gray-500">No comment selected</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      <div className="flex h-[80vh] flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Social Media Comment</h2>
          <DialogClose className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        <div className="flex-1 overflow-auto p-0">
          {children}
        </div>
      </div>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export { 
  SocialModal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose
} 