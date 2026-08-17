import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DefaultSession } from "next-auth";

// 生产环境缺少 NEXTAUTH_SECRET 时给出明确提示（Vercel 日志中可见）
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  console.error(
    "[Pintree] 缺少 NEXTAUTH_SECRET！请在 Vercel 项目 Settings → Environment Variables 中添加：NEXTAUTH_SECRET=$(openssl rand -base64 32)。未配置时 next-auth 会报 NO_SECRET，登录/会话接口返回 500。"
  );
}

// 扩展 Session 类型
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
  // 必须通过环境变量提供密钥（见 .env.example）。
  // 开发环境未设置时 NextAuth 会打印警告并使用开发默认值；
  // 生产环境未设置时 NextAuth 会在运行时抛出明确错误，避免使用可预测的硬编码密钥。
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 会话有效期 7 天
  },
  providers: [
    CredentialsProvider({
      name: "Email Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // 使用常量时间比较，降低时序攻击风险
        const emailMatches =
          adminEmail && safeEqual(credentials.email, adminEmail);
        const passwordMatches =
          adminPassword && safeEqual(credentials.password, adminPassword);

        if (!emailMatches || !passwordMatches) {
          throw new Error("Email or password is incorrect");
        }

        return {
          id: "admin",
          email: adminEmail,
          name: "Admin"
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
  }
};

/** 常量时间字符串比较，避免早期返回导致时序侧信道 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
