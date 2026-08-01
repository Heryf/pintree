"use client";

import { useState, useEffect } from "react";
import { BookmarkCard } from "./BookmarkCard";
import { FolderCard } from "./FolderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, LayoutGrid, List, Droplets, Eye, EyeOff, Link as LinkIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/search/SearchBar";
import {  useSearchParams, useRouter, usePathname } from "next/navigation";


// 定义组件所需的接口类型
interface BookmarkGridProps {
  collectionId: string;
  currentFolderId: string | null;
  collectionName?: string;
  collectionSlug?: string;
  refreshTrigger?: number;
  pageSize?: number;
}

// 文件夹接口
interface Folder {
  id: string;
  name: string;
  icon?: string;
}

// 书签接口
interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  isFeatured: boolean;
  tags?: { name: string }[];
  collection?: { name: string; slug: string; };
  folder?: { name: string; slug: string; };
}

// 面包屑导航接口
interface BreadcrumbItem {
  id: string;
  name: string;
}

// 子文件夹数据接口
interface SubfolderData {
  id: string;
  name: string;
  icon?: string;
  items: Array<FolderItem | BookmarkItem>;
  totalBookmarks: number;
  bookmarkCount: number;
}

// 文件夹项目接口
interface FolderItem {
  type: 'folder';
  id: string;
  name: string;
  icon?: string;
}

// 书签项目接口
interface BookmarkItem {
  type: 'bookmark';
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  isFeatured: boolean;
  tags?: { name: string }[];
}

export function BookmarkGrid({ 
  collectionId, 
  currentFolderId, 
  collectionName = "Root", 
  collectionSlug, 
  refreshTrigger = 0, 
  pageSize = 100 
}: BookmarkGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 状态管理
  const [currentBookmarks, setCurrentBookmarks] = useState<Bookmark[]>([]);
  const [subfolders, setSubfolders] = useState<SubfolderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [searchResults, setSearchResults] = useState<Bookmark[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchScope, setSearchScope] = useState<'all' | 'current'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [currentEngine, setCurrentEngine] = useState("Bookmarks");
  const [enableSearch, setEnableSearch] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarkStyle, setBookmarkStyle] = useState<'default' | 'glass'>('default');
  const [showUrl, setShowUrl] = useState(true);
  const [showDescription, setShowDescription] = useState(true);

  const routeToFolderInCollection = (collectionSlug: string, folderId?: string) => {
    const currentSearchParams = new URLSearchParams(searchParams.toString());
    collectionSlug ? currentSearchParams.set("collection", collectionSlug) : currentSearchParams.delete("collection");
    folderId ? currentSearchParams.set("folderId", folderId) : currentSearchParams.delete("folderId");
    router.push(`${pathname}?${currentSearchParams.toString()}`, { scroll: false });
  }

  // 获取书签和文件夹数据的异步函数
  const fetchBookmarkData = async (folderId: string | null) => {
    try {
      setLoading(true);
      
      // 构建获取书签的 API 请求
      const response = await fetch(
        `/api/collections/${collectionId}/bookmarks?` +
        `includeSubfolders=true` +
        (folderId ? `&folderId=${folderId}` : '')
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      console.log("Received data:", data);
      setCurrentBookmarks(data.currentBookmarks || []);
      setSubfolders(data.subfolders || []);

      // 获取面包屑导航
      if (folderId) {
        const pathResponse = await fetch(`/api/collections/${collectionId}/folders/${folderId}/path`);
        if (pathResponse.ok) {
          const pathData = await pathResponse.json();
          setBreadcrumbs(pathData);
        }
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error("Get data failed:", error);
      setCurrentBookmarks([]);
      setSubfolders([]);
    } finally {
      setLoading(false);
    }
  };

  // 监听路由参数和刷新触发器变化
  useEffect(() => {
    if (collectionId) {
      console.log("Fetching data with:", { collectionId, currentFolderId });
      fetchBookmarkData(currentFolderId);
    }
  }, [collectionId, currentFolderId, refreshTrigger]); 

  // 处理文件夹点击事件
  const handleFolderNavigation = async (folderId: string | null) => {
    if (!collectionSlug) return;
    
    // 立即更新面包屑状态
    if (folderId === null) {
      setBreadcrumbs([]);
    }
    
    // 更新路由
    if (folderId === null) {
      routeToFolderInCollection(collectionSlug);
    } else {
      routeToFolderInCollection(collectionSlug, folderId);
    }
    
    // 立即获取新数据
    await fetchBookmarkData(folderId);
  };

  // 搜索处理函数
  const performBookmarkSearch = async (query: string, scope: 'all' | 'current', page: number = 1) => {
    setInputValue(query);
    
    // 如果搜索内容为空，清除搜索状态
    if (!query.trim()) {
      setSearchResults([]);
      setInputValue("");
      setCurrentPage(1);
      setTotalPages(1);
      setTotalResults(0);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/search/bookmarks?` +
        `q=${encodeURIComponent(query)}` +
        `&scope=${scope}` +
        `&collectionId=${collectionId}` +
        `&page=${page}` +
        `&pageSize=${pageSize}`
      );
      const data = await response.json();
      setSearchResults(data.bookmarks || []);
      setTotalPages(Math.ceil(data.total / pageSize));
      setTotalResults(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  };

  // 分页处理函数
  const handlePageChange = (newPage: number) => {
    if (inputValue) {
      performBookmarkSearch(inputValue, searchScope, newPage);
    }
  };

  // 调试用的副作用钩子，记录子文件夹信息
  // useEffect(() => {
  //   console.log("Subfolders:", subfolders);
  //   subfolders.forEach(subfolder => {
  //     console.log(`Folder ${subfolder.name}:`, {
  //       id: subfolder.id,
  //       items: subfolder.items.length,
  //       bookmarks: subfolder.items.filter(item => item.type === 'bookmark').length,
  //       bookmarkCount: subfolder.bookmarkCount,
  //       rawData: subfolder,
  //       allProps: Object.keys(subfolder)
  //     });
  //   });
  // }, [subfolders]);

  // 加载搜索设置的副作用钩子
  useEffect(() => {
    const loadSearchSetting = async () => {
      try {
        const response = await fetch('/api/settings?group=feature');
        const data = await response.json();
        setEnableSearch(data.enableSearch === 'true' || data.enableSearch === true);
        setBookmarkStyle(data.bookmarkStyle === 'glass' ? 'glass' : 'default');
        setShowUrl(data.showBookmarkUrl !== 'false' && data.showBookmarkUrl !== false);
        setShowDescription(data.showBookmarkDescription !== 'false' && data.showBookmarkDescription !== false);
      } catch (error) {
        console.error('Load search settings failed:', error);
      }
    };

    loadSearchSetting();
  }, []);

  // 如果没有集合ID，显示加载状态
  if (!collectionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // 加载中状态的骨架屏
  if (loading) {
    return (
      <div className="px-6 space-y-6">
        {/* 搜索栏骨架屏 - 添加条件渲染 */}
        {enableSearch && (
          <div className="flex justify-center mt-4 mb-12">
            <Skeleton className="h-12 w-[600px] rounded-full" />
          </div>
        )}

        {/* 面包屑导航骨架屏 */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-20 rounded-2xl" />
          <Skeleton className="h-8 w-24 rounded-2xl" />
        </div>

        {/* 内容区域骨架屏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-[90px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // 渲染主组件
  return (
    <div className="px-6 space-y-6">
      {/* 搜索栏 - 添加条件渲染 */}
      {enableSearch && (
        <div className="flex justify-center mt-4 mb-12">
          <SearchBar
            placeholder="搜索书签..."
            onSearch={performBookmarkSearch}
            currentEngine={currentEngine}
            onEngineChange={setCurrentEngine}
            currentCollection={searchScope}
            onCollectionChange={(scope) => setSearchScope(scope as 'all' | 'current')}
          />
        </div>
      )}

      {/* 视图与展示风格切换 */}
      {!inputValue && (
        <div className="flex justify-end gap-2">
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={bookmarkStyle === 'default' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBookmarkStyle('default')}
              className="h-7 px-2 text-xs"
              aria-label="默认样式"
            >
              默认
            </Button>
            <Button
              variant={bookmarkStyle === 'glass' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBookmarkStyle('glass')}
              className="h-7 px-2 text-xs"
              aria-label="毛玻璃样式"
            >
              <Droplets className="h-3 w-3 mr-1" />
              毛玻璃
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={showUrl ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setShowUrl((v) => !v)}
              className="h-7 w-7"
              aria-label={showUrl ? '隐藏链接' : '显示链接'}
              title={showUrl ? '隐藏链接' : '显示链接'}
            >
              {showUrl ? <LinkIcon className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant={showDescription ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setShowDescription((v) => !v)}
              className="h-7 w-7"
              aria-label={showDescription ? '隐藏说明' : '显示说明'}
              title={showDescription ? '隐藏说明' : '显示说明'}
            >
              {showDescription ? <FileText className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              aria-label="网格视图"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              aria-label="列表视图"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 面包屑导航 - 仅在非根目录且非搜索状态时显示 */}
      {currentFolderId && !searchResults.length && !inputValue && (
        <nav className="flex mb-4 items-center space-x-1">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => handleFolderNavigation(null)}
            className={cn(
              "hover:bg-white px-0",
              !currentFolderId && "bg-white"
            )}
          >
            {collectionName}
          </Button>
          
          {breadcrumbs.length > 0 && (
            <>
              <ChevronRight className="h-4 w-4" />
              {breadcrumbs.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFolderNavigation(item.id)}
                    className={cn(
                      "hover:text-gray-500 hover:bg-white px-0",
                      currentFolderId === item.id && "text-gray-500 bg-white"
                    )}
                  >
                    {item.name}
                  </Button>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              ))}
            </>
          )}
        </nav>
      )}

      {/* 内容区域 */}
      {isSearching ? (
        <div className="space-y-6">
          {/* 搜索加载状态显示 */}
        </div>
      ) : (
        <div className="space-y-12">
          {/* 搜索结果显示 */}
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">搜索结果（{totalResults}）</h2>
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"}>
                {searchResults.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    title={bookmark.title}
                    url={bookmark.url}
                    description={bookmark.description}
                    icon={bookmark.icon}
                    isFeatured={bookmark.isFeatured}
                    tags={bookmark.tags}
                    compact={viewMode === 'list'}
                    glass={bookmarkStyle === 'glass'}
                    showUrl={showUrl}
                    showDescription={showDescription}
                  />
                ))}
              </div>
            </div>
          ) : inputValue ? (
            <div className="text-center text-gray-500 py-12">
              未找到相关结果
            </div>
          ) : (
            // 原有的文件夹和书签显示逻辑，非搜索状态
            <>
              {/* 当前文件夹的子文件夹，以绿色卡片网格展示在上方 */}
              {subfolders?.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    {currentFolderId ? "子文件夹" : collectionName}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {subfolders.map((subfolder) => (
                      <FolderCard
                        key={subfolder.id}
                        name={subfolder.name}
                        icon={subfolder.icon}
                        bookmarkCount={subfolder.bookmarkCount}
                        onClick={() => handleFolderNavigation(subfolder.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 当前文件夹的书签，展示在子文件夹下方 */}
              {currentBookmarks?.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    {currentFolderId ? breadcrumbs[breadcrumbs.length - 1]?.name : `${collectionName} 书签`}
                  </h2>
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"}>
                    {currentBookmarks.map((bookmark) => (
                      <BookmarkCard
                        key={bookmark.id}
                        title={bookmark.title}
                        url={bookmark.url}
                        description={bookmark.description}
                        icon={bookmark.icon}
                        isFeatured={bookmark.isFeatured}
                        tags={bookmark.tags}
                        compact={viewMode === 'list'}
                        glass={bookmarkStyle === 'glass'}
                        showUrl={showUrl}
                        showDescription={showDescription}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 分页按钮部分 */}
      {searchResults.length > 0 && (
        <div className="flex items-center justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          <span className="mx-4">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}