import { useState } from "react";
import {
  Users,
  Mail,
  Phone,
  Bed,
  PoundSterling,
  Eye,
  Pencil,
  Trash2,
  Dog,
  Sparkles,
  MapPin,
  Home,
  Calendar,
  UserCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApplicants, useMyApplicants } from "@/hooks/useApplicants";
import { usePropertyMatching, PropertyMatch } from "@/hooks/useMatching";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

// Helper function to extract flat/unit number from address
const getFlatOrUnitNumber = (addressLine1: string | undefined, address: string | undefined, city?: string): string => {
  const addressStr = addressLine1 || address || "";
  
  if (!addressStr) return "";
  
  // Look for flat/unit patterns anywhere in the string (Studio, Flat, Unit, etc.)
  const flatMatch = addressStr.match(/\b(Studio|Flat|Unit|Apartment|Apt|Suite|Room)\s+[\w\d]+/i);
  if (flatMatch) {
    return flatMatch[0];
  }
  
  // If no flat/unit pattern found, check if there are commas
  const parts = addressStr.split(',').map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length > 1) {
    // Remove city from parts if it matches
    const filteredParts = city 
      ? parts.filter(p => p.toLowerCase() !== city.toLowerCase())
      : parts;
    
    // Return the last part (likely the flat/unit, or street if no flat/unit found)
    if (filteredParts.length > 0) {
      return filteredParts[filteredParts.length - 1];
    }
  }
  
  // If no comma, return the whole string (but remove city if present)
  if (city && addressStr.toLowerCase().endsWith(city.toLowerCase())) {
    return addressStr.replace(new RegExp(`[, ]*${city}`, 'gi'), '').trim();
  }
  
  return addressStr;
};

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function Applicants() {
  const [viewMode, setViewMode] = useState<"all" | "my">("all");
  const { data: allApplicants, isLoading: isLoadingAll } = useApplicants();
  const { data: myApplicants, isLoading: isLoadingMy } = useMyApplicants();
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);

  const matchingMutation = usePropertyMatching(5, 50);
  
  // Use the appropriate data based on view mode
  const applicants = viewMode === "my" ? myApplicants : allApplicants;
  const isLoading = viewMode === "my" ? isLoadingMy : isLoadingAll;

  const handleFindMatches = async (applicantId: string) => {
    setSelectedApplicantId(applicantId);
    try {
      const result = await matchingMutation.mutateAsync(applicantId);
      if (result.matches.length > 0) {
        setMatchesDialogOpen(true);
      }
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Applicants" />
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const matchData = matchingMutation.data;

  return (
    <div>
      <Header title="Applicants" />
      <div className="p-6">
        {/* View Mode Toggle */}
        <div className="mb-6">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "all" | "my")}>
            <TabsList>
              <TabsTrigger value="all">
                <Users className="mr-2 h-4 w-4" />
                All Applicants
              </TabsTrigger>
              <TabsTrigger value="my">
                <UserCircle className="mr-2 h-4 w-4" />
                My Applicants
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applicants?.map((applicant) => (
            <Card
              key={applicant.id}
              className="flex h-full flex-col shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader className="flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary font-bold text-white">
                    {getInitials(applicant.first_name, applicant.last_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">
                      {applicant.first_name} {applicant.last_name}
                    </h3>
                    <StatusBadge status={applicant.status} className="mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{applicant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{applicant.phone}</span>
                </div>
                {applicant.desired_bedrooms && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bed className="h-4 w-4 shrink-0" />
                    <span>{applicant.desired_bedrooms} beds</span>
                  </div>
                )}
                {(applicant.rent_budget_min || applicant.rent_budget_max) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PoundSterling className="h-4 w-4 shrink-0" />
                    <span>
                      £{applicant.rent_budget_min || 0} - £
                      {applicant.rent_budget_max || 0} pcm
                    </span>
                  </div>
                )}
                {applicant.has_pets && (
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <Dog className="h-4 w-4 shrink-0" />
                    <span>Pet friendly</span>
                  </div>
                )}
                {applicant.last_contacted_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>
                      Last contacted: {formatDistanceToNow(new Date(applicant.last_contacted_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {!applicant.last_contacted_at && viewMode === "my" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>Never contacted</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="mt-auto flex-shrink-0 flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={() => handleFindMatches(applicant.id)}
                  disabled={matchingMutation.isPending}
                >
                  <Sparkles className="mr-1 h-4 w-4" />
                  {matchingMutation.isPending && selectedApplicantId === applicant.id
                    ? "Finding..."
                    : "Find Matches"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/applicants/${applicant.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

          {applicants?.length === 0 && (
            <EmptyState
              icon={Users}
              title="No applicants yet"
              description="Start building your applicant database by adding your first applicant"
              actionLabel="+ Add Applicant"
              onAction={() => {}}
            />
          )}
      </div>

      {/* Matches Dialog */}
      <Dialog open={matchesDialogOpen} onOpenChange={setMatchesDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Property Matches for {matchData?.applicant.name}
            </DialogTitle>
            <DialogDescription>
              Found {matchData?.total_matches} matching properties (AI Confidence:{" "}
              {((matchData?.ai_confidence || 0) * 100).toFixed(0)}%)
            </DialogDescription>
          </DialogHeader>

          {matchData && (
            <div className="space-y-6">
              {/* Applicant Criteria */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">Search Criteria</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bedrooms:</span>
                    <span className="ml-2 font-medium">
                      {matchData.applicant.criteria.bedrooms}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="ml-2 font-medium">
                      {matchData.applicant.criteria.budget}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Locations:</span>
                    <span className="ml-2 font-medium">
                      {matchData.applicant.criteria.locations}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Move-in:</span>
                    <span className="ml-2 font-medium">
                      {matchData.applicant.criteria.move_in_date || "Flexible"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Matched Properties */}
              <div className="space-y-4">
                {matchData.matches.map((match: PropertyMatch, index: number) => (
                  <Card
                    key={match.property_id}
                    className="border-2 transition-colors hover:border-primary"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge
                              variant={match.score >= 75 ? "default" : "secondary"}
                              className="font-bold"
                            >
                              {match.score}% Match
                            </Badge>
                            {index === 0 && <Badge variant="outline">Best Match</Badge>}
                          </div>
                          <CardTitle className="text-lg">
                            {capitalizeWords(
                              getFlatOrUnitNumber(match.property.address_line1, match.property.address, match.property.city) || match.property.city
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {match.property.city}, {match.property.postcode}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          {match.property.rent ? (
                            <>
                              <div className="text-2xl font-bold text-primary">
                                £{match.property.rent.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">per month</div>
                            </>
                          ) : (
                            <div className="text-lg font-semibold text-muted-foreground">
                              POA
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Property Details */}
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span>{match.property.bedrooms} beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">
                            {match.property.property_type}
                          </span>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div>
                        <div className="mb-2 text-sm font-medium">
                          Why this matches:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {match.match_reasons.map((reason, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Personalized Message */}
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                          AI-Generated Message:
                        </div>
                        <p className="text-sm">{match.personalized_message}</p>
                      </div>

                      {/* Viewing Slots */}
                      <div>
                        <div className="mb-2 flex items-center gap-1 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          Available Viewing Slots:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {match.viewing_slots.map((slot, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {slot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Send to Applicant
                      </Button>
                      <Button size="sm" variant="outline">
                        Book Viewing
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/properties/${match.property_id}`}>
                          View Property
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Next Steps */}
              {matchData.next_steps && matchData.next_steps.length > 0 && (
                <Card className="bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-sm">Recommended Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {matchData.next_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
