'use server'

import { prisma } from "@/lib/prisma";

/**
 * 模块级缓存：同一 settingKey 的图片 ID 列表在 TTL 内只查一次 DB。
 * 上传新图后由 update-setting-image 调用 invalidateSettingImages(key) 清除缓存。
 */
const CACHE_TTL = 60_000; // 60 秒
const imageCache = new Map<string, { ids: string[]; expiresAt: number }>();
const inFlight = new Map<string, Promise<string[]>>();

export function invalidateSettingImages(settingKey: string) {
  imageCache.delete(settingKey);
}

export async function getSettingImages(settingKey: string) {
  try {
    // 命中缓存
    const cached = imageCache.get(settingKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { success: true, imageIds: cached.ids };
    }

    // 并发去重：同一 key 的请求只查一次 DB
    const pending = inFlight.get(settingKey);
    if (pending) {
      return { success: true, imageIds: await pending };
    }

    const promise = (async () => {
      console.log('[getSettingImages] querying setting:', settingKey);
      const setting = await prisma.siteSetting.findUnique({
        where: { key: settingKey },
        include: {
          images: {
            select: {
              imageId: true
            },
          }
        }
      });
      console.log('[getSettingImages] query result:', setting ? `found (id=${setting.id}, images=${setting.images?.length || 0})` : 'not found');

      if (!setting) {
        throw new Error('Could not find the corresponding setting item');
      }

      const imageIds = setting.images.map(img => img.imageId);
      console.log('[getSettingImages] imageIds:', imageIds);
      imageCache.set(settingKey, { ids: imageIds, expiresAt: Date.now() + CACHE_TTL });
      return imageIds;
    })();

    inFlight.set(settingKey, promise);
    try {
      const imageIds = await promise;
      return { success: true, imageIds };
    } finally {
      inFlight.delete(settingKey);
    }
  } catch (error) {
    // 输出完整错误信息便于排查（Prisma 错误对象常为空 {}）
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : '',
      name: error?.constructor?.name || 'Unknown',
      keys: Object.keys(error || {}),
      stringified: JSON.stringify(error, Object.getOwnPropertyNames(error || {}))
    };
    console.error('Failed to get setting images:', errorInfo);
    return {
      success: false,
      error: `${errorInfo.name}: ${errorInfo.message}`
    };
  }
}
