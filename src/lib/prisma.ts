import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

// 在所有环境（含 Vercel serverless 生产环境）复用同一 PrismaClient 实例，
// 避免函数冷启动时反复 new PrismaClient() 导致数据库连接数累积耗尽，
// 进而出现"写操作间歇性失败（如无法新建文件夹）"的问题。
globalForPrisma.prisma = prisma

