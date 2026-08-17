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
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
