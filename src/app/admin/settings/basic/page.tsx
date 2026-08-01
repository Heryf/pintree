"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminHeader } from "@/components/admin/header";

import { useSettingImages } from "@/hooks/useSettingImages";
import { updateSettingImage } from "@/actions/update-setting-image";

import { Skeleton } from "@/components/ui/skeleton";

import FooterSettingsCard from "./FooterSettingsCard";
import SocialMediaCard from "./SocialMediaCard";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useRouter } from "next/navigation";

import { revalidateData } from "@/actions/revalidate-data";



export default function BasicSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"basicInfo" |"statistics" | "footerSettings" | "socialMedia" | "appearance">("basicInfo");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    websiteName: "",
    logoUrl: "",
    faviconUrl: "",
    githubUrl: "",
    twitterUrl: "",
    discordUrl: "",
    weixinUrl: "",
    weiboUrl: "",
    bilibiliUrl: "",
    zhihuUrl: "",
    youtubeUrl: "",
    linkedinUrl: "",
    copyrightText: "",
    contactEmail: "",
    googleAnalyticsId: "",
    clarityId: "",
    defaultTheme: "light",
    bookmarkStyle: "default",
    showBookmarkUrl: "true",
    showBookmarkDescription: "true",
    wallpaperUrl: "",
  });

  // 加载设置数据
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Load settings failed:", errorData); // 调试日志
          throw new Error(errorData.error || "Load settings failed");
        }

        const data = await response.json();
        console.log("Loaded settings:", data); // 调试日志

        const sanitizedData = Object.keys(data).reduce(
          (acc, key) => ({
            ...acc,
            [key]: data[key] ?? "", // 使用空字符串替代 undefined
          }),
          {}
        );

        setSettings((prev) => ({
          ...prev,
          ...sanitizedData,
        }));
      } catch (error) {
        console.error("Load settings error:", error);
        toast.error(error instanceof Error ? error.message : "加载设置失败");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log("Submitted settings for tab:", activeTab); // 调试日志
  
      const saveSettingPromises = [];
  
      // 根据当前标签页筛选需要保存的设置项
      const settingsToSave = (() => {
        switch (activeTab) {
          case "basicInfo":
            return {
              websiteName: settings.websiteName,
            };
          case "statistics":
            return {
              googleAnalyticsId: settings.googleAnalyticsId,
              clarityId: settings.clarityId
            };
          case "footerSettings":
            return {
              copyrightText: settings.copyrightText,
              contactEmail: settings.contactEmail
            };
          case "socialMedia":
            return {
              githubUrl: settings.githubUrl,
              twitterUrl: settings.twitterUrl,
              discordUrl: settings.discordUrl,
              weixinUrl: settings.weixinUrl,
              weiboUrl: settings.weiboUrl,
              bilibiliUrl: settings.bilibiliUrl,
              zhihuUrl: settings.zhihuUrl,
              youtubeUrl: settings.youtubeUrl,
              linkedinUrl: settings.linkedinUrl
            };
          case "appearance":
            return {
              defaultTheme: settings.defaultTheme,
              bookmarkStyle: settings.bookmarkStyle,
              showBookmarkUrl: settings.showBookmarkUrl,
              showBookmarkDescription: settings.showBookmarkDescription,
              wallpaperUrl: settings.wallpaperUrl,
            };
          default:
            return {};
        }
      })();
  
      // 处理图片上传（仅针对基本信息标签页）
      if (activeTab === "basicInfo") {
        const logoInput = document.getElementById('logoUrl') as HTMLInputElement;
        const faviconInput = document.getElementById('faviconUrl') as HTMLInputElement;
  
        if (logoInput && logoInput.files && logoInput.files.length > 0) {
          const logoFile = logoInput.files[0];
          const logoFormData = new FormData();
          logoFormData.append('settingKey', 'logoUrl');
          logoFormData.append('file', logoFile);
          saveSettingPromises.push(
            updateSettingImage(logoFormData)
          );
        }
  
        if (faviconInput && faviconInput.files && faviconInput.files.length > 0) {
          const faviconFile = faviconInput.files[0];
          const faviconFormData = new FormData();
          faviconFormData.append('settingKey', 'faviconUrl');
          faviconFormData.append('file', faviconFile);
          saveSettingPromises.push(
            updateSettingImage(faviconFormData)
          );
        }
      }
  
      // 添加基本设置保存到 saveSettingPromises
      saveSettingPromises.push(
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsToSave),
        }).then(async response => {
          if (!response.ok) {
            const errorData = await response.json();
            console.error("API error response:", errorData);
            throw new Error(errorData.error || "Save failed");
          }
          return response.json();
        }).then(result => {
          console.log("Save success:", result); // 调试日志
        })
      );
  
      // 并行处理所有操作
      await Promise.all(saveSettingPromises);
  
      toast.success(`设置已保存`);

      revalidateData();
    } catch (error) {
      console.error("Save settings failed:", error);
      toast.error(error instanceof Error ? error.message : "保存设置失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#f9f9f9]">
      <AdminHeader title="基本设置" />

      <div className="mx-auto px-4 py-12 bg-[#f9f9f9]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="basicInfo">基本信息</TabsTrigger>
              <TabsTrigger value="statistics">统计代码</TabsTrigger>
              <TabsTrigger value="footerSettings">页脚</TabsTrigger>
              <TabsTrigger value="socialMedia">社交媒体</TabsTrigger>
              <TabsTrigger value="appearance">外观</TabsTrigger>
            </TabsList>

            <TabsContent value="basicInfo">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  基本信息
                </p>
                <Card className="border bg-white">
                  <CardHeader className="border-b">
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>设置网站的基本信息</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-6">
                    <div className="grid gap-2">
                      <Label htmlFor="websiteName">网站名称</Label>
                      <Input
                        id="websiteName"
                        name="websiteName"
                        value={settings.websiteName}
                        onChange={handleChange}
                        placeholder="输入您的网站名称"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>网站 Logo</Label>
                      <LogoUploader />
                    </div>

                    <div className="grid gap-2">
                      <Label>网站图标</Label>
                      <FaviconUploader />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statistics">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  统计代码
                </p>
                <Card className="border bg-white">
                  <CardHeader className="border-b">
                    <CardTitle>统计代码</CardTitle>
                    <CardDescription>设置网站的统计代码</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-6">
                    <div className="grid gap-2">
                      <Label htmlFor="googleAnalyticsId">
                        Google Analytics ID
                      </Label>
                      <Input
                        id="googleAnalyticsId"
                        name="googleAnalyticsId"
                        value={settings.googleAnalyticsId}
                        onChange={handleChange}
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="clarityId">Microsoft Clarity ID</Label>
                      <Input
                        id="clarityId"
                        name="clarityId"
                        value={settings.clarityId}
                        onChange={handleChange}
                        placeholder="XXXXXXXXXX"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="footerSettings">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  页脚设置
                </p>
                <FooterSettingsCard
                  settings={settings}
                  handleChange={handleChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="socialMedia">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  社交媒体链接
                </p>
                <SocialMediaCard
                  settings={settings}
                  handleChange={handleChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="appearance">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-normal">
                  外观与展示风格
                </p>
                <Card className="border bg-white">
                  <CardHeader className="border-b">
                    <CardTitle>外观</CardTitle>
                    <CardDescription>设置主题、书签展示风格与壁纸</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 p-6">
                    <div className="grid gap-2">
                      <Label htmlFor="defaultTheme">默认主题</Label>
                      <Select
                        value={settings.defaultTheme}
                        onValueChange={(value) =>
                          setSettings((prev) => ({ ...prev, defaultTheme: value }))
                        }
                      >
                        <SelectTrigger className="bg-slate-100">
                          <SelectValue placeholder="选择默认主题" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">浅色主题</SelectItem>
                          <SelectItem value="dark">暗色主题</SelectItem>
                          <SelectItem value="monochrome">黑白主题</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bookmarkStyle">默认书签样式</Label>
                      <Select
                        value={settings.bookmarkStyle}
                        onValueChange={(value) =>
                          setSettings((prev) => ({ ...prev, bookmarkStyle: value }))
                        }
                      >
                        <SelectTrigger className="bg-slate-100">
                          <SelectValue placeholder="选择书签样式" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">默认</SelectItem>
                          <SelectItem value="glass">毛玻璃</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showBookmarkUrl">显示书签链接</Label>
                        <p className="text-xs text-muted-foreground">是否在书签卡片中显示网址</p>
                      </div>
                      <Switch
                        id="showBookmarkUrl"
                        checked={settings.showBookmarkUrl === "true"}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, showBookmarkUrl: String(checked) }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showBookmarkDescription">显示书签说明</Label>
                        <p className="text-xs text-muted-foreground">是否在书签卡片中显示描述文本</p>
                      </div>
                      <Switch
                        id="showBookmarkDescription"
                        checked={settings.showBookmarkDescription === "true"}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, showBookmarkDescription: String(checked) }))
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="wallpaperUrl">壁纸图片</Label>
                      <WallpaperUploader
                        value={settings.wallpaperUrl}
                        onChange={(value) =>
                          setSettings((prev) => ({ ...prev, wallpaperUrl: value }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存设置"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


// 添加 Logo 上传组件
function LogoUploader() {
  const { images, isLoading, error } = useSettingImages("logoUrl");
  const [currentLogoUrl, setCurrentLogoUrl] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      // 立即展示预览
      setCurrentLogoUrl(base64);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="relative w-[260px] h-[60px] border rounded bg-white">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <Image
              src={currentLogoUrl || images[0].url}
              alt="Current Logo"
              fill
              className="object-contain p-2"
            />
          )}
        </div>
        <Input
          id="logoUrl"
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          className="max-w-[200px] bg-slate-100"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        建议尺寸：520x120px，支持 PNG、JPG 格式
      </p>
    </div>
  );
};

function FaviconUploader() {
  const { images, isLoading, error } = useSettingImages("faviconUrl");
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target?.result as string;

      // 立即展示预览
      setCurrentFaviconUrl(base64);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="relative w-[32px] h-[32px] border rounded bg-white">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="relative w-[32px] h-[32px] border rounded bg-white">
            <Image
              src={currentFaviconUrl || images[0].url}
              alt="Current Favicon"
              fill
              className="object-contain p-1"
            />
          </div>
        )}
        <Input
          id="faviconUrl"
          type="file"
          accept=".ico,.png"
          onChange={handleFileChange}
          className="max-w-[200px] bg-slate-100"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        建议尺寸：512x512px，支持 ICO、PNG 格式
      </p>
    </div>
  );
};

interface WallpaperUploaderProps {
  value: string;
  onChange: (value: string) => void;
}

function WallpaperUploader({ value, onChange }: WallpaperUploaderProps) {
  const { images, isLoading } = useSettingImages("wallpaperUrl");
  const [currentUrl, setCurrentUrl] = useState(value || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setCurrentUrl(value || "");
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('settingKey', 'wallpaperUrl');
      formData.append('file', file);

      const result = await updateSettingImage(formData);
      if (result.success && result.image?.id) {
        const imageUrl = `/api/images/${result.image.id}`;
        setCurrentUrl(imageUrl);
        onChange(imageUrl);
        toast.success("壁纸上传成功");
      }
    } catch (error) {
      console.error('Upload wallpaper failed:', error);
      toast.error(error instanceof Error ? error.message : "壁纸上传失败");
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = currentUrl || images[0]?.url || "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative w-[260px] h-[120px] border rounded bg-slate-100 overflow-hidden">
          {isLoading || uploading ? (
            <Skeleton className="w-full h-full" />
          ) : displayUrl ? (
            <Image
              src={displayUrl}
              alt="壁纸预览"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              暂无壁纸
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Input
            id="wallpaperUrl"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="max-w-[200px] bg-slate-100"
          />
          <Input
            type="text"
            value={currentUrl}
            onChange={(e) => {
              setCurrentUrl(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="或输入图片 URL"
            className="max-w-[200px] bg-slate-100"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        支持 PNG、JPG、WebP 格式，建议分辨率 1920x1080 以上
      </p>
    </div>
  );
}
