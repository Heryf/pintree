"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BookmarkCard } from "./BookmarkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Folder,
  FolderOpen,
  LayoutGrid,
  List,
  Droplets,
  Eye,
  EyeOff,
  Link as LinkIcon,
  FileText,
  Search,
  X,
} from "lucide-react";

// ===== 类型定义 =====
interface BookmarkData {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  icon?: string | null;
  isFeatured: boolean;
  folderId?: string | null;
  tags: { name: string }[];
  folder?: { name: string } | null;
}

interface FolderData {
  id: string;
  name: string;
  icon?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isPublic: boolean;
}

interface FolderNode extends FolderData {
  level: number;
  children: FolderNode[];
  bookmarks: BookmarkData[];
  totalBookmarks: number;
}

export interface NavFolderItem {
  id: string;
  name: string;
  icon?: string | null;
  level: number;
  bookmarkCount: number;
}

interface SinglePageViewProps {
  collectionId: string;
  collectionName: string;
  collectionSlug?: string;
  refreshTrigger?: number;
  onNavFoldersChange?: (folders: NavFolderItem[]) => void;
  onActiveSectionChange?: (sectionId: string | null) => void;
}

// ===== 工具函数 =====
function buildFolderTree(
  folders: FolderData[],
  bookmarks: BookmarkData[]
): { tree: FolderNode[]; rootBookmarks: BookmarkData[] } {
  const folderMap = new Map<string, FolderNode>();

  // 创建所有节点
  folders.forEach((f) => {
    folderMap.set(f.id, {
      ...f,
      level: 0,
      children: [],
      bookmarks: [],
      totalBookmarks: 0,
    });
  });

  // 分配书签到文件夹
  bookmarks.forEach((b) => {
    if (b.folderId && folderMap.has(b.folderId)) {
      folderMap.get(b.folderId)!.bookmarks.push(b);
    }
  });

  // 计算每个文件夹的总书签数（包括子文件夹）
  const computeTotal = (node: FolderNode): number => {
    node.totalBookmarks = node.bookmarks.length;
    node.children.forEach((child) => {
      node.totalBookmarks += computeTotal(child);
    });
    return node.totalBookmarks;
  };

  // 构建树结构
  const rootNodes: FolderNode[] = [];
  folders.forEach((f) => {
    const node = folderMap.get(f.id)!;
    if (f.parentId && folderMap.has(f.parentId)) {
      folderMap.get(f.parentId)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  // 计算层级
  const setLevel = (nodes: FolderNode[], level: number) => {
    nodes.forEach((n) => {
      n.level = level;
      setLevel(n.children, level + 1);
    });
  };
  setLevel(rootNodes, 0);

  // 计算总书签数
  rootNodes.forEach(computeTotal);

  // 排序
  const sortNodes = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(rootNodes);

  const rootBookmarks = bookmarks.filter((b) => !b.folderId);

  return { tree: rootNodes, rootBookmarks };
}

function flattenForNav(tree: FolderNode[]): NavFolderItem[] {
  const result: NavFolderItem[] = [];
  const walk = (nodes: FolderNode[]) => {
    nodes.forEach((n) => {
      // 只显示有书签的文件夹（包括子文件夹中有书签的）
      if (n.totalBookmarks > 0) {
        result.push({
          id: n.id,
          name: n.name,
          icon: n.icon,
          level: n.level,
          bookmarkCount: n.totalBookmarks,
        });
      }
      walk(n.children);
    });
  };
  walk(tree);
  return result;
}

// ===== 主组件 =====
export function SinglePageView({
  collectionId,
  collectionName,
  refreshTrigger = 0,
  onNavFoldersChange,
  onActiveSectionChange,
}: SinglePageViewProps) {
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [rootBookmarks, setRootBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [enableSearch, setEnableSearch] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [bookmarkStyle, setBookmarkStyle] = useState<"default" | "glass">(
    "default"
  );
  const [showUrl, setShowUrl] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // ===== 数据获取 =====
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [dataResponse, settingsResponse] = await Promise.all([
          fetch(`/api/collections/${collectionId}/all-bookmarks`),
          fetch("/api/settings?group=feature"),
        ]);

        const data = await dataResponse.json();
        const settings = await settingsResponse.json();

        setEnableSearch(
          settings.enableSearch === "true" || settings.enableSearch === true
        );
        setBookmarkStyle(settings.bookmarkStyle === "glass" ? "glass" : "default");
        setShowUrl(
          settings.showBookmarkUrl !== "false" &&
            settings.showBookmarkUrl !== false
        );
        setShowDescription(
          settings.showBookmarkDescription !== "false" &&
            settings.showBookmarkDescription !== false
        );

        const { tree, rootBookmarks } = buildFolderTree(
          data.folders,
          data.bookmarks
        );
        setFolderTree(tree);
        setRootBookmarks(rootBookmarks);

        const navFolders = flattenForNav(tree);
        onNavFoldersChange?.(navFolders);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, refreshTrigger]);

  // ===== 滚动监听（Scroll Spy）=====
  useEffect(() => {
    if (loading || folderTree.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.id.replace("section-", "");
          setActiveSectionId(id);
          onActiveSectionChange?.(id);
        }
      },
      {
        rootMargin: "-100px 0px -60% 0px",
        threshold: [0, 0.1, 0.3, 0.5, 1],
      }
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, folderTree, onActiveSectionChange]);

  // ===== 客户端搜索 =====
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();
    const allBookmarks: BookmarkData[] = [...rootBookmarks];

    const collectBookmarks = (nodes: FolderNode[]) => {
      nodes.forEach((n) => {
        allBookmarks.push(...n.bookmarks);
        collectBookmarks(n.children);
      });
    };
    collectBookmarks(folderTree);

    return allBookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.url.toLowerCase().includes(query) ||
        (b.description?.toLowerCase().includes(query) ?? false) ||
        b.tags.some((t) => t.name.toLowerCase().includes(query))
    );
  }, [searchQuery, folderTree, rootBookmarks]);

  // ===== 渲染分区 =====
  const renderSection = (folder: FolderNode): React.ReactNode => {
    if (folder.totalBookmarks === 0) return null;

    const hasSubfolders = folder.children.length > 0;
    const isTopLevel = folder.level === 0;

    return (
      <section
        key={folder.id}
        id={`section-${folder.id}`}
        ref={(el) => {
          if (el) sectionRefs.current.set(`section-${folder.id}`, el);
          else sectionRefs.current.delete(`section-${folder.id}`);
        }}
        className={cn(
          "scroll-mt-20",
          isTopLevel ? "mb-10" : "mb-6",
          folder.level > 0 && "ml-4"
        )}
      >
        {/* 分区标题 */}
        <div
          className={cn(
            "group/header flex items-center gap-2.5 mb-4 cursor-default rounded-lg transition-colors duration-200",
            "hover:bg-gray-100/60 dark:hover:bg-gray-800/40 -mx-2 px-2 py-1.5",
            "monochrome:hover:bg-white/5"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-300 group-hover/header:scale-110",
              isTopLevel ? "w-9 h-9" : "w-7 h-7",
              isTopLevel
                ? "bg-emerald-100 dark:bg-emerald-900/30 monochrome:bg-white/10"
                : "bg-gray-100 dark:bg-gray-800 monochrome:bg-white/5"
            )}
          >
            {folder.icon ? (
              <img
                src={folder.icon}
                alt={folder.name}
                className={cn(
                  "object-contain",
                  isTopLevel ? "w-6 h-6" : "w-4 h-4"
                )}
              />
            ) : hasSubfolders ? (
              <FolderOpen
                className={cn(
                  "text-emerald-600 dark:text-emerald-400 monochrome:text-white/80",
                  isTopLevel ? "w-5 h-5" : "w-4 h-4"
                )}
              />
            ) : (
              <Folder
                className={cn(
                  "text-emerald-600 dark:text-emerald-400 monochrome:text-white/80",
                  isTopLevel ? "w-5 h-5" : "w-4 h-4"
                )}
              />
            )}
          </div>
          <h2
            className={cn(
              "font-semibold tracking-tight transition-colors",
              isTopLevel ? "text-lg" : "text-base",
              "text-gray-800 dark:text-gray-200 monochrome:text-white/90",
              "group-hover/header:text-emerald-600 dark:group-hover/header:text-emerald-400 monochrome:group-hover/header:text-white"
            )}
          >
            {folder.name}
          </h2>
          <span className="text-xs text-muted-foreground dark:text-gray-500 monochrome:text-white/40">
            {folder.totalBookmarks} 个书签
          </span>
        </div>

        {/* 书签网格 */}
        {folder.bookmarks.length > 0 && (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                : "flex flex-col gap-2"
            )}
          >
            {folder.bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                title={bookmark.title}
                url={bookmark.url}
                description={bookmark.description || undefined}
                icon={bookmark.icon || undefined}
                isFeatured={bookmark.isFeatured}
                tags={bookmark.tags}
                compact={viewMode === "list"}
                glass={bookmarkStyle === "glass"}
                showUrl={showUrl}
                showDescription={showDescription}
              />
            ))}
          </div>
        )}

        {/* 子文件夹分区 */}
        {folder.children.map((child) => renderSection(child))}
      </section>
    );
  };

  // ===== 加载状态 =====
  if (loading) {
    return (
      <div className="px-6 py-6 space-y-8">
        <div className="flex justify-center">
          <Skeleton className="h-10 w-[400px] rounded-full" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {[...Array(8)].map((_, j) => (
                <Skeleton key={j} className="h-[88px] rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ===== 渲染 =====
  return (
    <div className="px-6 py-6">
      {/* 搜索栏 */}
      {enableSearch && (
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索书签..."
              className="pl-10 pr-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 monochrome:bg-white/5 monochrome:border-white/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 工具栏 */}
      {!searchQuery && (
        <div className="flex justify-end gap-2 mb-6">
          <div className="flex items-center gap-1 rounded-md border p-0.5 bg-background">
            <Button
              variant={bookmarkStyle === "default" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBookmarkStyle("default")}
              className="h-7 px-2 text-xs"
            >
              默认
            </Button>
            <Button
              variant={bookmarkStyle === "glass" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBookmarkStyle("glass")}
              className="h-7 px-2 text-xs"
            >
              <Droplets className="h-3 w-3 mr-1" />
              毛玻璃
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-md border p-0.5 bg-background">
            <Button
              variant={showUrl ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowUrl((v) => !v)}
              className="h-7 w-7"
              title={showUrl ? "隐藏链接" : "显示链接"}
            >
              {showUrl ? (
                <LinkIcon className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant={showDescription ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowDescription((v) => !v)}
              className="h-7 w-7"
              title={showDescription ? "隐藏说明" : "显示说明"}
            >
              {showDescription ? (
                <FileText className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-md border p-0.5 bg-background">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-7 w-7"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-7 w-7"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {searchResults ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            搜索结果（{searchResults.length}）
          </h2>
          {searchResults.length > 0 ? (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                  : "flex flex-col gap-2"
              )}
            >
              {searchResults.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  title={bookmark.title}
                  url={bookmark.url}
                  description={bookmark.description || undefined}
                  icon={bookmark.icon || undefined}
                  isFeatured={bookmark.isFeatured}
                  tags={bookmark.tags}
                  compact={viewMode === "list"}
                  glass={bookmarkStyle === "glass"}
                  showUrl={showUrl}
                  showDescription={showDescription}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              未找到相关结果
            </div>
          )}
        </div>
      ) : (
        /* 单页平铺内容 */
        <div className="space-y-2">
          {/* 根级别书签 */}
          {rootBookmarks.length > 0 && (
            <section
              id="section-root"
              ref={(el) => {
                if (el) sectionRefs.current.set("section-root", el);
                else sectionRefs.current.delete("section-root");
              }}
              className="scroll-mt-20 mb-10"
            >
              <div className="group/header flex items-center gap-2.5 mb-4 rounded-lg transition-colors duration-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 -mx-2 px-2 py-1.5 monochrome:hover:bg-white/5">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 monochrome:bg-white/10">
                  <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 monochrome:text-white/80" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 monochrome:text-white/90">
                  {collectionName}
                </h2>
                <span className="text-xs text-muted-foreground dark:text-gray-500 monochrome:text-white/40">
                  {rootBookmarks.length} 个书签
                </span>
              </div>
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                    : "flex flex-col gap-2"
                )}
              >
                {rootBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    title={bookmark.title}
                    url={bookmark.url}
                    description={bookmark.description || undefined}
                    icon={bookmark.icon || undefined}
                    isFeatured={bookmark.isFeatured}
                    tags={bookmark.tags}
                    compact={viewMode === "list"}
                    glass={bookmarkStyle === "glass"}
                    showUrl={showUrl}
                    showDescription={showDescription}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 文件夹分区 */}
          {folderTree.map((folder) => renderSection(folder))}

          {/* 空状态 */}
          {folderTree.length === 0 && rootBookmarks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Folder className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg">暂无书签</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
