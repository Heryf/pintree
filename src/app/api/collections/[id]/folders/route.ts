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

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Failed to get folders:", error);
    return NextResponse.json(
      { error: "Failed to get folders" },
      { status: 500 }
    );
  }
}
