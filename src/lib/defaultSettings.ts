export interface SettingItem {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  group: 'basic' | 'seo' | 'feature' | 'analytics';
  description?: string;
}

export const defaultSettings: SettingItem[] = [
  // 基础设置
  {
    key: "websiteName",
    value: "Pizza",
    type: "string",
    group: "basic",
    description: "网站名称"
  },
  {
    key: "logoUrl",
    value: "/logo.png",
    type: "string",
    group: "basic",
    description: "网站Logo (建议尺寸: 520x120px)"
  },
  {
    key: "faviconUrl",
    value: "/favicon.ico",
    type: "string",
    group: "basic",
    description: "网站图标"
  },
  {
    key: "copyrightText",
    value: "© 2026 Pizza. 保留所有权利。",
    type: "string",
    group: "basic",
    description: "版权信息"
  },
  {
    key: "contactEmail",
    value: "",
    type: "string",
    group: "basic",
    description: "联系邮箱"
  },


  // 社交媒体链接
  {
    key: "githubUrl",
    value: "https://github.com/Pintree-io/pintree",
    type: "string",
    group: "basic",
    description: "GitHub链接"
  },
  {
    key: "discordUrl",
    value: "https://discord.gg/gJTrkHFg",
    type: "string",
    group: "basic",
    description: "Discord链接"
  },
  {
    key: "twitterUrl",
    value: "https://x.com/pintree_io",
    type: "string",
    group: "basic",
    description: "Twitter链接"
  },
  {
    key: "youtubeUrl",
    value: "https://www.youtube.com/channel/UCMvuKFthQyn4eKgJwklOMrw",
    type: "string",
    group: "basic",
    description: "YouTube频道链接"
  },
  {
    key: "linkedinUrl",
    value: "https://linkedin.com/company/pintree",
    type: "string",
    group: "basic",
    description: "LinkedIn链接"
  },
  {
    key: "weixinUrl",
    value: "https://weixin.qq.com/pintree",
    type: "string",
    group: "basic",
    description: "微信公众号链接"
  },
  {
    key: "weiboUrl",
    value: "https://weibo.com/pintree",
    type: "string",
    group: "basic",
    description: "微博主页链接"
  },
  {
    key: "bilibiliUrl",
    value: "https://dribbble.com/Pintree",
    type: "string",
    group: "basic",
    description: "B站主页链接"
  },
  {
    key: "zhihuUrl",
    value: "https://zhihu.com/people/pintree",
    type: "string",
    group: "basic",
    description: "知乎主页链接"
  },

  // SEO设置
  {
    key: "siteTitle",
    value: "Pizza - 智能书签管理与分享平台",
    type: "string",
    group: "seo",
    description: "网站标题"
  },
  {
    key: "description",
    value: "使用 Pizza 高效地整理、管理和分享你的书签。支持自定义合集、标签分类、暗色模式，让网络资源井井有条。",
    type: "string",
    group: "seo",
    description: "网站描述"
  },
  {
    key: "keywords",
    value: "书签管理, 书签整理, 书签合集, 书签分享, 效率工具, 网站导航, 链接管理, 书签标签, 在线书签",
    type: "string",
    group: "seo",
    description: "关键词(用逗号分隔)"
  },
  {
    key: "siteUrl",
    value: "https://zbbsnm.icu",
    type: "string",
    group: "seo",
    description: "网站URL"
  },
  {
    key: "ogImage",
    value: "https://zbbsnm.icu/og-image.png",
    type: "string",
    group: "seo",
    description: "社交分享图片"
  },
  {
    key: "robots",
    value: "index, follow",
    type: "string",
    group: "seo",
    description: "搜索引擎爬虫设置"
  },
  {
    key: "author",
    value: "Pintree Team",
    type: "string",
    group: "seo",
    description: "作者信息"
  },

  // 统计分析
  {
    key: "googleAnalyticsId",
    value: "",
    type: "string",
    group: "analytics",
    description: "Google Analytics ID"
  },
  {
    key: "clarityId",
    value: "",
    type: "string",
    group: "analytics",
    description: "Microsoft Clarity ID"
  },
  {
    key: "umamiId",
    value: "",
    type: "string",
    group: "analytics",
    description: "Umami Analytics ID"
  },
  {
    key: "plausibleId",
    value: "",
    type: "string",
    group: "analytics",
    description: "Plausible Analytics ID"
  },
  {
    key: "gtagId",
    value: "",
    type: "string",
    group: "analytics",
    description: "Google Tag ID"
  },

  // 功能设置
  {
    key: "enableSearch",
    value: "true",
    type: "boolean",
    group: "feature",
    description: "启用搜索功能"
  },
  {
    key: "enableBackToTop",
    value: "true",
    type: "boolean",
    group: "feature",
    description: "启用返回顶部按钮"
  },
  {
    key: "enableSidebarAds",
    value: "false",
    type: "boolean",
    group: "feature",
    description: "启用侧边栏广告"
  },
  {
    key: "sidebarAdsContent",
    value: "",
    type: "string",
    group: "feature",
    description: "侧边栏广告内容"
  },
  {
    key: "enableCtaButton",
    value: "true",
    type: "boolean",
    group: "feature",
    description: "启用CTA按钮"
  },
  {
    key: "ctaButtonText",
    value: "获取你的 Pizza",
    type: "string",
    group: "feature",
    description: "CTA按钮文字"
  },
  {
    key: "ctaButtonLink",
    value: "https://zbbsnm.icu",
    type: "string",
    group: "feature",
    description: "CTA按钮链接"
  },
  {
    key: "ctaButtonStyle",
    value: "primary",
    type: "string",
    group: "feature",
    description: "CTA按钮样式"
  },
  {
    key: "enableHeroBanner",
    value: "true",
    type: "boolean",
    group: "feature",
    description: "启用Hero Banner"
  },
  {
    key: "heroBannerTitle",
    value: "轻松整理与分享你的书签",
    type: "string",
    group: "feature",
    description: "Hero Banner标题"
  },
  {
    key: "heroBannerDescription",
    value: "使用 Pizza 创建、管理并分享个性化的书签合集",
    type: "string",
    group: "feature",
    description: "Hero Banner描述"
  },
  {
    key: "heroBannerImage",
    value: "",
    type: "string",
    group: "feature",
    description: "Hero Banner图片"
  },
  {
    key: "heroBannerButtonText",
    value: "开始使用",
    type: "string",
    group: "feature",
    description: "Hero Banner按钮文字"
  },
  {
    key: "heroBannerButtonLink",
    value: "https://zbbsnm.icu",
    type: "string",
    group: "feature",
    description: "Hero Banner按钮链接"
  },
  {
    key: "heroBannerSponsorText",
    value: "赞助商",
    type: "string",
    group: "feature",
    description: "Hero Banner赞助商文本"
  },
  {
    key: "enableBanner",
    value: "false",
    type: "boolean",
    group: "feature",
    description: "启用普通Banner"
  },
  {
    key: "bannerContent",
    value: "",
    type: "string",
    group: "feature",
    description: "Banner内容"
  },
  {
    key: "bannerStyle",
    value: "info",
    type: "string",
    group: "feature",
    description: "Banner样式"
  },
  {
    key: "enableCarousel",
    value: "false",
    type: "boolean",
    group: "feature",
    description: "启用轮播"
  },
  // {
  //   key: "carouselItems",
  //   value: "[]",
  //   type: "json",
  //   group: "feature",
  //   description: "轮播项目"
  // },
  {
    key: "carouselImageStates",
    value: "[true,true,true,true,true,true]",
    type: "json",
    group: "feature",
    description: "轮播图片显示状态"
  },
  {
    key: "carouselImages",
    value: "",
    type: "string",
    group: "feature",
    description: "轮播图片"
  },
  {
    key: "carouselImageHyperlinks",
    value: "https://zbbsnm.icu|https://zbbsnm.icu|https://zbbsnm.icu|https://zbbsnm.icu|https://zbbsnm.icu|https://zbbsnm.icu",
    type: "json",
    group: "feature",
    description: "轮播图片跳转链接"
  },
  {
    key: "enableTopBanner",
    value: "false",
    type: "boolean",
    group: "feature",
    description: "启用顶部通知Banner"
  },
  {
    key: "topBannerTitle",
    value: "Pizza 上线啦",
    type: "string",
    group: "feature",
    description: "Banner标题"
  },
  {
    key: "topBannerDescription",
    value: "一款帮助你收集、整理和分享常用网站的书签管理工具。",
    type: "string",
    group: "feature",
    description: "Banner描述"
  },
  {
    key: "topBannerButtonText",
    value: "了解更多",
    type: "string",
    group: "feature",
    description: "Banner按钮文本"
  },
  {
    key: "topBannerButtonLink",
    value: "https://zbbsnm.icu",
    type: "string",
    group: "feature",
    description: "Banner按钮链接"
  },
  {
    key: "sidebarAdsTitle",
    value: "整理你的书签",
    type: "string",
    group: "feature",
    description: "侧边栏广告标题"
  },
  {
    key: "sidebarAdsDescription",
    value: "Pizza 帮你以优雅的方式收集、整理和分享常用网站",
    type: "string",
    group: "feature",
    description: "侧边栏广告描述"
  },
  {
    key: "sidebarAdsImageUrl",
    value: "/assets/spaces-preview.png",
    type: "string",
    group: "feature",
    description: "侧边栏广告图片"
  },
  {
    key: "sidebarAdsButtonText",
    value: "开始使用",
    type: "string",
    group: "feature",
    description: "侧边栏广告按钮文本"
  },
  {
    key: "sidebarAdsButtonUrl",
    value: "https://zbbsnm.icu",
    type: "string",
    group: "feature",
    description: "侧边栏广告按钮链接"
  }
];

export const defaultImages = [
  {
    name: "logo.png",
    image: "/default-images/logo.png",
    type: "default",
    settingKeys: [
      {
        key: "logoUrl",
      },
    ],
  },
  {
    name: "favicon.ico",
    image: "/default-images/favicon.ico",
    type: "default",
    settingKeys: [
      {
        key: "faviconUrl",
      },
    ],
  },
  {
    name: "og-image.png",
    image: "/default-images/og-image.png",
    type: "default",
    settingKeys: [
      {
        key: "ogImage",
      },
    ],
  },
  {
    name: "spaces-preview.png",
    image: "/default-images/spaces-preview.png",
    type: "default",
    settingKeys: [
      {
        key: "sidebarAdsImageUrl",
      },
    ],
  },
  {
    name: "carousel-images",
    images: [
      "/default-images/carousel-1.jpg",
      "/default-images/carousel-2.jpg", 
      "/default-images/carousel-3.jpg",
      "/default-images/carousel-4.jpg",
      "/default-images/carousel-5.jpg",
      "/default-images/carousel-6.jpg"
    ],
    type: "default",
    settingKeys: [
      {
        key: "carouselImages",
      },
    ],
  }
];
