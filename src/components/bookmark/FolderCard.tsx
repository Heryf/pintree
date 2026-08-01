"use client";

import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  name: string;
  icon?: string;
  onClick: () => void;
  bookmarkCount?: number;
}

export function FolderCard({ name, icon, onClick, bookmarkCount }: FolderCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full aspect-square",
        // 亮色：绿色系
        "border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50",
        // 暗色：绿色系
        "dark:border-emerald-900/30 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:hover:from-emerald-900/40 dark:hover:to-emerald-800/30",
        // 黑白主题：使用中性色，避免绿色
        "monochrome:border-white/10 monochrome:from-white/10 monochrome:to-white/5 monochrome:hover:from-white/15 monochrome:hover:to-white/10"
      )}
    >
      {icon ? (
        <img src={icon} alt={name} className="w-14 h-14 mb-4 object-contain" />
      ) : (
        <div className={cn(
          "w-14 h-14 mb-4 rounded-2xl flex items-center justify-center",
          "bg-emerald-500/20 dark:bg-emerald-500/10",
          "monochrome:bg-white/10"
        )}>
          <Folder className={cn(
            "w-8 h-8 text-emerald-600 dark:text-emerald-400",
            "monochrome:text-white/90"
          )} />
        </div>
      )}
      <span className={cn(
        "text-sm font-medium truncate w-full text-center",
        "text-emerald-900 dark:text-emerald-100",
        "monochrome:text-white/90"
      )}>
        {name}
      </span>
      {typeof bookmarkCount === "number" && (
        <span className={cn(
          "mt-2 text-xs",
          "text-emerald-600/70 dark:text-emerald-400/70",
          "monochrome:text-white/50"
        )}>
          {bookmarkCount} 个书签
        </span>
      )}
    </button>
  );
}
