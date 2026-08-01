"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { WebsiteSidebar } from "@/components/website/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SinglePageView, NavFolderItem } from "@/components/bookmark/SinglePageView";
import { Header } from "@/components/website/header";

import { Footer } from "@/components/website/footer";
import { TopBanner } from "@/components/website/top-banner";

import { GetStarted } from "@/components/website/get-started";
import { BackToTop } from "@/components/website/back-to-top";
import { CollectionGrid } from "@/components/collection/CollectionGrid";

import { Collection } from "@prisma/client";

function SearchParamsComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionSlug = searchParams.get("collection");

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [collectionName, setCollectionName] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const router = useRouter();
  const { setTheme } = useTheme();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [wallpaperUrl, setWallpaperUrl] = useState<string>("");

  // 单页平铺布局相关状态
  const [navFolders, setNavFolders] = useState<NavFolderItem[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const routeToFolderInCollection = (collection: Collection, folderId?: string | null) => {
    const currentSearchParams = new URLSearchParams(searchParams.toString());
    collection?.slug ? currentSearchParams.set("collection", collection.slug) : currentSearchParams.delete("collection");
    folderId ? currentSearchParams.set("folderId", folderId) : currentSearchParams.delete("folderId");
    router.push(`${pathname}?${currentSearchParams.toString()}`);
  };

  useEffect(() => {
    const fetchCollectionsAndSetDefault = async () => {
      try {
        setIsLoading(true);
        const [collectionsResponse, settingsResponse] = await Promise.all([
          fetch("/api/collections?publicOnly=true"),
          fetch("/api/settings?group=feature")
        ]);
        const data = await collectionsResponse.json();
        setCollections(data);

        const displaySettings = await settingsResponse.json();
        setWallpaperUrl(displaySettings.wallpaperUrl || "");
        if (displaySettings.defaultTheme && ["light", "dark", "monochrome"].includes(displaySettings.defaultTheme)) {
          setTheme(displaySettings.defaultTheme);
        }

        if (collectionSlug) {
          const currentCollection = data.find(
            (c: Collection) => c.slug === collectionSlug
          );
          if (currentCollection) {
            setSelectedCollectionId(currentCollection.id);
            setCollectionName(currentCollection.name);
          }
        } else {
          setSelectedCollectionId("");
          setCollectionName("");
        }
      } catch (error) {
        console.error("获取 collections 失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionsAndSetDefault();
  }, [searchParams]);

  const handleCollectionChange = (id: string) => {
    const collection = collections.find((c) => c.id === id);
    if (!collection) return;

    setSelectedCollectionId(id);
    setCollectionName(collection.name || "");
    setNavFolders([]);
    setActiveSectionId(null);

    routeToFolderInCollection(collection);
  };

  const handleSectionClick = useCallback((folderId: string) => {
    const el = document.getElementById(`section-${folderId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (selectedCollectionId) {
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [selectedCollectionId]);

  return (
    <div
      className="flex min-h-screen flex-col bg-background relative"
      style={wallpaperUrl ? {
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : undefined}
    >
      {wallpaperUrl && (
        <div className="absolute inset-0 bg-background/70 dark:bg-background/75 monochrome:bg-background/80 pointer-events-none z-0" />
      )}
      <div className="relative z-10 flex flex-col min-h-screen">
        <TopBanner />
        <div className="flex flex-1">
          <SidebarProvider>
            {isLoading && !collections.length ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : selectedCollectionId || collectionSlug ? (
              <>
                <WebsiteSidebar
                  collections={collections}
                  selectedCollectionId={selectedCollectionId}
                  currentFolderId={null}
                  onCollectionChange={handleCollectionChange}
                  navFolders={navFolders}
                  activeSectionId={activeSectionId}
                  onSectionClick={handleSectionClick}
                />
                <div className="flex flex-1 flex-col">
                  <Header
                    selectedCollectionId={selectedCollectionId}
                    currentFolderId={null}
                    onBookmarkAdded={refreshData}
                  />
                  <div className="flex-1 overflow-y-auto">
                    <SinglePageView
                      collectionId={selectedCollectionId}
                      collectionName={collectionName}
                      refreshTrigger={refreshTrigger}
                      onNavFoldersChange={setNavFolders}
                      onActiveSectionChange={setActiveSectionId}
                    />
                  </div>
                  <Footer />
                </div>
                <BackToTop />
              </>
            ) : collections.length > 0 ? (
              <div className="flex flex-1 flex-col">
                <Header />
                <div className="flex-1 overflow-y-auto">
                  <CollectionGrid
                    collections={collections}
                    onSelect={(collection) => handleCollectionChange(collection.id)}
                  />
                </div>
                <Footer />
              </div>
            ) : (
              <div className="flex flex-1">
                <GetStarted />
              </div>
            )}
          </SidebarProvider>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <SearchParamsComponent />
    </Suspense>
  );
}
