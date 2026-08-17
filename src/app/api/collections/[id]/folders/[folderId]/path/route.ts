import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canAccessCollection } from "@/lib/auth/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string; folderId: string } }
) {
  try {
    // 等待参数解析
    const { id, folderId } = await Promise.resolve(params);

    // 私有合集仅登录管理员可访问（匿名返回 404，隐藏存在性）
    if (!(await canAccessCollection(id))) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    
    // 验证参数
    if (!id || !folderId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const path = [];
    let currentFolder = await prisma.folder.findUnique({
      where: { 
        id: folderId,
        collectionId: id // 确保文件夹属于正确的集合
      }
    });

    while (currentFolder) {
      path.unshift({
        id: currentFolder.id,
        name: currentFolder.name
      });
      
      if (!currentFolder.parentId) break;
      
      currentFolder = await prisma.folder.findUnique({
        where: { 
          id: currentFolder.parentId,
          collectionId: id
        }
      });
    }

    return NextResponse.json(path);
  } catch (error) {
    console.error("Failed to get folder path:", error);
    return NextResponse.json(
      { error: "Failed to get folder path" },
      { status: 500 }
    );
  }
}
