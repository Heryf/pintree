"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingImages } from "@/hooks/useSettingImages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Folder } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  isPublic: boolean;
  slug: string | null;
}

interface NavFolderItem {
  id: string;
  name: string;
  icon?: string | null;
  level: number;
  bookmarkCount: number;
}

interface WebsiteSidebarProps {
  onFolderSelect?: (folderId: string | null) => void;
  onCollectionChange?: (collectionId: string) => void;
  selectedCollectionId: string;
  currentFolderId: string | null;
  collections?: Collection[];
  navFolders?: NavFolderItem[];
  activeSectionId?: string | null;
  onSectionClick?: (folderId: string) => void;
}

export function WebsiteSidebar({
  onCollectionChange,
  selectedCollectionId,
  collections = [],
  navFolders = [],
  activeSectionId,
  onSectionClick,
}: WebsiteSidebarProps) {
  const { images, isLoading } = useSettingImages("logoUrl");

  const handleNavClick = (folderId: string) => {
    if (onSectionClick) {
      onSectionClick(folderId);
    } else {
      document.getElementById(`section-${folderId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <Sidebar className="flex flex-col h-screen bg-[#FAFAFA] dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 monochrome:bg-sidebar-background monochrome:border-sidebar-border">
      <SidebarHeader className="flex-shrink-0">
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-transparent rounded-none pr-0"
              >
                <Link
                  href="/"
                  className="pl-0 flex items-center gap-2 justify-start rounded-none pr-0 w-full h-[60px]"
                >
                  <Image
                    src={images[0]?.url || "/logo.png"}
                    alt="Logo"
                    width={260}
                    height={60}
                    style={{ objectFit: "contain" }}
                  />
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 合集选择与返回首页 */}
      <div className="px-3 py-3 space-y-2 border-b border-gray-200 dark:border-gray-800 monochrome:border-sidebar-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
        >
          <Home className="h-4 w-4" />
          返回合集列表
        </Link>
        {collections.length > 1 && (
          <Select
            value={selectedCollectionId}
            onValueChange={(value) => {
              if (onCollectionChange) onCollectionChange(value);
            }}
          >
            <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 monochrome:bg-white/5 monochrome:border-white/10">
              <SelectValue placeholder="选择书签合集" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  <div className="flex items-center gap-2">
                    <Folder className="h-3.5 w-3.5 text-emerald-500 monochrome:text-white/70" />
                    {collection.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 扁平导航列表 */}
      <SidebarContent className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <SidebarGroup>
          <SidebarMenu className="space-y-0.5 px-2">
            {navFolders.length > 0 ? (
              navFolders.map((folder) => (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton
                    onClick={() => handleNavClick(folder.id)}
                    className={cn(
                      "flex items-center w-full rounded-lg transition-all duration-200 py-2",
                      "hover:bg-gray-100 dark:hover:bg-gray-800/60",
                      "monochrome:hover:bg-white/8",
                      activeSectionId === folder.id
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium monochrome:bg-white/10 monochrome:text-white"
                        : "text-gray-600 dark:text-gray-400 monochrome:text-white/70",
                    )}
                    style={{
                      paddingLeft: `${folder.level * 14 + 12}px`,
                      paddingRight: "12px",
                    }}
                  >
                    <span className="truncate text-sm">{folder.name}</span>
                    {folder.bookmarkCount > 0 && (
                      <span className="ml-auto text-[10px] text-muted-foreground/60 dark:text-gray-600 monochrome:text-white/40 flex-shrink-0">
                        {folder.bookmarkCount}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-sm text-muted-foreground dark:text-gray-400 space-y-2">
                <Folder className="h-8 w-8 opacity-50" />
                <span>暂无文件夹</span>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
