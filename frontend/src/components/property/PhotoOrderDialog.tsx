import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PhotoOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  newPhotoUrls: string[];
  onSave: (orderedPhotos: string[]) => void;
}

export default function PhotoOrderDialog({
  open,
  onOpenChange,
  photos,
  newPhotoUrls,
  onSave,
}: PhotoOrderDialogProps) {
  const [orderedPhotos, setOrderedPhotos] = useState<string[]>([
    ...newPhotoUrls,
    ...photos,
  ]);

  // Update ordered photos when props change
  useEffect(() => {
    setOrderedPhotos([...newPhotoUrls, ...photos]);
  }, [newPhotoUrls, photos]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedPhotos];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrderedPhotos(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === orderedPhotos.length - 1) return;
    const newOrder = [...orderedPhotos];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedPhotos(newOrder);
  };

  const handleSave = () => {
    onSave(orderedPhotos);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Arrange Photos</DialogTitle>
          <DialogDescription>
            Reorder your photos. The first photo will be set as the main photo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto py-4">
          {orderedPhotos.map((photo, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg border transition-all",
                index === 0
                  ? "bg-primary/10 border-primary"
                  : "bg-muted/50 border-border"
              )}
            >
              <div className="flex-shrink-0 w-8 text-center font-semibold text-muted-foreground">
                {index + 1}
              </div>
              <div className="flex-shrink-0 w-24 h-16 rounded overflow-hidden bg-muted">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                {index === 0 && (
                  <span className="text-xs font-semibold text-primary">
                    Main Photo
                  </span>
                )}
                {newPhotoUrls.includes(photo) && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (New)
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveDown(index)}
                  disabled={index === orderedPhotos.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" />
            Save Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

