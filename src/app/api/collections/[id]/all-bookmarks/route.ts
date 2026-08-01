import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 一次性返回合集中所有文件夹和书签，供单页平铺布局使用
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
  try {
    // 并行获取所有文件夹和所有书签
    const [folders, bookmarks] = await Promise.all([
      prisma.folder.findMany({
        where: { collectionId: id },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          icon: true,
          parentId: true,
          sortOrder: true,
          isPublic: true,
        },
      }),
      prisma.bookmark.findMany({
        where: { collectionId: id },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          url: true,
          description: true,
          icon: true,
          isFeatured: true,
          sortOrder: true,
          folderId: true,
          tags: {
            select: { name: true },
          },
          folder: {
            select: { name: true },
          },
        },
      }),
    ]);

    return NextResponse.json({ folders, bookmarks });
  } catch (error) {
    console.error("Failed to get all bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to get all bookmarks" },
      { status: 500 }
    );
  }
}
