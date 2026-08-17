import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const sortField = searchParams.get("sortField") || "sortOrder";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // 并行执行：当前层级书签 + 当前层级子文件夹 + 两级统计（替代原来的 N+1 循环查询）
    const [currentBookmarks, subfoldersRaw, bookmarkCounts, childFolderCounts] = await Promise.all([
      prisma.bookmark.findMany({
        where: {
          collectionId: id,
          ...(folderId ? { folderId } : { folderId: null })
        },
        orderBy: {
          [sortField]: sortOrder as 'asc' | 'desc',
        },
        include: {
          collection: {
            select: {
              name: true,
            },
          },
          folder: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.folder.findMany({
        where: {
          collectionId: id,
          parentId: folderId || null
        },
        orderBy: {
          [sortField]: sortOrder as 'asc' | 'desc',
        },
      }),
      prisma.bookmark.groupBy({
        by: ['folderId'],
        _count: { _all: true },
        where: {
          collectionId: id,
          folderId: { not: null },
        },
      }),
      prisma.folder.groupBy({
        by: ['parentId'],
        _count: { _all: true },
        where: {
          collectionId: id,
          parentId: { not: null },
        },
      }),
    ]);

    const bookmarkCountMap = new Map(
      bookmarkCounts.map((item) => [item.folderId, item._count._all])
    );
    const childFolderCountMap = new Map(
      childFolderCounts.map((item) => [item.parentId, item._count._all])
    );

    // 直接映射统计结果，不再逐文件夹查询
    const subfolders = subfoldersRaw.map((folder) => ({
      ...folder,
      bookmarkCount: bookmarkCountMap.get(folder.id) ?? 0,
      childFolderCount: childFolderCountMap.get(folder.id) ?? 0,
    }));

    return NextResponse.json({
      currentBookmarks,
      subfolders,
    }, {
      headers: {
        // 公开书签数据允许短时缓存；管理端导航复用此接口，故保持较短的 max-age
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
      },
    });

  } catch (error) {
    console.error("Failed to get content:", error);
    return NextResponse.json(
      { error: "Failed to get content", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
