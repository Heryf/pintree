"use client";

import { useEffect } from "react";

/**
 * 全局错误边界：捕获根布局（layout.tsx）抛出的异常。
 * Next.js 要求根布局的错误只能由 global-error.tsx 捕获，
 * 没有该文件时任何根布局异常都会显示裸的 "Application error" 页面。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[全局错误]", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            background: "#fafafa",
            color: "#1f2937",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
            页面出错了
          </h1>
          <p style={{ fontSize: "15px", opacity: 0.75, margin: 0 }}>
            服务器端发生异常（{error?.digest ? `错误码 ${error.digest}` : "请稍后重试"}）。
          </p>
          {error?.message && (
            <pre
              style={{
                maxWidth: "36rem",
                overflow: "auto",
                textAlign: "left",
                fontSize: "12px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "12px",
                color: "#6b7280",
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "8px",
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}

