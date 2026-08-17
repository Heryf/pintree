import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { defaultSettings } from "@/lib/defaultSettings";

/**
 * 服务端设置读取助手（React cache 去重）：
 * - 同一个请求渲染周期内多次调用只查询一次数据库；
 * - 返回 { settings, map }，map 为 key -> value 的映射，便于消费方直接取值。
 */

export interface SiteSettingsResult {
  settings: { key: string; value: string | null; id: string }[];
  map: Record<string, string>;
}

async function checkSiteSettingTableExists() {
  const result: any = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE  table_schema = 'public'
      AND    table_name   = 'SiteSetting'
    );
  `;
  return result[0].exists;
}

/**
 * 读取一组设置 key（表不存在时回退到默认值）。
 * 通过 React cache 保证同一请求内共享同一份查询结果。
 */
export const getSiteSettings = cache(
  async (keys?: string[]): Promise<SiteSettingsResult> => {
    try {
      const tableExists = await checkSiteSettingTableExists();
      let settings: any[] = [];

      if (tableExists) {
        settings = await prisma.siteSetting.findMany({
          where: keys?.length
            ? { key: { in: keys } }
            : undefined,
        });
      }

      // 表不存在或没有数据时，回退到默认设置
      if (settings.length === 0) {
        const fallback = keys?.length
          ? defaultSettings.filter((s) => keys.includes(s.key))
          : defaultSettings;
        settings = fallback.map((s) => ({ ...s, id: "" }));
      }

      const map = settings.reduce((acc: Record<string, string>, setting: any) => {
        acc[setting.key] = setting.value ?? "";
        return acc;
      }, {} as Record<string, string>);

      return { settings, map };
    } catch (error) {
      console.error("Failed to load site settings:", error);
      return { settings: [], map: {} };
    }
  }
);

/**
 * 读取单个设置项的值（带默认值回退）。
 */
export const getSiteSetting = cache(async (key: string): Promise<string> => {
  const { map } = await getSiteSettings();
  if (map[key] !== undefined) return map[key];
  const def = defaultSettings.find((s) => s.key === key);
  return def?.value ?? "";
});
