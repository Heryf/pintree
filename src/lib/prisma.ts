import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// 显式传入连接串，避免环境变量缺失/格式异常导致客户端构造阶段报错，
// 从而让任何页面在模块加载时崩溃（Vercel 上表现为全站 “Application error”）。
// 若 DATABASE_URL 未配置，使用占位 URL 构造；真正执行查询时会报连接错误，
// 由各调用方的 try/catch 优雅降级（布局与设置读取均为 fail-open）。
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/pintree?connect_timeout=5'

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ datasourceUrl: databaseUrl })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
