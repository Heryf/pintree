import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSessionSafe } from "@/lib/auth/utils";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('publicOnly') === 'true';
    
    // Retrieve collections list, optionally filtering for public collections
    const collections = await prisma.collection.findMany({
      where: publicOnly ? {
        isPublic: true
      } : undefined,
      orderBy: {
        sortOrder: "asc"
      }
    });

    // 使用 groupBy 一次性统计所有合集的书签数，替代原来的 N+1 循环查询
    const bookmarkCounts = await prisma.bookmark.groupBy({
      by: ['collectionId'],
      _count: { _all: true },
      where: publicOnly ? { collection: { isPublic: true } } : undefined,
    });
    const countMap = new Map(
      bookmarkCounts.map((item) => [item.collectionId, item._count._all])
    );

    const collectionsWithBookmarkCount = collections.map((collection) => ({
      ...collection,
      totalBookmarks: countMap.get(collection.id) ?? 0,
    }));

    // 公开数据允许浏览器/CDN 短时缓存；管理端数据始终实时
    const cacheControl = publicOnly
      ? 'public, max-age=60, s-maxage=120, stale-while-revalidate=600'
      : 'no-store';

    return NextResponse.json(collectionsWithBookmarkCount, {
      headers: { 'Cache-Control': cacheControl },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get bookmark collections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionSafe();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, icon, isPublic, viewStyle, sortStyle, sortOrder } = body;
    const slug = name ? name.toLowerCase().replace(/\s+/g, '-') : "";

    // 检查名称是否已存在
    if (name) {
      const existingCollection = await prisma.collection.findFirst({
        where: {
          OR: [
            { name },
            { slug }
          ]
        }
      });

      if (existingCollection) {
        return NextResponse.json(
          { error: "The name or slug is already in use" },
          { status: 400 }
        );
      }
    }

    // 创建新集合
    const collection = await prisma.collection.create({
      data: {
        name: name || "",
        description: description || "",
        icon: icon || "",
        isPublic: isPublic ?? true,
        viewStyle: viewStyle || "list",
        sortStyle: sortStyle || "alpha",
        sortOrder: sortOrder ?? 0,
        slug,
      },
    });

    return NextResponse.json(collection);
  } catch (error: unknown) {
    console.error("Detailed error creating collection:", error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: "Name or slug already in use" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
