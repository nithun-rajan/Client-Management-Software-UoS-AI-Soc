import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Upload, Trash2, ChevronUp, ChevronDown, Pencil, Check, X as XIcon, MoveUp, MoveDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import PhotoOrderDialog from "./PhotoOrderDialog";

interface PhotoGalleryProps {
  photos: string[];
  propertyId: string;
  onPhotosUpdate: (photos: string[]) => void;
  mainPhotoUrl?: string;
  onMainPhotoUpdate?: (url: string) => void;
  allowEdit?: boolean;
  className?: string;
  gridView?: boolean;
}

export default function PhotoGallery({
  photos,
  propertyId,
  onPhotosUpdate,
  mainPhotoUrl,
  onMainPhotoUpdate,
  allowEdit = false,
  className = "",
  gridView = false,
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPhotos, setEditedPhotos] = useState<string[]>(photos);
  const [isUploading, setIsUploading] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([]);
  const { toast } = useToast();

  // Update edited photos when photos prop changes
  useEffect(() => {
    setEditedPhotos(photos);
  }, [photos]);

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreen || isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
        setIsEditing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isEditing, currentIndex, editedPhotos.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : editedPhotos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < editedPhotos.length - 1 ? prev + 1 : 0));
  };

  const handlePhotoClick = (index: number) => {
    setCurrentIndex(index);
    setIsFullscreen(true);
  };

  const handleDeletePhoto = async (index: number) => {
    if (editedPhotos.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot delete the last photo",
        variant: "destructive",
      });
      return;
    }

    const newPhotos = editedPhotos.filter((_, i) => i !== index);
    setEditedPhotos(newPhotos);
    
    if (index === currentIndex && currentIndex >= newPhotos.length) {
      setCurrentIndex(newPhotos.length - 1);
    } else if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }

    // Update main photo if deleting the first photo
    if (index === 0 && newPhotos.length > 0) {
      await updateMainPhoto(newPhotos[0]);
    }

    await savePhotos(newPhotos);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPhotos = [...editedPhotos];
    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
    setEditedPhotos(newPhotos);
    
    if (index === currentIndex) {
      setCurrentIndex(index - 1);
    } else if (index - 1 === currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index === editedPhotos.length - 1) return;
    const newPhotos = [...editedPhotos];
    [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
    setEditedPhotos(newPhotos);
    
    if (index === currentIndex) {
      setCurrentIndex(index + 1);
    } else if (index + 1 === currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("property_id", propertyId);
        formData.append("document_type", "property_photo");

        const uploadResponse = await api.post("/api/v1/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const fileUrl = uploadResponse.data.file_url;
        const photoUrl = fileUrl.startsWith("http") 
          ? fileUrl 
          : `${apiBaseUrl}/${fileUrl}`;
        
        uploadedUrls.push(photoUrl);
      }

      // If this is the first photo, just add it and set as main
      if (editedPhotos.length === 0) {
        const updatedPhotos = uploadedUrls;
        setEditedPhotos(updatedPhotos);
        await savePhotos(updatedPhotos);
        if (uploadedUrls.length > 0 && onMainPhotoUpdate) {
          await updateMainPhoto(uploadedUrls[0]);
        }
        toast({
          title: "Success",
          description: `${uploadedUrls.length} photo(s) uploaded successfully`,
        });
      } else {
        // If not first photo, show ordering dialog with all new photos
        setNewPhotoUrls(uploadedUrls);
        setOrderDialogOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveOrder = async (orderedPhotos: string[]) => {
    setEditedPhotos(orderedPhotos);
    await savePhotos(orderedPhotos);
    if (orderedPhotos.length > 0 && onMainPhotoUpdate) {
      await updateMainPhoto(orderedPhotos[0]);
    }
    setOrderDialogOpen(false);
    setNewPhotoUrls([]);
    setCurrentIndex(0);
    toast({
      title: "Success",
      description: "Photos ordered successfully",
    });
  };

  const updateMainPhoto = async (url: string) => {
    if (!onMainPhotoUpdate) return;
    
    try {
      await api.patch(`/api/v1/properties/${propertyId}`, {
        main_photo_url: url,
      });
      onMainPhotoUpdate(url);
    } catch (error) {
      console.error("Failed to update main photo:", error);
    }
  };

  const savePhotos = async (photoArray: string[]) => {
    try {
      await api.patch(`/api/v1/properties/${propertyId}`, {
        photo_urls: JSON.stringify(photoArray),
        main_photo_url: photoArray.length > 0 ? photoArray[0] : null,
      });
      onPhotosUpdate(photoArray);
      
      if (photoArray.length > 0 && onMainPhotoUpdate) {
        onMainPhotoUpdate(photoArray[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save photos",
        variant: "destructive",
      });
    }
  };

  const handleSaveReorder = async () => {
    await savePhotos(editedPhotos);
    setIsEditing(false);
    
    // Update main photo to first photo
    if (editedPhotos.length > 0) {
      await updateMainPhoto(editedPhotos[0]);
    }
  };

  const handleCancelEdit = () => {
    setEditedPhotos(photos);
    setIsEditing(false);
  };

  const handleSetMainPhoto = async (index: number) => {
    if (index === 0) return;
    
    const newPhotos = [...editedPhotos];
    const [mainPhoto] = newPhotos.splice(index, 1);
    newPhotos.unshift(mainPhoto);
    setEditedPhotos(newPhotos);
    setCurrentIndex(0);
    
    await savePhotos(newPhotos);
    await updateMainPhoto(mainPhoto);
  };

  // Helper to normalize photo URLs (handle both full URLs and relative paths)
  const normalizePhotoUrl = (url: string): string => {
    if (!url) return url;
    // If already a full URL, return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // If relative path, construct full URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    return `${apiBaseUrl}/${url}`;
  };

  // Normalize photo URLs
  const normalizedPhotos = editedPhotos.map(normalizePhotoUrl);
  const normalizedMainPhotoUrl = mainPhotoUrl ? normalizePhotoUrl(mainPhotoUrl) : undefined;

  // Get display photos (use main_photo_url if no photos array)
  const displayPhotos = normalizedPhotos.length > 0 
    ? normalizedPhotos 
    : normalizedMainPhotoUrl 
      ? [normalizedMainPhotoUrl] 
      : [];

  // Helper to get placeholder image URL
  const getPlaceholderUrl = () => {
    // Use a placeholder service or default image
    return `https://picsum.photos/seed/property${propertyId}/800/450`;
  };

  return (
    <>
      {/* Grid View */}
      {gridView && displayPhotos.length > 0 && (
        <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2", className)}>
          {displayPhotos.map((photo, index) => (
            <div
              key={index}
              className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => handlePhotoClick(index)}
            >
              <img
                src={photo}
                alt={`Property photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Single Image View (for property cards) */}
      {!gridView && (
        <>
          {displayPhotos.length > 0 ? (
            <div className={cn("relative aspect-video rounded-lg overflow-hidden cursor-pointer group", className)}>
              <img
                src={displayPhotos[0]}
                alt="Property photo"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onClick={() => handlePhotoClick(0)}
              />
              {displayPhotos.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                  {displayPhotos.length} photos
                </div>
              )}
              {allowEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePhotoClick(0);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : allowEdit ? (
            // Empty state with upload button
            <div className={cn("relative aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50", className)}>
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">No photos yet</p>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddPhotos(e.target.files)}
                    disabled={isUploading}
                  />
                  <Button variant="outline" size="sm" asChild disabled={isUploading}>
                    <span>
                      {isUploading ? "Uploading..." : "Upload Photos"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            // Placeholder image when no photos and not editable
            <div className={cn("relative aspect-video rounded-lg overflow-hidden bg-muted", className)}>
              <img
                src={getPlaceholderUrl()}
                alt="Property placeholder"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </>
      )}

      {/* Fullscreen View */}
      <Dialog open={isFullscreen} onOpenChange={(open) => {
        setIsFullscreen(open);
        if (!open) setIsEditing(false);
      }}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white z-10">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {currentIndex + 1} of {displayPhotos.length}
                </span>
                {allowEdit && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-white hover:bg-white/20"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveReorder}
                      className="text-white hover:bg-white/20"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="text-white hover:bg-white/20"
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsFullscreen(false);
                  setIsEditing(false);
                }}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Main Image Area */}
            <div className="flex-1 relative flex items-center justify-center min-h-0">
              {displayPhotos.length > 0 && (
                <>
                  <img
                    src={displayPhotos[currentIndex]}
                    alt={`Property photo ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {/* Navigation Arrows */}
                  {displayPhotos.length > 1 && !isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={handlePrevious}
                        className="absolute left-4 text-white hover:bg-white/20 h-12 w-12 rounded-full border border-white/20"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={handleNext}
                        className="absolute right-4 text-white hover:bg-white/20 h-12 w-12 rounded-full border border-white/20"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}

                  {/* Edit Mode Controls Overlay */}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-black/90 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
                        <h3 className="text-white font-semibold text-lg mb-4">Edit Photo</h3>
                        <div className="space-y-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePhoto(currentIndex)}
                            disabled={displayPhotos.length <= 1}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Photo
                          </Button>
                          {currentIndex !== 0 && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSetMainPhoto(currentIndex)}
                              className="w-full"
                            >
                              Set as Main Photo
                            </Button>
                          )}
                          {currentIndex > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveUp(currentIndex)}
                              className="w-full text-white border-white/20 hover:bg-white/20"
                            >
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Move Up
                            </Button>
                          )}
                          {currentIndex < displayPhotos.length - 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoveDown(currentIndex)}
                              className="w-full text-white border-white/20 hover:bg-white/20"
                            >
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Move Down
                            </Button>
                          )}
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handleAddPhotos(e.target.files)}
                              disabled={isUploading}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              disabled={isUploading}
                              className="w-full text-white border-white/20 hover:bg-white/20"
                            >
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploading ? "Uploading..." : "Add More Photos"}
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {displayPhotos.length > 1 && (
              <div className="p-4 border-t border-white/20 overflow-x-auto bg-black/50">
                <div className="flex gap-2 justify-center">
                  {displayPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className={cn(
                        "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                        index === currentIndex
                          ? "border-white scale-110"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                      onClick={() => {
                        if (!isEditing) {
                          setCurrentIndex(index);
                        }
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-semibold px-1 rounded">
                          Main
                        </div>
                      )}
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            {index > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveUp(index);
                                }}
                                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                            )}
                            {index < displayPhotos.length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveDown(index);
                                }}
                                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Order Dialog */}
      {newPhotoUrls.length > 0 && (
        <PhotoOrderDialog
          open={orderDialogOpen}
          onOpenChange={(open) => {
            setOrderDialogOpen(open);
            if (!open) {
              // If dialog is closed without saving, add photos to the end
              if (newPhotoUrls.length > 0) {
                const updatedPhotos = [...editedPhotos, ...newPhotoUrls];
                setEditedPhotos(updatedPhotos);
                savePhotos(updatedPhotos);
                setNewPhotoUrls([]);
              }
            }
          }}
          photos={editedPhotos}
          newPhotoUrls={newPhotoUrls}
          onSave={handleSaveOrder}
        />
      )}
    </>
  );
}
