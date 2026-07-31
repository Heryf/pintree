import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// 获取所有标签（含书签数量）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    const whereClause = collectionId
      ? { bookmarks: { some: { collectionId } } }
      : {};

    const tags = await prisma.tag.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

// 创建新标签
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    const tag = await prisma.tag.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
