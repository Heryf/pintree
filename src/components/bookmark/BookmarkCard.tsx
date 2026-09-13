"use client";

import Image from 'next/image'
import { useState } from 'react'
import { Folder, ExternalLink } from 'lucide-react'
import { cn } from "@/lib/utils"

interface BookmarkCardProps {
  title: string
  url: string
  icon?: string
  description?: string
  isFeatured?: boolean
  collection?: {
    name: string
    slug: string
  }
  folder?: {
    name: string
  }
  // 以下为可选增强属性（SinglePageView 使用；主站 BookmarkGrid 不传，保持原行为）
  tags?: { name: string }[]
  compact?: boolean
  glass?: boolean
  showUrl?: boolean
  showDescription?: boolean
}

export function BookmarkCard({
  title,
  url,
  icon,
  description,
  isFeatured = false,
  collection,
  folder,
  tags,
  compact = false,
  glass = false,
  showUrl = true,
  showDescription = true,
}: BookmarkCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const defaultIcon = '/assets/default-icon.svg'

  // 地址栏只显示域名（hostname），不附带任何路径
  // 例：https://szfilehelper.weixin.qq.com/path?a=1 → szfilehelper.weixin.qq.com
  // 兼容数据库里 url 字段未带协议的情况（如 "weixin.qq.com/path"）
  const cleanUrl = (() => {
    try {
      // URL 构造器要求完整协议，缺协议时补 https:// 再取 hostname
      const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`
      return new URL(withProtocol).hostname
    } catch {
      // 极端非法 URL：取第一个 / 之前的部分作为兜底
      const cleaned = url.replace(/^https?:\/\//i, '')
      const slashIdx = cleaned.indexOf('/')
      return slashIdx > 0 ? cleaned.substring(0, slashIdx) : cleaned
    }
  })()

  return (
    <div
      onClick={() => window.open(url, '_blank')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        `cursor-pointer flex items-center transition-all duration-300 ease-out p-4
        bg-card/60 border border-border/60
        rounded-xl hover:bg-card hover:border-border
        hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5`,
        compact && 'p-2.5 rounded-lg hover:-translate-y-0',
        glass && 'bg-white/50 backdrop-blur-sm dark:bg-white/5',
        isFeatured ? 'border-2 border-primary/60 ring-1 ring-primary/20' : ''
      )}
    >
      <div className={cn("relative flex-shrink-0", compact ? "w-7 h-7 mr-2.5" : "w-9 h-9 mr-3.5")}>
        <Image
          src={imageError ? defaultIcon : (icon || defaultIcon)}
          alt={title}
          fill
          sizes={compact ? "28px" : "36px"}
          className="rounded-lg object-cover transition-transform duration-300"
          style={{
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          }}
          onError={() => setImageError(true)}
          loading="lazy"
          decoding="async"
        />
        {/* 图标悬停时显示外部链接指示 */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <ExternalLink className={cn("text-white", compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5")} />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h2 className={cn("font-semibold mb-0.5 truncate text-foreground transition-colors duration-300", compact ? "text-[13px]" : "text-sm")}>
            {title}
          </h2>
          {isFeatured && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary shrink-0">
              精选
            </span>
          )}
        </div>

        {showDescription && description && (
          <p className="text-xs text-muted-foreground/80 mb-1 line-clamp-1 leading-relaxed">
            {description}
          </p>
        )}

        {showUrl && (
          <p className="text-xs text-muted-foreground/60 truncate leading-relaxed">
            {cleanUrl}
          </p>
        )}

        {tags && tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.name}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground/60">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {(collection || folder) && (
          <div className="mt-1.5 text-[11px] text-muted-foreground/50 flex items-center">
            {collection && (
              <span className="inline-flex items-center">
                {collection.name}
              </span>
            )}
            {folder && (
              <>
                <span className="mx-1 opacity-50">/</span>
                <span className="inline-flex items-center">
                  <Folder className="w-3 h-3 mr-0.5 opacity-60" />
                  {folder.name}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
