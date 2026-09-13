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

  const fetchSettingImages = useCallback(async () => {
    try {
      const result = await getSettingImages(settingKey);
      if (result.success) {
        // 每次拉取加版本参数，避免浏览器/Next.js Image 缓存导致上传后仍显示旧图
        const version = Date.now();
        const images = result.imageIds?.map((id: string) => ({
          id,
          url: `/api/images/${id}?v=${version}`
        }));
        setImagesData(images || []);
        setError(null);
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

  // 暴露 reload：上传新图后调用，强制重新拉取，预览图立即更新
  const reload = useCallback(() => {
    setIsLoading(true);
    fetchSettingImages();
  }, [fetchSettingImages]);

  return {
    images: imagesData,
    isLoading,
    error,
    reload
  };
};
