import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";

  const SocialMediaCard = ({
    settings,
    handleChange,
  }: {
    settings: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    const socialLinks = [
      {
        id: "githubUrl",
        label: "GitHub 链接",
        placeholder: "https://github.com/yourusername",
      },
      {
        id: "twitterUrl",
        label: "Twitter 链接",
        placeholder: "https://twitter.com/yourusername",
      },
      {
        id: "discordUrl",
        label: "Discord 链接",
        placeholder: "https://discord.gg/yourserver",
      },
      {
        id: "youtubeUrl",
        label: "YouTube 频道链接",
        placeholder: "https://youtube.com/c/yourchannel",
      },
      { id: "weixinUrl", label: "微信公众号链接", placeholder: "微信公众号链接" },
      {
        id: "weiboUrl",
        label: "微博主页链接",
        placeholder: "https://weibo.com/yourpage",
      },
      {
        id: "bilibiliUrl",
        label: "哔哩哔哩主页链接",
        placeholder: "https://space.bilibili.com/yourpage",
      },
      {
        id: "zhihuUrl",
        label: "知乎主页链接",
        placeholder: "https://zhihu.com/people/yourpage",
      },
    ];
  
    return (
      <Card className="border bg-white">
        <CardHeader className="border-b">
          <CardTitle>社交媒体链接</CardTitle>
          <CardDescription>设置网站页脚显示的社交媒体链接</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-6">
          {socialLinks.map(({ id, label, placeholder }) => (
            <div key={id} className="grid gap-2">
              <Label htmlFor={id}>{label}</Label>
              <Input
                id={id}
                name={id}
                value={settings[id] || ""}
                onChange={handleChange}
                placeholder={placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  export default SocialMediaCard;