import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, StickyNote, Calendar } from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import EmptyState from "@/components/shared/EmptyState";
import { useLandlords } from "@/hooks/useLandlords";
import { useProperties } from "@/hooks/useProperties";
import { useApplicants } from "@/hooks/useApplicants";
import { useVendors } from "@/hooks/useVendors";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface NoteEntry {
  entityType: "landlord" | "vendor" | "applicant" | "property";
  entityId: string;
  content: string;
  lastEdited: Date;
  entityName: string;
  route: string;
  previousContent?: string;
}

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditedToday, setShowEditedToday] = useState(true);
  const [typeFilters, setTypeFilters] = useState({
    tenants: true,
    properties: true,
    landlords: true,
    buyers: true,
    vendors: true,
  });

  const { data: landlords, isLoading: landlordsLoading } = useLandlords();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: applicants, isLoading: applicantsLoading } = useApplicants();
  const { data: vendors, isLoading: vendorsLoading } = useVendors();

  const isLoading = landlordsLoading || propertiesLoading || applicantsLoading || vendorsLoading;

  // Get all notes from localStorage
  const allNotes = useMemo(() => {
    if (isLoading) return [];

    const notes: NoteEntry[] = [];
    
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("notes_")) continue;
      
      // Skip timestamp and previous content keys
      if (key.endsWith("_timestamp") || key.endsWith("_previous")) continue;
      
      // Parse entity type and ID from key format: notes_{type}_{id}
      const parts = key.split("_");
      if (parts.length < 3) continue;
      
      const entityType = parts[1] as "landlord" | "vendor" | "applicant" | "property";
      const entityId = parts.slice(2).join("_"); // Handle IDs that might contain underscores
      
      const content = localStorage.getItem(key);
      if (!content || content.trim() === "") continue;
      
      // Get timestamp
      const timestampKey = `${key}_timestamp`;
      const timestampStr = localStorage.getItem(timestampKey);
      const lastEdited = timestampStr ? new Date(timestampStr) : new Date(0);
      
      // Get previous content
      const previousContentKey = `${key}_previous`;
      const previousContent = localStorage.getItem(previousContentKey) || undefined;
      
      // Get entity name based on type
      let entityName = "Unknown";
      let route = "";
      
      if (entityType === "landlord") {
        const landlord = landlords?.find((l) => l.id === entityId);
        if (landlord) {
          entityName = landlord.full_name;
          route = `/landlords/${entityId}`;
        }
      } else if (entityType === "property") {
        const property = properties?.find((p) => p.id === entityId);
        if (property) {
          entityName = property.address || property.address_line1 || property.city || "Unknown Property";
          route = `/properties/${entityId}`;
        }
      } else if (entityType === "applicant") {
        const applicant = applicants?.find((a) => a.id === entityId);
        if (applicant) {
          entityName = `${applicant.first_name || ""} ${applicant.last_name || ""}`.trim() || "Unknown";
          // Determine if buyer or tenant
          const isBuyer = applicant.willing_to_buy === true && applicant.willing_to_rent !== true;
          route = `/applicants/${entityId}`;
        }
      } else if (entityType === "vendor") {
        const vendor = vendors?.find((v) => v.id === entityId);
        if (vendor) {
          entityName = `${vendor.first_name || ""} ${vendor.last_name || ""}`.trim() || "Unknown";
          route = `/vendors/${entityId}`;
        }
      }
      
      // Only add if we found the entity
      if (route) {
        notes.push({
          entityType,
          entityId,
          content,
          lastEdited,
          entityName,
          route,
          previousContent,
        });
      }
    }
    
    // Sort by last edited date (most recent first)
    return notes.sort((a, b) => b.lastEdited.getTime() - a.lastEdited.getTime());
  }, [landlords, properties, applicants, vendors, isLoading]);

  // Check if a note was edited today
  const isEditedToday = (note: NoteEntry) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const noteDate = new Date(note.lastEdited);
    noteDate.setHours(0, 0, 0, 0);
    return noteDate.getTime() === today.getTime();
  };

  // Separate notes into today and other
  const { notesToday, notesOther } = useMemo(() => {
    const today: NoteEntry[] = [];
    const other: NoteEntry[] = [];
    
    allNotes.forEach((note) => {
      if (isEditedToday(note)) {
        today.push(note);
      } else {
        other.push(note);
      }
    });
    
    return { notesToday: today, notesOther: other };
  }, [allNotes]);

  // Filter notes based on search, type filters, and edited today filter
  const filterNotes = (notes: NoteEntry[]) => {
    return notes.filter((note) => {
      // Type filter
      let filterKey: keyof typeof typeFilters | null = null;
      
      if (note.entityType === "applicant") {
        const applicant = applicants?.find((a) => a.id === note.entityId);
        const isBuyer = applicant?.willing_to_buy === true && applicant?.willing_to_rent !== true;
        filterKey = isBuyer ? "buyers" : "tenants";
      } else if (note.entityType === "property") {
        filterKey = "properties";
      } else if (note.entityType === "landlord") {
        filterKey = "landlords";
      } else if (note.entityType === "vendor") {
        filterKey = "vendors";
      }
      
      if (filterKey && !typeFilters[filterKey]) return false;
      
      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        note.entityName.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    });
  };

  const filteredNotesToday = useMemo(() => filterNotes(notesToday), [notesToday, searchQuery, typeFilters, applicants]);
  const filteredNotesOther = useMemo(() => filterNotes(notesOther), [notesOther, searchQuery, typeFilters, applicants]);

  const getTypeLabel = (note: NoteEntry) => {
    if (note.entityType === "applicant") {
      const applicant = applicants?.find((a) => a.id === note.entityId);
      const isBuyer = applicant?.willing_to_buy === true && applicant?.willing_to_rent !== true;
      return isBuyer ? "Buyer" : "Tenant";
    }
    return note.entityType.charAt(0).toUpperCase() + note.entityType.slice(1);
  };

  const getTypeBadgeVariant = (note: NoteEntry) => {
    if (note.entityType === "applicant") {
      const applicant = applicants?.find((a) => a.id === note.entityId);
      const isBuyer = applicant?.willing_to_buy === true && applicant?.willing_to_rent !== true;
      return isBuyer ? "default" : "secondary";
    }
    if (note.entityType === "property") return "default";
    if (note.entityType === "landlord") return "default";
    if (note.entityType === "vendor") return "secondary";
    return "outline";
  };

  const getTypeBadgeClassName = (note: NoteEntry) => {
    if (note.entityType === "property") {
      return "bg-green-500 hover:bg-green-600 text-white";
    }
    if (note.entityType === "vendor") {
      return "bg-orange-500 hover:bg-orange-600 text-white";
    }
    if (note.entityType === "landlord") {
      return "bg-orange-500 hover:bg-orange-600 text-white";
    }
    if (note.entityType === "applicant") {
      const applicant = applicants?.find((a) => a.id === note.entityId);
      const isBuyer = applicant?.willing_to_buy === true && applicant?.willing_to_rent !== true;
      // Both tenant and buyer get purple
      return "bg-purple-500 hover:bg-purple-600 text-white";
    }
    return "";
  };

  // Render note content with highlighted new portions
  const renderHighlightedContent = (note: NoteEntry) => {
    // Only highlight if note was edited today AND has previous content
    if (!isEditedToday(note)) {
      // Not edited today - render normally
      return (
        <div className="text-sm text-muted-foreground line-clamp-4">
          {note.content}
        </div>
      );
    }

    // Note was edited today
    if (!note.previousContent || note.previousContent.trim() === "") {
      // No previous content - render normally (can't highlight what was added)
      return (
        <div className="text-sm text-muted-foreground line-clamp-4">
          {note.content}
        </div>
      );
    }

    const previous = note.previousContent.trim();
    const current = note.content.trim();

    // If content is the same, don't highlight
    if (previous === current) {
      return (
        <div className="text-sm text-muted-foreground line-clamp-4">
          {note.content}
        </div>
      );
    }

    // If current content starts with previous content, highlight only the new part
    if (current.startsWith(previous)) {
      const newContent = current.slice(previous.length).trim();
      if (newContent) {
        return (
          <div className="text-sm text-muted-foreground line-clamp-4">
            <span>{previous}</span>
            <span
              className="p-1 rounded inline-block"
              style={{
                backgroundColor: `hsl(var(--accent) / 0.25)`,
                borderLeft: `3px solid hsl(var(--accent))`,
                paddingLeft: "0.5rem",
                marginLeft: "0.25rem",
              }}
            >
              {newContent}
            </span>
          </div>
        );
      }
    }

    // Compare line by line to find new lines
    const previousLines = previous.split('\n').map(l => l.trim());
    const currentLines = current.split('\n').map(l => l.trim());
    
    // Find the first line that differs
    let firstDiffIndex = -1;
    for (let i = 0; i < Math.min(previousLines.length, currentLines.length); i++) {
      if (previousLines[i] !== currentLines[i]) {
        firstDiffIndex = i;
        break;
      }
    }

    // If no difference found in common lines, check if there are new lines
    if (firstDiffIndex === -1) {
      if (currentLines.length > previousLines.length) {
        // New lines were added at the end
        const oldLines = currentLines.slice(0, previousLines.length);
        const newLines = currentLines.slice(previousLines.length);
        if (newLines.length > 0 && newLines.some(l => l.length > 0)) {
          return (
            <div className="text-sm text-muted-foreground line-clamp-4">
              {oldLines.map((line, idx) => (
                <span key={idx}>{line}{idx < oldLines.length - 1 ? '\n' : ''}</span>
              ))}
              {oldLines.length > 0 && '\n'}
              <span
                className="p-1 rounded block"
                style={{
                  backgroundColor: `hsl(var(--accent) / 0.25)`,
                  borderLeft: `3px solid hsl(var(--accent))`,
                  paddingLeft: "0.5rem",
                }}
              >
                {newLines.join('\n')}
              </span>
            </div>
          );
        }
      }
      // Can't determine what's new - render normally
      return (
        <div className="text-sm text-muted-foreground line-clamp-4">
          {note.content}
        </div>
      );
    }

    // Highlight from first diff line onwards
    const oldLines = currentLines.slice(0, firstDiffIndex);
    const newLines = currentLines.slice(firstDiffIndex);
    
    // Only highlight if there's actually new content
    if (newLines.length === 0 || !newLines.some(l => l.length > 0)) {
      return (
        <div className="text-sm text-muted-foreground line-clamp-4">
          {note.content}
        </div>
      );
    }
    
    return (
      <div className="text-sm text-muted-foreground line-clamp-4">
        {oldLines.map((line, idx) => (
          <span key={idx}>{line}{idx < oldLines.length - 1 ? '\n' : ''}</span>
        ))}
        {oldLines.length > 0 && '\n'}
        <span
          className="p-1 rounded block"
          style={{
            backgroundColor: `hsl(var(--accent) / 0.25)`,
            borderLeft: `3px solid hsl(var(--accent))`,
            paddingLeft: "0.5rem",
          }}
        >
          {newLines.join('\n')}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Notes" />
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Notes" />
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or note content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Label className="text-sm font-medium">Filter by type:</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <UICheckbox
                  id="filter-edited-today"
                  checked={showEditedToday}
                  onCheckedChange={(checked) =>
                    setShowEditedToday(checked as boolean)
                  }
                />
                <Label htmlFor="filter-edited-today" className="text-sm font-normal cursor-pointer">
                  Edited today
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <UICheckbox
                  id="filter-tenants"
                  checked={typeFilters.tenants}
                  onCheckedChange={(checked) =>
                    setTypeFilters({ ...typeFilters, tenants: checked as boolean })
                  }
                />
                <Label htmlFor="filter-tenants" className="text-sm font-normal cursor-pointer">
                  Tenants
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <UICheckbox
                  id="filter-properties"
                  checked={typeFilters.properties}
                  onCheckedChange={(checked) =>
                    setTypeFilters({ ...typeFilters, properties: checked as boolean })
                  }
                />
                <Label htmlFor="filter-properties" className="text-sm font-normal cursor-pointer">
                  Properties
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <UICheckbox
                  id="filter-landlords"
                  checked={typeFilters.landlords}
                  onCheckedChange={(checked) =>
                    setTypeFilters({ ...typeFilters, landlords: checked as boolean })
                  }
                />
                <Label htmlFor="filter-landlords" className="text-sm font-normal cursor-pointer">
                  Landlords
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <UICheckbox
                  id="filter-buyers"
                  checked={typeFilters.buyers}
                  onCheckedChange={(checked) =>
                    setTypeFilters({ ...typeFilters, buyers: checked as boolean })
                  }
                />
                <Label htmlFor="filter-buyers" className="text-sm font-normal cursor-pointer">
                  Buyers
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <UICheckbox
                  id="filter-vendors"
                  checked={typeFilters.vendors}
                  onCheckedChange={(checked) =>
                    setTypeFilters({ ...typeFilters, vendors: checked as boolean })
                  }
                />
                <Label htmlFor="filter-vendors" className="text-sm font-normal cursor-pointer">
                  Vendors
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotesToday.length === 0 && filteredNotesOther.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            title="No notes found"
            description={
              searchQuery || Object.values(typeFilters).some((v) => !v)
                ? "Try adjusting your search or filters"
                : "Your notes will appear here once you start adding them"
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Notes Edited Today */}
            {showEditedToday && filteredNotesToday.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    Edited today: <span style={{ color: `hsl(var(--accent))` }}>{filteredNotesToday.length}</span> {filteredNotesToday.length === 1 ? "note" : "notes"}
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredNotesToday.map((note) => (
                    <Card key={`${note.entityType}_${note.entityId}`} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-2">
                              <Link
                                to={note.route}
                                className="text-foreground hover:text-primary hover:underline transition-colors block"
                              >
                                {note.entityName}
                              </Link>
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant={getTypeBadgeVariant(note)} 
                                className={`text-xs ${getTypeBadgeClassName(note)}`}
                              >
                                {getTypeLabel(note)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {renderHighlightedContent(note)}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Calendar className="h-3 w-3" />
                          <span>Last edited: {format(note.lastEdited, "MMM d, yyyy 'at' h:mm a")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {showEditedToday && filteredNotesToday.length > 0 && filteredNotesOther.length > 0 && (
              <div className="border-t my-6" />
            )}

            {/* Other Notes */}
            {filteredNotesOther.length > 0 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredNotesOther.map((note) => (
                    <Card key={`${note.entityType}_${note.entityId}`} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-2">
                              <Link
                                to={note.route}
                                className="text-foreground hover:text-primary hover:underline transition-colors block"
                              >
                                {note.entityName}
                              </Link>
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant={getTypeBadgeVariant(note)} 
                                className={`text-xs ${getTypeBadgeClassName(note)}`}
                              >
                                {getTypeLabel(note)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground line-clamp-4">
                          {note.content}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Calendar className="h-3 w-3" />
                          <span>Last edited: {format(note.lastEdited, "MMM d, yyyy 'at' h:mm a")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
