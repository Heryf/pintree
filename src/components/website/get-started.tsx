import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GetStarted() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">欢迎使用 Pizza</h1>
        <p className="mb-6">一个强大的书签管理平台，帮助您更好地整理和分享网络资源</p>
        <Link href="/admin/collections">
          <Button variant="default" size="lg">
            开始使用
          </Button>
        </Link>
      </div>
    </div>
  );
} 