"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  SwatchIcon
} from "@heroicons/react/24/outline";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarBody>
        <div className="mb-4">
          <h2 className="text-lg font-semibold px-3">Canvas</h2>
        </div>
        <SidebarLink 
          href="/dashboard" 
          icon={HomeIcon}
          isActive={pathname === "/dashboard"}
        >
          Dashboard
        </SidebarLink>
        <SidebarLink 
          href="/dashboard/canvas" 
          icon={SwatchIcon}
          isActive={pathname === "/dashboard/canvas"}
        >
          Canvas
        </SidebarLink>
        <SidebarLink 
          href="/users" 
          icon={UserGroupIcon}
          isActive={pathname === "/users"}
        >
          Users
        </SidebarLink>
        <SidebarLink 
          href="/settings" 
          icon={Cog6ToothIcon}
          isActive={pathname === "/settings"}
        >
          Settings
        </SidebarLink>
      </SidebarBody>
    </Sidebar>
  );
} 