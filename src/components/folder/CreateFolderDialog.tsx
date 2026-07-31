import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Folder {
  id: string;
  name: string;
}

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  currentFolderId?: string;
  onSuccess?: () => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  collectionId,
  currentFolderId,
  onSuccess
}: CreateFolderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    isPublic: true,
    password: "",
    parentId: currentFolderId || "root",
  });

  // 获取当前集合的所有文件夹
  useEffect(() => {
    if (collectionId) {
      fetchFolders();
    }
  }, [collectionId]);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/folders`);
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("Failed to get folder.", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          collectionId,
          parentId: formData.parentId === "root" ? null : formData.parentId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData?.error || `Failed to create folder (HTTP ${response.status})`;
        throw new Error(message);
      }

      toast.success("Folder created successfully");
      onOpenChange(false);
      onSuccess?.();

      setFormData({
        name: "",
        isPublic: true,
        password: "",
        parentId: currentFolderId || "root",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create folder";
      console.error("Failed to create folder:", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Parent Folder</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, parentId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Parent Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 暂时注释掉公开访问开关
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isPublic: checked }))
              }
            />
            <Label>公开访问</Label>
          </div>

          {!formData.isPublic && (
            <div className="space-y-2">
              <Label>访问密码</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
          )}
          */}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
