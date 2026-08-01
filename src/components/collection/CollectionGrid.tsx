"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  slug: string | null;
  totalBookmarks?: number;
  icon?: string | null;
}

interface CollectionGridProps {
  collections: Collection[];
  onSelect: (collection: Collection) => void;
}

export function CollectionGrid({ collections, onSelect }: CollectionGridProps) {
  if (!collections || collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FolderOpen className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg">暂无可访问的书签合集</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">书签合集</h1>
        <p className="text-muted-foreground">选择一个合集开始浏览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {collections.map((collection) => (
          <Card
            key={collection.id}
            onClick={() => onSelect(collection)}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-200",
              "hover:shadow-lg hover:-translate-y-1",
              "border-gray-200/80 dark:border-gray-800",
              "bg-white dark:bg-gray-900/60",
              "hover:border-emerald-300 dark:hover:border-emerald-700/50",
              "monochrome:bg-white/5 monochrome:border-white/10 monochrome:hover:bg-white/10 monochrome:hover:border-white/20"
            )}
          >
            <CardContent className="p-5">
              <div className="flex flex-col h-full min-h-[120px]">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {collection.icon ? (
                      <img
                        src={collection.icon}
                        alt={collection.name}
                        className="w-11 h-11 rounded-xl object-cover transition-transform duration-200 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 monochrome:bg-white/10">
                        <FolderOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400 monochrome:text-white/80" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate text-base transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400 monochrome:group-hover:text-white">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full font-medium",
                      collection.isPublic
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 monochrome:bg-white/10 monochrome:text-white/70"
                        : "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 monochrome:bg-white/10 monochrome:text-white/70"
                    )}
                  >
                    {collection.isPublic ? "公开" : "私有"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Bookmark className="h-3.5 w-3.5" />
                    {(collection as any)._count?.bookmarks || collection.totalBookmarks || 0} 个书签
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
