import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 页脚设置卡片组件
interface FooterSettingsCardProps {
  settings: {
    copyrightText: string;
    contactEmail: string;
    [key: string]: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const FooterSettingsCard = ({
  settings,
  handleChange,
}: FooterSettingsCardProps) => {

  return (
    <Card className="border bg-white">
      <CardHeader className="border-b">
        <CardTitle>页脚设置</CardTitle>
        <CardDescription>
          设置网站的页脚信息
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-6">
        {/* 版权信息 */}
        <div className="grid gap-2">
          <Label htmlFor="copyrightText">版权信息</Label>
          <Input
            id="copyrightText"
            name="copyrightText"
            value={settings.copyrightText}
            onChange={handleChange}
            placeholder="© 2024 您的公司名称。保留所有权利。"
          />
        </div>

        {/* 联系邮箱 */}
        <div className="grid gap-2">
          <Label htmlFor="contactEmail">联系邮箱</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            value={settings.contactEmail}
            onChange={handleChange}
            placeholder="contact@example.com"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default FooterSettingsCard;
