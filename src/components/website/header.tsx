"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, Settings, Moon, Sun, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateBookmarkDialogGlobal from "@/components/bookmark/CreateBookmarkDialogGlobal";
import {  useSearchParams, useRouter, usePathname } from "next/navigation";


interface Collection {
  id: string;
  name: string;
  slug: string;
  isPublic: boolean;
  description?: string;
}

interface HeaderProps {
  selectedCollectionId?: string;
  currentFolderId?: string | null;
  onBookmarkAdded?: () => void;
  onCollectionChange?: (id: string) => void;
}

export function Header({ 
  selectedCollectionId, 
  currentFolderId, 
  onBookmarkAdded,
  onCollectionChange 
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSuccess = async (newBookmarkFolderId?: string) => {
    setDialogOpen(false);
    
    if (
      (newBookmarkFolderId && newBookmarkFolderId === currentFolderId) || 
      (!newBookmarkFolderId && !currentFolderId)
    ) {
      if (onBookmarkAdded) {
        await onBookmarkAdded();
      }
    }
    
    const targetFolderId = newBookmarkFolderId || currentFolderId;
    
    if (targetFolderId && targetFolderId !== currentFolderId) {
      const currentSearchParams = new URLSearchParams(searchParams.toString());
      currentSearchParams.set('folderId', targetFolderId);
      router.push(`${pathname}?${currentSearchParams.toString()}`);
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
      </div>
      
      <div className="flex items-center gap-2">
        {session && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              新建书签
            </Button>
          </>
        )}
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="切换主题">
                {theme === "monochrome" ? (
                  <Monitor className="h-4 w-4" />
                ) : theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                浅色主题
                {theme === "light" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                暗色主题
                {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("monochrome")}>
                <Monitor className="mr-2 h-4 w-4" />
                黑白主题
                {theme === "monochrome" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
          <Button asChild variant="outline" size="sm">
          <Link href="/admin/collections" aria-label="管理后台">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <CreateBookmarkDialogGlobal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultCollectionId={selectedCollectionId || ""}
        defaultFolderId={currentFolderId || undefined}
        onSuccess={handleSuccess}
      />
    </header>
  );
}