"use client";

import Image from "next/image";
import { useState } from "react";
import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkCardProps {
  title: string;
  url: string;
  icon?: string;
  description?: string;
  isFeatured?: boolean;
  tags?: { name: string }[];
  compact?: boolean;
  collection?: {
    name: string;
    slug: string;
  };
  folder?: {
    name: string;
  };
  glass?: boolean;
  showUrl?: boolean;
  showDescription?: boolean;
}

export function BookmarkCard({
  title,
  url,
  icon,
  description,
  isFeatured = false,
  tags,
  compact = false,
  collection,
  folder,
  glass = false,
  showUrl = true,
  showDescription = true,
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false);
  const defaultIcon = "/assets/default-icon.svg";

  const cleanUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div
      onClick={() => window.open(url, "_blank")}
      className={cn(
        "group cursor-pointer flex items-center transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        compact ? "p-2.5 rounded-lg" : "p-3.5 rounded-xl",
        // 默认样式
        !glass &&
          cn(
            "bg-white dark:bg-gray-900/60",
            "border border-gray-200/80 dark:border-gray-800",
            "hover:border-emerald-300 dark:hover:border-emerald-700/50",
            "hover:bg-emerald-50/30 dark:hover:bg-gray-800/40",
            "monochrome:bg-white/5 monochrome:border-white/10 monochrome:hover:bg-white/10 monochrome:hover:border-white/20"
          ),
        // 毛玻璃样式
        glass &&
          cn(
            "bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-md",
            "hover:bg-white/20 dark:hover:bg-white/10 shadow-sm",
            "hover:border-white/30",
            "monochrome:bg-white/5 monochrome:border-white/10 monochrome:hover:bg-white/10 monochrome:hover:border-white/20"
          ),
        isFeatured && "ring-2 ring-blue-400/50 dark:ring-blue-500/30"
      )}
    >
      <div
        className={cn(
          "relative flex-shrink-0",
          compact ? "w-5 h-5 mr-2.5" : "w-8 h-8 mr-3"
        )}
      >
        <Image
          src={imageError ? defaultIcon : icon || defaultIcon}
          alt={title}
          fill
          className="rounded-full object-cover transition-transform duration-200 group-hover:scale-110"
          onError={() => setImageError(true)}
          priority={isFeatured}
        />
      </div>

      <div className="flex flex-col overflow-hidden min-w-0 flex-1">
        <h2
          className={cn(
            "font-medium truncate transition-colors",
            compact ? "text-xs" : "text-sm",
            "text-gray-700 dark:text-gray-300",
            "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
            "monochrome:text-white/85 monochrome:group-hover:text-white",
            glass && "text-foreground/90 dark:text-white/90"
          )}
        >
          {title}
        </h2>

        {!compact && showDescription && description && (
          <p
            className={cn(
              "text-xs mb-0.5 line-clamp-1",
              "text-gray-400 dark:text-gray-500",
              "monochrome:text-white/40",
              glass && "text-foreground/50 dark:text-white/50"
            )}
          >
            {description}
          </p>
        )}

        {showUrl && (
          <p
            className={cn(
              "text-xs truncate",
              "text-gray-400 dark:text-gray-600",
              "monochrome:text-white/40",
              glass && "text-foreground/50 dark:text-white/50"
            )}
          >
            {cleanUrl}
          </p>
        )}

        {!compact && tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={cn(
                  "inline-block px-1.5 py-0.5 text-[10px] rounded",
                  "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400/80",
                  "monochrome:bg-white/10 monochrome:text-white/60",
                  glass &&
                    "bg-white/20 text-foreground/80 dark:text-white/80 monochrome:bg-white/15"
                )}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {!compact && (collection || folder) && (
          <div
            className={cn(
              "mt-1 text-xs flex items-center",
              "text-gray-400 dark:text-gray-600",
              "monochrome:text-white/40",
              glass && "text-foreground/50 dark:text-white/50"
            )}
          >
            {collection && (
              <span className="inline-flex items-center">{collection.name}</span>
            )}
            {folder && (
              <>
                <span className="mx-1">/</span>
                <span className="inline-flex items-center">
                  <Folder className="w-3 h-3 mr-1 text-emerald-500 monochrome:text-white/60" />
                  {folder.name}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
