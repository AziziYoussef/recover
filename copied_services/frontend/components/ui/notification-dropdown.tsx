"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Mock notifications for demo purposes
const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    title: "Your item has been found!",
    message: "Someone reported finding your lost wallet near the park.",
    time: "Just now",
    read: false,
  },
  {
    id: 2,
    title: "New message from finder",
    message: "Hello, I found your keys at the library. Let's connect to return them.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 3,
    title: "Verification completed",
    message: "Your item report has been verified and published.",
    time: "Yesterday",
    read: true,
  },
  {
    id: 4,
    title: "Reminder",
    message: "Don't forget to update your contact information for better item recovery.",
    time: "3 days ago",
    read: true,
  },
]

interface NotificationDropdownProps {
  className?: string
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [notifications, setNotifications] = React.useState(DEMO_NOTIFICATIONS)
  const [open, setOpen] = React.useState(false)
  
  const unreadCount = notifications.filter(notification => !notification.read).length

  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notification => ({
        ...notification,
        read: true,
      }))
    )
  }

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:bg-muted relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"></span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="text-sm font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        {notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="grid gap-1 p-1">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-md p-3 text-left text-sm transition-colors hover:bg-muted",
                    !notification.read && "bg-muted/50"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {notification.time}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {notification.message}
                  </div>
                  {!notification.read && (
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No notifications
          </div>
        )}
        <div className="border-t p-2">
          <Button variant="outline" size="sm" className="w-full">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 