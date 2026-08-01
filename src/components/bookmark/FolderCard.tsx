"use client";

import { Folder } from "lucide-react";

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
      className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 hover:from-emerald-100 hover:to-emerald-200/50 dark:hover:from-emerald-900/40 dark:hover:to-emerald-800/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full aspect-square"
    >
      {icon ? (
        <img src={icon} alt={name} className="w-14 h-14 mb-4 object-contain" />
      ) : (
        <div className="w-14 h-14 mb-4 rounded-2xl bg-emerald-500/20 dark:bg-emerald-500/10 flex items-center justify-center">
          <Folder className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
      )}
      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100 truncate w-full text-center">
        {name}
      </span>
      {typeof bookmarkCount === "number" && (
        <span className="mt-2 text-xs text-emerald-600/70 dark:text-emerald-400/70">
          {bookmarkCount} 个书签
        </span>
      )}
    </button>
  );
}
