"use client";

/**
 * 页面级错误边界：捕获页面（page.tsx 等）抛出的异常，
 * 提供友好提示与重试按钮，避免整站显示裸错误页。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-background p-6 text-center"
      role="alert"
    >
      <h1 className="text-2xl font-bold text-foreground">页面加载出错</h1>
      <p className="text-sm text-muted-foreground">
        服务器端发生异常{error?.digest ? `（错误码 ${error.digest}）` : ""}，请稍后重试。
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        重试
      </button>
    </div>
  );
}
