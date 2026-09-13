import { useState, useEffect, useCallback } from 'react';
import { getSettingImages } from '@/actions/get-setting-image';

type Image = {
  id: string;
  url: string;
}

export const useSettingImages = (settingKey: string) => {
  // const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagesData, setImagesData] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 每次成功拉取后更新，作为 Image 组件 key 的一部分，强制浏览器在上传后重新发请求
  // 解决 image.id 稳定（upsert 复用）→ URL 不变 → 浏览器 HTTP 缓存不失效的问题
  const [fetchTime, setFetchTime] = useState(0);

  const fetchSettingImages = useCallback(async () => {
    try {
      const result = await getSettingImages(settingKey);
      if (result.success) {
        // 用稳定 URL（不带时间戳），让 /api/images/[id] 的 ETag + Cache-Control 走 304
        // 上传新图后 Image.id 不变（upsert 复用同一行），但 ETag 基于 updatedAt 会变 → 自动失效
        const images = result.imageIds?.map((id: string) => ({ id, url: `/api/images/${id}` }));
        setImagesData(images || []);
        setError(null);
        setFetchTime(Date.now());
      } else {
        setImagesData([]);
        setError(result.error || 'Get setting images failed');
      }
    } catch (err) {
      setImagesData([]);
      setError(err instanceof Error ? err.message : 'Get setting images failed');
    } finally {
      setIsLoading(false);
    }
  }, [settingKey]);

  useEffect(() => {
    setIsLoading(true);
    fetchSettingImages();
  }, [fetchSettingImages]);

  // 暴露 reload：上传新图后调用，强制重新拉取最新 image id 列表
  // 注意：图片 id 在 upsert 模式下保持稳定，新内容的 ETag 会变，浏览器自然拿到新图
  const reload = useCallback(() => {
    setIsLoading(true);
    fetchSettingImages();
  }, [fetchSettingImages]);

  return {
    images: imagesData,
    isLoading,
    error,
    reload,
    fetchTime
  };
};
