"use client";

import { useEffect } from "react";

/**
 * 页面级错误边界：捕获页面（page.tsx 等）抛出的异常。
 * 显示错误码与真实错误信息，便于线上定位（部署后把屏幕上的信息发回即可定位根因）。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 同时输出到浏览器控制台，便于抓取堆栈
  useEffect(() => {
    console.error("[页面错误]", error);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-background p-6 text-center"
      role="alert"
    >
      <h1 className="text-2xl font-bold text-foreground">页面加载出错</h1>
      <p className="text-sm text-muted-foreground">
        服务器端发生异常
        {error?.digest ? `（错误码 ${error.digest}）` : ""}，请稍后重试。
      </p>
      {error?.message && (
        <pre className="mt-2 max-w-xl overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-left text-xs text-muted-foreground">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-2 rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        重试
      </button>
    </div>
  );
}
