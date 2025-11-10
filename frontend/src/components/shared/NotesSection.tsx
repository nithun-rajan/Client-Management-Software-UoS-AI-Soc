import { useState, useEffect, useRef } from "react";
import { StickyNote, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface NotesSectionProps {
  entityType: "landlord" | "vendor" | "applicant" | "property";
  entityId: string;
  initialNotes?: string;
  onNotesChange?: (notes: string) => void;
  className?: string;
}

export default function NotesSection({
  entityType,
  entityId,
  initialNotes = "",
  onNotesChange,
  className,
}: NotesSectionProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = `notes_${entityType}_${entityId}`;
    const timestampKey = `notes_${entityType}_${entityId}_timestamp`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setNotes(saved);
      const savedTimestamp = localStorage.getItem(timestampKey);
      if (savedTimestamp) {
        setLastSaved(new Date(savedTimestamp));
      } else {
        setLastSaved(new Date());
      }
    } else if (initialNotes) {
      setNotes(initialNotes);
    }
  }, [entityType, entityId, initialNotes]);

  // Auto-save function
  const saveNotes = async (notesToSave: string) => {
    const storageKey = `notes_${entityType}_${entityId}`;
    const timestampKey = `notes_${entityType}_${entityId}_timestamp`;
    const now = new Date();
    
    // Save to localStorage immediately
    localStorage.setItem(storageKey, notesToSave);
    localStorage.setItem(timestampKey, now.toISOString());
    setLastSaved(now);
    setHasChanges(false);

    // Try to save to backend if entity supports it
    try {
      setIsSaving(true);
      
      // Map entity types to their API endpoints and field names
      const endpointMap: Record<string, { endpoint: string; field: string; method: "put" | "patch" }> = {
        landlord: { endpoint: `/api/v1/landlords/${entityId}`, field: "notes", method: "put" },
        applicant: { endpoint: `/api/v1/applicants/${entityId}`, field: "notes", method: "put" },
        property: { endpoint: `/api/v1/properties/${entityId}`, field: "management_notes", method: "patch" },
      };

      const config = endpointMap[entityType];
      if (config) {
        // All update schemas support partial updates, so we can just send the field we want to update
        const updateData = { [config.field]: notesToSave };
        
        if (config.method === "patch") {
          await api.patch(config.endpoint, updateData);
        } else {
          await api.put(config.endpoint, updateData);
        }
      }
    } catch (error: any) {
      // Silently fail - localStorage is the primary storage
      console.warn("Failed to save notes to backend:", error);
    } finally {
      setIsSaving(false);
    }

    if (onNotesChange) {
      onNotesChange(notesToSave);
    }
  };

  // Handle text change with debounced auto-save
  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after user stops typing)
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes(value);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (hasChanges && notes) {
        saveNotes(notes);
      }
    };
  }, [hasChanges, notes]);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            <CardTitle>Notes</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </Badge>
            )}
            {!isSaving && lastSaved && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Save className="h-3 w-3" />
                Saved
              </Badge>
            )}
            {hasChanges && !isSaving && (
              <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Textarea
          placeholder="Write your notes here... They will be saved automatically."
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          className="flex-1 resize-none font-mono text-sm min-h-0"
        />
        {lastSaved && (
          <p className="mt-2 text-xs text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

