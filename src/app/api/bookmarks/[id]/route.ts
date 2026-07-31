import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.bookmark.delete({
      where: {
        id: params.id
      },
    });

    return NextResponse.json({ message: "Delete success" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Delete bookmark failed" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // 构建更新数据
    const updateData: any = {
      title: data.title,
      url: data.url,
      description: data.description,
      collectionId: data.collectionId,
      isFeatured: data.isFeatured,
      icon: data.icon,
    };

    // 处理标签更新：先断开所有，再重新关联
    if (data.tags !== undefined) {
      if (Array.isArray(data.tags) && data.tags.length > 0) {
        updateData.tags = {
          set: [],
          connectOrCreate: data.tags.map((name: string) => ({
            where: { name: name.trim() },
            create: { name: name.trim() },
          })),
        };
      } else {
        updateData.tags = { set: [] };
      }
    }

    const bookmark = await prisma.bookmark.update({
      where: {
        id: params.id,
      },
      data: updateData,
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
        tags: true,
      },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update bookmark failed" }, { status: 500 });
  }
}

