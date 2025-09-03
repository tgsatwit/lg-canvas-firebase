"use client";

import { createContext, useContext, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
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
  const toggle = () => setIsOpen(!isOpen);
  
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
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
    <motion.div
      animate={{ width: isOpen ? 320 : 80 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "h-screen overflow-hidden relative flex-shrink-0",
        className
      )}
      style={{
        background: `
          linear-gradient(180deg, 
            rgba(255, 255, 255, 0.98) 0%,
            rgba(250, 251, 253, 0.98) 100%
          )
        `,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: `
          4px 0 24px rgba(0, 0, 0, 0.04),
          2px 0 8px rgba(0, 0, 0, 0.02),
          inset -1px 0 0 rgba(255, 255, 255, 0.7)
        `
      }}
    >
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

export function SidebarBody({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  
  return (
    <div className="flex flex-col h-full">
      <div className={cn(
        "flex flex-col flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent",
        isOpen ? "px-6 py-8 space-y-8" : "px-4 py-8 space-y-6"
      )}>
        {children}
      </div>
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
  children,
  isActive,
  badge,
}: {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  badge?: string | number;
}) {
  const { isOpen } = useSidebar();
  
  return (
    <a
      href={href}
      className={cn(
        "relative flex items-center rounded-2xl transition-all duration-300 font-medium group",
        isOpen ? "px-4 py-2.5 text-sm" : "px-4 py-4 justify-center",
        isActive
          ? "text-white shadow-lg"
          : "text-gray-700 hover:text-gray-900 hover:bg-pink-50/50"
      )}
      style={isActive ? {
        background: `
          linear-gradient(135deg, 
            rgba(236, 72, 153, 0.95) 0%,
            rgba(139, 92, 246, 0.95) 100%
          )
        `,
        boxShadow: `
          0 4px 20px rgba(236, 72, 153, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.1)
        `
      } : {}}
    >
      {!isOpen && (
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200",
          isActive 
            ? "text-white" 
            : "text-gray-500 group-hover:text-pink-600"
        )}>
          {typeof children === 'string' ? children.charAt(0).toUpperCase() : 'P'}
        </div>
      )}
      
      {isOpen && (
        <>
          <div className="flex-1 min-w-0">
            {children}
          </div>
          {badge && (
            <span className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full",
              isActive 
                ? "bg-white/20 text-white" 
                : "bg-pink-50 text-pink-700 border border-pink-200"
            )}>
              {badge}
            </span>
          )}
        </>
      )}
      
      {!isOpen && badge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          {badge}
        </span>
      )}
    </a>
  );
} 