import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

/**
 * SSRF 防护：仅允许 http/https，并拦截内网/保留地址，
 * 防止利用该接口探测内部网络（如云元数据服务 169.254.169.254）。
 */
function isBlockedUrl(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;

  // IPv4 字面量检查
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = parseInt(ipv4[1], 10);
    const b = parseInt(ipv4[2], 10);
    if (a === 10) return true;                    // 10.0.0.0/8
    if (a === 127) return true;                   // 127.0.0.0/8
    if (a === 0) return true;                     // 0.0.0.0/8
    if (a === 169 && b === 254) return true;      // 169.254.0.0/16 (含云元数据)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;      // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a >= 224) return true;                    // 组播/保留
  }

  // IPv6 环回 / 本地链路 / ULA（简化判断）
  if (hostname === "::1" || hostname.startsWith("fe80:") || hostname.startsWith("fc") || hostname.startsWith("fd")) {
    return true;
  }

  return false;
}

async function checkUrl(url: string) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function getIconUrl(domain: string, $?: CheerioAPI): Promise<string> {
  // 1. 如果提供了 CheerioAPI，先尝试从 HTML 中获取图标
  if ($) {
    // 查找网页中的图标链接
    const iconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
      'meta[property="og:image"]'
    ];

    for (const selector of iconSelectors) {
      const iconElement = $(selector);
      const iconUrl = iconElement.attr('href') || iconElement.attr('content');
      if (iconUrl) {
        // 处理相对路径
        try {
          const absoluteUrl = new URL(iconUrl, `https://${domain}`).href;
          if (await checkUrl(absoluteUrl)) {
            return absoluteUrl;
          }
        } catch (error) {
          console.error('Error processing icon URL:', error);
        }
      }
    }
  }

  // 2. 尝试网站根目录的 favicon.ico
  const rootFaviconUrl = `https://${domain}/favicon.ico`;
  if (await checkUrl(rootFaviconUrl)) {
    return rootFaviconUrl;
  }

  // 3. 尝试 Google Favicon 服务
  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  if (await checkUrl(googleFaviconUrl)) {
    return googleFaviconUrl;
  }

  // 4. 尝试 Clearbit
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;
  if (await checkUrl(clearbitUrl)) {
    return clearbitUrl;
  }

  // 5. 如果都失败了，返回 Google 的默认图标（这样至少能显示一个图标）
  return googleFaviconUrl;
}

async function getAllIcons(domain: string, $?: CheerioAPI): Promise<string[]> {
  const icons: string[] = [];

  // 1. 从 HTML 获取图标
  if ($) {
    const iconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
      'meta[property="og:image"]'
    ];

    for (const selector of iconSelectors) {
      const iconElement = $(selector);
      const iconUrl = iconElement.attr('href') || iconElement.attr('content');
      if (iconUrl) {
        try {
          const absoluteUrl = new URL(iconUrl, `https://${domain}`).href;
          if (await checkUrl(absoluteUrl)) {
            icons.push(absoluteUrl);
          }
        } catch (error) {
          console.error('Error processing icon URL:', error);
        }
      }
    }
  }

  // 2. 添加其他来源的图标
  const alternativeIcons = [
    `https://${domain}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://logo.clearbit.com/${domain}`
  ];

  for (const iconUrl of alternativeIcons) {
    if (await checkUrl(iconUrl)) {
      icons.push(iconUrl);
    }
  }

  return [...new Set(icons)]; // 去重
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Please enter a URL" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    if (isBlockedUrl(parsedUrl)) {
      return NextResponse.json({ error: "URL is not allowed" }, { status: 400 });
    }

    const domain = parsedUrl.hostname;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/html')) {
        return NextResponse.json({
          title: url,
          description: "",
          icons: await getAllIcons(domain),
          icon: await getIconUrl(domain)
        });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // 获取标题
      let title = $("title").text() || 
                 $('meta[property="og:title"]').attr("content") || 
                 $('meta[name="twitter:title"]').attr("content") || 
                 domain;

      // 获取描述
      let description = $('meta[name="description"]').attr("content") || 
                       $('meta[property="og:description"]').attr("content") || 
                       $('meta[name="twitter:description"]').attr("content") || 
                       "";

      // 修改返回数据，包含所有图标
      return NextResponse.json({
        title: title.trim(),
        description: description.trim(),
        icons: await getAllIcons(domain, $),
        icon: await getIconUrl(domain, $) // 保持默认图标向后兼容
      });

    } catch (error) {
      console.error("Fetch error:", error);
      // 如果获取失败，至少返回域名作为标题
      return NextResponse.json({
        title: domain,
        description: "",
        icons: await getAllIcons(domain),
        icon: await getIconUrl(domain)
      });
    }

  } catch (error) {
    console.error("Error in URL info API:", error);
    return NextResponse.json(
      { error: "Failed to get URL information, please check if the URL is correct" },
      { status: 500 }
    );
  }
} 