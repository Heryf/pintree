'use server'

import { prisma } from "@/lib/prisma";
import { invalidateSettingImages } from "@/actions/get-setting-image";


// 上传图片的函数
async function uploadImage(file: File, existingImageId?: string) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 若有 existingImageId：upsert 复用同一行（保持 id 稳定，关联表无需动）
      // 若无：create 新行，返回新 id（由调用方建关联）
      if (existingImageId) {
        const image = await prisma.image.upsert({
          where: { id: existingImageId },
          update: {
            name: file.name,
            data: buffer,
            mimeType: file.type,
            size: file.size,
            description: `Setting image: ${file.name}`
          },
          create: {
            id: existingImageId,
            name: file.name,
            data: buffer,
            mimeType: file.type,
            type: 'setting',
            size: file.size,
            description: `Setting image: ${file.name}`
          },
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true
          }
        });
        return image;
      }

      // 首次上传：创建新 Image 记录
      const image = await prisma.image.create({
        data: {
          name: file.name,
          data: buffer,
          mimeType: file.type,
          type: 'setting',
          size: file.size,
          description: `Setting image: ${file.name}`
        },
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true
        }
      });
      return image;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw new Error(`Failed to upload image ${file.name}`);
    }
  }

export async function updateSettingImage(formData: FormData) {
  const settingKey = formData.get('settingKey') as string;
  const imageId = formData.get('imageId') as string | null;
  const file = formData.get('file') as File;

  if (!settingKey || !file) {
    throw new Error('Missing required parameters');
  }

  const setting = await prisma.siteSetting.findUnique({
    where: { key: settingKey },
    include: {
      images: {
        select: { imageId: true }
      }
    }
  });

  if (!setting) {
    throw new Error(`Could not find the corresponding setting item: ${settingKey}`);
  }

  const existingImageId = imageId || setting.images[0]?.imageId;

  // 关键修复：首次上传时 existingImageId 为空，原代码直接抛错，导致 Logo 永远存不进 DB。
  // 现在改为：无 existingImageId 时创建新 Image，并建立 SettingImage 关联记录。
  const uploadedImage = await uploadImage(file, existingImageId || undefined);

  // 若是首次上传（setting.images 为空），需要新建 SettingImage 关联记录
  // 用 upsert 防止 unique 约束冲突（[settingId, imageId] 是 unique 的）
  if (!existingImageId) {
    await prisma.settingImage.upsert({
      where: {
        settingId_imageId: {
          settingId: setting.id,
          imageId: uploadedImage.id
        }
      },
      update: {
        description: `Setting image for ${settingKey}`
      },
      create: {
        settingId: setting.id,
        imageId: uploadedImage.id,
        description: `Setting image for ${settingKey}`
      }
    });
  }

  // 清除 getSettingImages 的模块级缓存，让下次拉取拿到最新关联
  await invalidateSettingImages(settingKey);

  return {
    settingKey,
    success: true,
    image: uploadedImage,
    imageId: uploadedImage.id
  };
}
