
import { prisma } from "@/lib/prisma";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Analytics } from "@/components/analytics/Analytics";
import { Toaster as SonnerToaster } from "sonner";
import { getSiteSettings } from "@/lib/settings";
import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'

const SETTINGS_KEYS = ["websiteName", "description", "keywords", "siteUrl", "faviconUrl", "ogImage"];

export const generateMetadata = async (): Promise<Metadata> => {
  try {
    const { settings, map } = await getSiteSettings(SETTINGS_KEYS);

    // const faviconBase =
    //   settingsMap.faviconUrl?.replace("favicon.ico", "") || "/favicon/";
    const siteUrl =
      map.siteUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const imageBaseUrl = '/api/images/'

    const faviconSetting = settings.find((setting: any) => setting.key === 'faviconUrl');
    let faviconUrl = '/favicon/favicon.ico';
    if (faviconSetting?.id) {
      const faviconImage = await prisma.settingImage.findFirst({
        where: { settingId: faviconSetting.id },
        select: { imageId: true }
      });
      faviconUrl = faviconImage ? `${imageBaseUrl}${faviconImage.imageId}` : faviconUrl;
    }

    return {
      title: map.websiteName,
      description: map.description,
      keywords: map.keywords,
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: siteUrl,
      },
      icons: {
        icon: [
          {
            url: faviconUrl,
            sizes: "32x32",
            type: "image/x-icon",
          },
        ],
      },
    };
  } catch (error) {
    console.error("获取设置失败:", error);
    return {
      title: "Pintree - Smart Bookmark Management & Organization Platform",
      description:
        "Organize, manage and share your bookmarks efficiently with Pintree. Features AI-powered organization, custom collections, and seamless bookmark sharing for enhanced productivity.",
      keywords:
        "bookmark manager, bookmark organizer, bookmark collections, bookmark sharing, productivity tools, website organization, link management, bookmark tags, AI bookmarking, digital organization",
      icons: {
        icon: "/favicon/favicon.ico",
      },
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let analyticsMap: any = {
    googleAnalyticsId: "",
    clarityId: "",
  };

  if (process.env.NODE_ENV === "production") {
    // 获取统计代码ID（getSiteSettings 内部已做请求级缓存去重）
    const { map } = await getSiteSettings(["googleAnalyticsId", "clarityId"]);
    analyticsMap = {
      googleAnalyticsId: map.googleAnalyticsId || "",
      clarityId: map.clarityId || "",
    };
  }

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 预加载主题，避免暗色模式闪烁（FOUC） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pintree-theme");if(t==="dark"||t==="light"){document.documentElement.classList.toggle("dark",t==="dark");}else if(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark");}}catch(e){}})();`,
          }}
        />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
      <Analytics clarityId={analyticsMap.clarityId} />
      {!!analyticsMap.googleAnalyticsId && <GoogleAnalytics gaId={analyticsMap.googleAnalyticsId} />}
    </html>
  );
}
