import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

/**
 * 安全的会话读取：next-auth v4 在令牌校验失败时（如 NEXTAUTH_SECRET 变更、
 * 旧 cookie 用旧密钥签发、令牌过期/损坏）会抛出异常而不是返回 null。
 * 这里统一捕获，返回 null，让调用方走「未登录」逻辑（跳转登录 / 401），
 * 避免后台页面因一个坏令牌直接崩溃显示服务器错误。
 */
export async function getSessionSafe() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("Session verification failed, treating as unauthenticated:", error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSessionSafe();

  if (!session) {
    redirect("/login");
  }

  return session;
}
