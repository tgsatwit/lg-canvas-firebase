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
import { Globe, Lock, DollarSign, Clock, Settings, X } from "lucide-react"

interface VideoEditorModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const VideoEditorModal = ({ open, onOpenChange, children }: VideoEditorModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent>
        <VideoEditorTabs />
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
          <h2 className="text-xl font-semibold text-foreground">Video Details</h2>
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

const VideoEditorTabs = () => {
  const tabs: TabData[] = [
    {
      id: "details",
      label: "Details",
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Add a title that describes your video" defaultValue="My Awesome Video" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Tell viewers about your video" 
              className="min-h-32"
              defaultValue="This is a description of my awesome video. It contains lots of great content that you'll want to watch!"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail</Label>
            <div className="flex items-center gap-4">
              <div className="relative aspect-video w-40 overflow-hidden rounded-md border border-border bg-muted">
                <img 
                  src="https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=200" 
                  alt="Video thumbnail" 
                  className="h-full w-full object-cover"
                />
              </div>
              <Button variant="outline" size="sm">Upload thumbnail</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="playlist">Playlist</Label>
            <Select defaultValue="none">
              <SelectTrigger>
                <SelectValue placeholder="Add to playlist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
                <SelectItem value="tutorials">Tutorials</SelectItem>
                <SelectItem value="vlogs">Vlogs</SelectItem>
              </SelectContent>
            </Select>
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
                <p className="text-sm text-muted-foreground">Everyone can see this video</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 rounded-full bg-muted p-2 text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Private</h3>
                <p className="text-sm text-muted-foreground">Only you and people you choose can see this video</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 rounded-full bg-muted p-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Scheduled</h3>
                <p className="text-sm text-muted-foreground">Set a date and time to publish your video</p>
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
    },
    {
      id: "monetization",
      label: "Monetization",
      icon: <DollarSign className="h-4 w-4" />,
      content: (
        <div className="space-y-6 p-6">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Monetization Status</h3>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">Eligible</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">This video meets the requirements for monetization</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Ad formats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="display-ads">Display ads</Label>
                <Switch id="display-ads" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="overlay-ads">Overlay ads</Label>
                <Switch id="overlay-ads" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="skippable-ads">Skippable video ads</Label>
                <Switch id="skippable-ads" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="non-skippable-ads">Non-skippable video ads</Label>
                <Switch id="non-skippable-ads" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2 border-t border-border pt-6">
            <h3 className="font-medium">Additional options</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="product-placement">Product placement</Label>
              <Switch id="product-placement" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sponsorship">Paid promotion</Label>
              <Switch id="sponsorship" />
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
  VideoEditorModal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose
} 