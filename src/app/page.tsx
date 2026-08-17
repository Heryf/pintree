"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {  useSearchParams, useRouter, usePathname } from "next/navigation";
import { WebsiteSidebar } from "@/components/website/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BookmarkGrid } from "@/components/bookmark/BookmarkGrid";
import { Header } from "@/components/website/header";

import { Footer } from "@/components/website/footer";

import { GetStarted } from "@/components/website/get-started";
import { BackToTop } from "@/components/website/back-to-top";
import { Skeleton } from "@/components/ui/skeleton";

import type { Collection } from "@prisma/client";

/** 首屏加载骨架屏：模拟侧边栏 + 搜索栏 + 卡片网格，避免白屏/转圈 */
function HomeSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 shrink-0 flex-col gap-3 border-r border-border/40 bg-sidebar p-3 md:flex">
        <Skeleton className="h-10 w-full rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
      <div className="flex flex-1 flex-col space-y-8 px-4 sm:px-8 py-6">
        <Skeleton className="h-12 w-full max-w-[600px] rounded-full" />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchParamsComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionSlug = searchParams.get("collection");

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const routeToFolderInCollection = (collection: Collection, folderId?: string | null) => {
    const currentSearchParams = new URLSearchParams(searchParams.toString());
    collection?.slug ? currentSearchParams.set("collection", collection.slug) : currentSearchParams.delete("collection");
    folderId ? currentSearchParams.set("folderId", folderId) : currentSearchParams.delete("folderId");
    router.push(`${pathname}?${currentSearchParams.toString()}`);
  }

  useEffect(() => {
    const folderId = searchParams.get("folderId");
    setCurrentFolderId(folderId);

    const fetchCollectionsAndSetDefault = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/collections?publicOnly=true");
        const data = await response.json();
        setCollections(data);

        // set selected collection by slug
        if (collectionSlug) {
          const currentCollection = data.find(
            (c: Collection) => c.slug === collectionSlug
          );
          if (currentCollection) {
            setSelectedCollectionId(currentCollection.id);
            setCollectionName(currentCollection.name);
          }
        } else {
          const defaultCollection = data[0];
          setSelectedCollectionId(defaultCollection?.id ?? "");
          setCollectionName(defaultCollection?.name ?? "");
        }
      } catch (error) {
        console.error("获取 collections 失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionsAndSetDefault();
  }, [searchParams]);



  const handleCollectionChange = (id: string, slug?: string) => {
    const collection = collections.find((c) => c.id === id);
    if (!collection) return;

    setSelectedCollectionId(id);
    setCollectionName(collection.name || "");
    setCurrentFolderId(null);

    routeToFolderInCollection(collection);
  };

  const handleFolderSelect = (id: string | null) => {
    const collection = collections.find((c) => c.id === selectedCollectionId);
    if (!collection) return;

    routeToFolderInCollection(collection, id);
    setCurrentFolderId(id);
  };

  const refreshData = useCallback(async () => {
    if (selectedCollectionId) {
      try {
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("刷新数据失败:", error);
      }
    }
  }, [selectedCollectionId, currentFolderId]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        <SidebarProvider>
          {
          isLoading && !collections.length ? (
            <HomeSkeleton />
          ) : 
          selectedCollectionId || collectionSlug ? (
            <>
              <WebsiteSidebar
                selectedCollectionId={selectedCollectionId}
                currentFolderId={currentFolderId}
                onCollectionChange={handleCollectionChange}
                onFolderSelect={handleFolderSelect}
              />
              <div className="flex flex-1 flex-col space-y-8">
                <Header
                  selectedCollectionId={selectedCollectionId}
                  currentFolderId={currentFolderId}
                  onBookmarkAdded={refreshData}
                />
                <div className="flex-1 overflow-y-auto">
                  <BookmarkGrid
                    key={`${selectedCollectionId}-${currentFolderId}`}
                    collectionId={selectedCollectionId}
                    currentFolderId={currentFolderId}
                    collectionName={collectionName}
                    collectionSlug={
                      collections.find((c) => c.id === selectedCollectionId)
                        ?.slug || ""
                    }
                    refreshTrigger={refreshTrigger}
                  />
                </div>
                <Footer />
              </div>
              <BackToTop />
            </>
          ) : (
            <div className="flex flex-1">
              <GetStarted />
            </div>
          )}
        </SidebarProvider>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsComponent />
    </Suspense>
  );
}