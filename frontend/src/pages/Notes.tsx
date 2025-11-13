import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, StickyNote, Calendar, Users, Building2, UserCheck, ShoppingBag, Store } from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("all");

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
    if (!note.lastEdited) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0, 0, 0);
    today.setSeconds(0, 0);
    today.setMilliseconds(0);
    
    const noteDate = new Date(note.lastEdited);
    // Check if date is valid
    if (isNaN(noteDate.getTime())) return false;
    noteDate.setHours(0, 0, 0, 0);
    noteDate.setMinutes(0, 0, 0);
    noteDate.setSeconds(0, 0);
    noteDate.setMilliseconds(0);
    
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

  // Filter notes by tab
  const filterNotesByTab = (notes: NoteEntry[]) => {
    if (activeTab === "all") return notes;
    
    return notes.filter((note) => {
      if (activeTab === "tenants") {
        if (note.entityType !== "applicant") return false;
        const applicant = applicants?.find((a) => a.id === note.entityId);
        return applicant && !(applicant.willing_to_buy === true && applicant.willing_to_rent !== true);
      } else if (activeTab === "buyers") {
        if (note.entityType !== "applicant") return false;
        const applicant = applicants?.find((a) => a.id === note.entityId);
        return applicant && applicant.willing_to_buy === true && applicant.willing_to_rent !== true;
      } else if (activeTab === "properties") {
        return note.entityType === "property";
      } else if (activeTab === "landlords") {
        return note.entityType === "landlord";
      } else if (activeTab === "vendors") {
        return note.entityType === "vendor";
      }
      return true;
    });
  };

  // Apply search filter
  const applySearchFilter = (notes: NoteEntry[]) => {
    if (!searchQuery) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter((note) => (
      note.entityName.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    ));
  };

  // Filter notes based on tab and search
  const filteredNotesToday = useMemo(() => {
    const tabFiltered = filterNotesByTab(notesToday);
    return applySearchFilter(tabFiltered);
  }, [notesToday, activeTab, searchQuery, applicants]);

  const filteredNotesOther = useMemo(() => {
    const tabFiltered = filterNotesByTab(notesOther);
    return applySearchFilter(tabFiltered);
  }, [notesOther, activeTab, searchQuery, applicants]);

  // Helper function to filter notes by a specific tab
  const filterByTab = (notes: NoteEntry[], tab: string) => {
    if (tab === "all") return notes;
    
    return notes.filter((note) => {
      if (tab === "tenants") {
        if (note.entityType !== "applicant") return false;
        const applicant = applicants?.find((a) => a.id === note.entityId);
        return applicant && !(applicant.willing_to_buy === true && applicant.willing_to_rent !== true);
      } else if (tab === "buyers") {
        if (note.entityType !== "applicant") return false;
        const applicant = applicants?.find((a) => a.id === note.entityId);
        return applicant && applicant.willing_to_buy === true && applicant.willing_to_rent !== true;
      } else if (tab === "properties") {
        return note.entityType === "property";
      } else if (tab === "landlords") {
        return note.entityType === "landlord";
      } else if (tab === "vendors") {
        return note.entityType === "vendor";
      }
      return true;
    });
  };

  // Calculate counts for each tab
  const allNotesCombined = useMemo(() => [...notesToday, ...notesOther], [notesToday, notesOther]);
  const allCount = allNotesCombined.length;
  const tenantsCount = useMemo(() => filterByTab(allNotesCombined, "tenants").length, [allNotesCombined, applicants]);
  const buyersCount = useMemo(() => filterByTab(allNotesCombined, "buyers").length, [allNotesCombined, applicants]);
  const propertiesCount = useMemo(() => filterByTab(allNotesCombined, "properties").length, [allNotesCombined]);
  const landlordsCount = useMemo(() => filterByTab(allNotesCombined, "landlords").length, [allNotesCombined]);
  const vendorsCount = useMemo(() => filterByTab(allNotesCombined, "vendors").length, [allNotesCombined]);

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
    // Only highlight if note was edited today
    if (!isEditedToday(note)) {
      // Not edited today - render normally
      return (
        <div className="text-sm text-muted-foreground line-clamp-4">
          {note.content}
        </div>
      );
    }

    // Note was edited today - check if there's meaningful previous content
    const hasPreviousContent = note.previousContent && note.previousContent.trim().length > 0;
    
    if (!hasPreviousContent) {
      // No previous content or empty - highlight everything since it's all new
      if (!note.content || note.content.trim().length === 0) {
        // Empty content - render normally
        return (
          <div className="text-sm text-muted-foreground line-clamp-4">
            {note.content}
          </div>
        );
      }
      // Highlight all content with accent color
      return (
        <div className="text-sm text-muted-foreground line-clamp-4">
          <span
            style={{
              color: `hsl(var(--accent))`,
            }}
          >
            {note.content}
          </span>
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

    // If previous content is very short (1-3 chars) and current is much longer,
    // treat it as a new note being typed - highlight everything
    if (previous.length <= 3 && current.length > previous.length * 2) {
      return (
        <div className="text-sm text-muted-foreground line-clamp-4">
          <span
            style={{
              color: `hsl(var(--accent))`,
            }}
          >
            {note.content}
          </span>
        </div>
      );
    }

    // If current content starts with previous content, highlight only the new part
    if (current.startsWith(previous)) {
      const newContent = current.slice(previous.length);
      if (newContent) {
        // Check if new content starts with a space - if so, trim it for display
        // Otherwise preserve the first character
        const startsWithSpace = newContent.startsWith(' ');
        const displayContent = startsWithSpace ? newContent.trimStart() : newContent;
        const leadingSpace = startsWithSpace ? ' ' : '';
        
        return (
          <div className="text-sm text-muted-foreground line-clamp-4">
            <span>{previous}{leadingSpace}</span>
            <span
              style={{
                color: `hsl(var(--accent))`,
              }}
            >
              {displayContent}
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
                style={{
                  color: `hsl(var(--accent))`,
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
          style={{
            color: `hsl(var(--accent))`,
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
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or note content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All Notes ({allCount})
            </TabsTrigger>
            <TabsTrigger value="tenants">
              <Users className="mr-2 h-4 w-4" />
              Tenants ({tenantsCount})
            </TabsTrigger>
            <TabsTrigger value="properties">
              <Building2 className="mr-2 h-4 w-4" />
              Properties ({propertiesCount})
            </TabsTrigger>
            <TabsTrigger value="landlords">
              <UserCheck className="mr-2 h-4 w-4" />
              Landlords ({landlordsCount})
            </TabsTrigger>
            <TabsTrigger value="buyers">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Buyers ({buyersCount})
            </TabsTrigger>
            <TabsTrigger value="vendors">
              <Store className="mr-2 h-4 w-4" />
              Vendors ({vendorsCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notes Grid */}
        {filteredNotesToday.length === 0 && filteredNotesOther.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            title="No notes found"
            description={
              searchQuery || activeTab !== "all"
                ? "Try adjusting your search or filters"
                : "Your notes will appear here once you start adding them"
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Notes Edited Today */}
            {filteredNotesToday.length > 0 && (
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
                          <span>Last edited: {format(note.lastEdited, "dd/MM/yyyy 'at' HH:mm")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {filteredNotesToday.length > 0 && filteredNotesOther.length > 0 && (
              <div className="border-t my-6" />
            )}

            {/* Other Notes */}
            {filteredNotesOther.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Other notes</h2>
                </div>
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
                          <span>Last edited: {format(note.lastEdited, "dd/MM/yyyy 'at' HH:mm")}</span>
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
