"use client";

import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  const { isOpen } = useSidebar();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ width: isOpen ? 240 : 0 }}
        animate={{ width: isOpen ? 240 : 0 }}
        exit={{ width: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "h-screen overflow-hidden",
          className
        )}
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.5)'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function SidebarBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
      {children}
    </div>
  );
}

export function DesktopSidebar({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:block">{children}</div>;
}

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  return <div className="block md:hidden">{children}</div>;
}

export function SidebarLink({
  href,
  icon: Icon,
  children,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium group",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 transition-colors duration-200",
        isActive ? "text-current" : "text-gray-600 group-hover:text-gray-800"
      )} />
      <div className="flex-1">{children}</div>
    </a>
  );
} 