import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canAccessCollection } from "@/lib/auth/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
  
  try {
    // 私有合集仅登录管理员可访问（匿名返回 404，隐藏存在性）
    if (!(await canAccessCollection(id))) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const parentId = searchParams.get("parentId");

    const folders = await prisma.folder.findMany({
      where: {
        collectionId: id,
        ...(all ? {} : { parentId: parentId || null }),
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(folders, {
      headers: {
        // 目录树数据变化不频繁，加 60s 浏览器缓存 + CDN 缓存 + stale-while-revalidate，
        // 避免每次打开页面都重新查 DB，显著加快首屏目录树渲染
        'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Failed to get folders:", error);
    return NextResponse.json(
      { error: "Failed to get folders" },
      { status: 500 }
    );
  }
}
