import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma";



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const image = await prisma.image.findUnique({
      where: { id: params.id }
    })

    if (!image) {
      return new NextResponse(null, { status: 404 })
    }

    // 基于 updatedAt 的弱 ETag：图片内容更新后自动失效，未更新时浏览器直接 304，
    // 配合 Cache-Control 显著减少 Logo/背景图等 DB 图片的重复传输
    const etag = `W/"${new Date(image.updatedAt).getTime()}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(image.data, {
      headers: {
        'Content-Type': image.mimeType,
        'Content-Length': image.size.toString(),
        'ETag': etag,
        // no-cache：每次都向服务器验证 ETag，内容未变走 304，内容变化立即拿到新图。
        // 避免 max-age 导致 Logo 上传后浏览器长时间使用本地旧缓存（原 2 分钟才刷新）。
        'Cache-Control': 'no-cache',
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
