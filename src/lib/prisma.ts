import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// 注意：不要在这里给 PrismaClient 传入自定义 datasourceUrl。
// 实测 Prisma 5.22 在 DATABASE_URL 缺失/非法/不可达时构造均不会抛错（查询时才报错），
// 且各调用方均有 try/catch 优雅降级；显式传 URL 反而引入与线上连接串行为不一致的新变量。
export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
