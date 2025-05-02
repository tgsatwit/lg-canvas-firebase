'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Globe, Lock, Clock, Settings, X, ListFilter, FolderPlus } from "lucide-react"

interface PlaylistEditorModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const PlaylistEditorModal = ({ open, onOpenChange, children }: PlaylistEditorModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent>
        <PlaylistEditorTabs />
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
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      <div className="flex h-[80vh] flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Playlist Details</h2>
          <DialogClose className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
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

interface TabData {
  id: string
  label: string
  icon: React.ReactNode
  content: React.ReactNode
}

const PlaylistEditorTabs = () => {
  const tabs: TabData[] = [
    {
      id: "details",
      label: "Details",
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Add a title that describes your playlist" defaultValue="My Awesome Playlist" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Tell viewers about your playlist" 
              className="min-h-32"
              defaultValue="This is a description of my awesome playlist. It contains several great videos about this topic."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select defaultValue="education">
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" placeholder="Add tags separated by commas" defaultValue="tutorial, programming, react" />
            <p className="text-xs text-muted-foreground">Tags help viewers find your playlist</p>
          </div>
        </div>
      )
    },
    {
      id: "videos",
      label: "Videos",
      icon: <ListFilter className="h-4 w-4" />,
      content: (
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Add Videos</h3>
            <Button variant="outline" size="sm">
              Search Videos
            </Button>
          </div>
          
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground mb-4">Selected Videos (0)</div>
            <div className="flex flex-col space-y-2">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FolderPlus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-sm font-medium">No videos added</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Search for videos to add to this playlist
                </p>
                <Button className="mt-4" size="sm">Browse Videos</Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reorder">Allow automatic reordering</Label>
              <Switch id="reorder" />
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, videos may be automatically reordered to maximize viewer engagement
            </p>
          </div>
        </div>
      )
    },
    {
      id: "visibility",
      label: "Visibility",
      icon: <Globe className="h-4 w-4" />,
      content: (
        <div className="space-y-6 p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">Public</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Selected</span>
                </div>
                <p className="text-sm text-muted-foreground">Everyone can see this playlist</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 rounded-full bg-muted p-2 text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Private</h3>
                <p className="text-sm text-muted-foreground">Only you and people you choose can see this playlist</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 rounded-full bg-muted p-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Scheduled</h3>
                <p className="text-sm text-muted-foreground">Set a date and time to publish your playlist</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="comments">Allow comments</Label>
              <Switch id="comments" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="recommendations">Show in recommendations</Label>
              <Switch id="recommendations" defaultChecked />
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <Tabs defaultValue="details" className="h-full">
      <TabsList className="grid w-full grid-cols-3 border-b border-border rounded-none bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="h-[calc(80vh-53px)] overflow-auto">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export { 
  PlaylistEditorModal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose
} 