import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  Mail,
  Phone,
  PoundSterling,
  Calendar,
  ArrowLeft,
  Home,
  Bed,
  Bath,
  Sparkles,
  Eye,
  Send,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { usePropertyMatching, PropertyMatch } from "@/hooks/useMatching";
import { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";

// Helper function to extract flat/unit number from address
const getFlatOrUnitNumber = (address: string | undefined, city?: string): string => {
  if (!address) return "";
  
  // Look for flat/unit patterns anywhere in the string (Studio, Flat, Unit, etc.)
  const flatMatch = address.match(/\b(Studio|Flat|Unit|Apartment|Apt|Suite|Room)\s+[\w\d]+/i);
  if (flatMatch) {
    return flatMatch[0];
  }
  
  // If no flat/unit pattern found, check if there are commas
  const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0);
  
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
  if (city && address.toLowerCase().endsWith(city.toLowerCase())) {
    return address.replace(new RegExp(`[, ]*${city}`, 'gi'), '').trim();
  }
  
  return address;
};

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function ApplicantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matchesLoaded, setMatchesLoaded] = useState(false);

  const { data: applicant, isLoading, error } = useQuery({
    queryKey: ["applicant", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("Applicant ID is required");
      }
      const response = await api.get(`/api/v1/applicants/${id}`);
      return response.data;
    },
    enabled: !!id, // Only run query if id exists
  });

  const matchingMutation = usePropertyMatching(5, 50);

  const handleFindMatches = async () => {
    if (!id) return;
    try {
      const result = await matchingMutation.mutateAsync(id);
      if (result.matches.length > 0) {
        setMatchesLoaded(true);
        toast({
          title: "Matches Found",
          description: `Found ${result.total_matches} matching properties`,
        });
      } else {
        toast({
          title: "No Matches",
          description: "No properties match this applicant's criteria",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  };

  const handleSendEmail = () => {
    toast({
      title: "Email Sent",
      description: `Property details sent to interested parties`,
    });
  };

  const handleBookViewing = (propertyId: string) => {
    toast({
      title: "Viewing Booked",
      description: "Viewing has been scheduled. We'll notify the applicant.",
    });
  };

  const handleSendToApplicant = (match: PropertyMatch) => {
    toast({
      title: "Message Sent",
      description: `Property details sent to ${applicant?.first_name} ${applicant?.last_name}`,
    });
  };
  if (isLoading) {
    return (
      <div>
        <Header title="Applicant Details" />
        <div className="p-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div>
        <Header title="Applicant Details" />
        <div className="p-6">
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Applicant not found</h3>
            <Button onClick={() => navigate("/applicants")}>Back to Applicants</Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div>
      <Header title="Applicant Details" />
      <div className="space-y-6 p-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/applicants")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applicants
          </Button>
          <StatusBadge status={applicant.status} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="bg-gradient-secondary flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white">
                  {getInitials(applicant.first_name, applicant.last_name)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    {applicant.first_name} {applicant.last_name}
                  </CardTitle>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={applicant.status} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Contact Information</h3>
                  <Button size="sm" variant="outline" onClick={handleSendEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Details
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{applicant.email}</div>
                    </div>
                  </div>
                  {applicant.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{applicant.phone}</div>
                      </div>
                    </div>
                  )}
                  {applicant.date_of_birth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Date of Birth
                        </div>
                        <div className="font-medium">
                          {new Date(applicant.date_of_birth).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">Property Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  {applicant.desired_bedrooms && (
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                      <div className="font-medium">{applicant.desired_bedrooms}</div>
                    </div>
                  )}
                  {applicant.desired_property_type && (
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-sm text-muted-foreground">Property Type</div>
                      <div className="font-medium capitalize">
                        {applicant.desired_property_type}
                      </div>
                    </div>
                  )}
                  {applicant.move_in_date && (
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-sm text-muted-foreground">Move-in Date</div>
                      <div className="font-medium">
                        {new Date(applicant.move_in_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {applicant.preferred_locations && (
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-sm text-muted-foreground">
                        Preferred Locations
                      </div>
                      <div className="font-medium">{applicant.preferred_locations}</div>
                    </div>
                  )}
                </div>
              </div>

              {(applicant.has_pets || applicant.special_requirements) && (
                <div>
                  <h3 className="mb-3 font-semibold">Additional Information</h3>
                  <div className="space-y-2">
                    {applicant.has_pets && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Has Pets</Badge>
                        {applicant.pet_details && (
                          <span className="text-sm text-muted-foreground">
                            {applicant.pet_details}
                          </span>
                        )}
                      </div>
                    )}
                    {applicant.special_requirements && (
                      <p className="text-muted-foreground">
                        {applicant.special_requirements}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {applicant.rent_budget_min && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum</span>
                    <div className="flex items-center gap-1 font-medium">
                      <PoundSterling className="h-4 w-4" />
                      {applicant.rent_budget_min.toLocaleString()}
                    </div>
                  </div>
                )}
                {applicant.rent_budget_max && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maximum</span>
                    <div className="flex items-center gap-1 font-medium">
                      <PoundSterling className="h-4 w-4" />
                      {applicant.rent_budget_max.toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matched Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {!matchesLoaded && !matchingMutation.data ? (
                  <div className="text-center">
                    <Home className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="mb-4 text-sm text-muted-foreground">
                      Find property matches for this applicant
                    </p>
                    <Button
                      onClick={handleFindMatches}
                      disabled={matchingMutation.isPending}
                      size="sm"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {matchingMutation.isPending ? "Finding Matches..." : "Find Matches"}
                    </Button>
                  </div>
                ) : matchingMutation.isPending ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                ) : matchingMutation.data && matchingMutation.data.matches.length > 0 ? (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {matchingMutation.data.total_matches}
                    </div>
                    <p className="text-sm text-muted-foreground">Matches Found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      AI Confidence: {matchingMutation.data.ai_confidence}%
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Home className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No matches found</p>
                    <Button
                      onClick={handleFindMatches}
                      disabled={matchingMutation.isPending}
                      size="sm"
                      variant="outline"
                      className="mt-4"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Property Matches Section */}
        {matchingMutation.data && matchingMutation.data.matches.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Property Matches for {applicant?.first_name} {applicant?.last_name}</CardTitle>
                  <CardDescription>
                    Found {matchingMutation.data.total_matches} matching properties (AI Confidence: {matchingMutation.data.ai_confidence}%)
                  </CardDescription>
                </div>
                <Button
                  onClick={handleFindMatches}
                  disabled={matchingMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Refresh Matches
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Criteria */}
              {matchingMutation.data.applicant.criteria && (
                <Card className="mb-6 bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Search Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {matchingMutation.data.applicant.criteria.bedrooms && (
                        <div>
                          <span className="text-muted-foreground">Bedrooms: </span>
                          <span className="font-medium">{matchingMutation.data.applicant.criteria.bedrooms}</span>
                        </div>
                      )}
                      {matchingMutation.data.applicant.criteria.budget && (
                        <div>
                          <span className="text-muted-foreground">Budget: </span>
                          <span className="font-medium">{matchingMutation.data.applicant.criteria.budget}</span>
                        </div>
                      )}
                      {matchingMutation.data.applicant.criteria.locations && (
                        <div>
                          <span className="text-muted-foreground">Locations: </span>
                          <span className="font-medium">{matchingMutation.data.applicant.criteria.locations}</span>
                        </div>
                      )}
                      {matchingMutation.data.applicant.criteria.move_in_date && (
                        <div>
                          <span className="text-muted-foreground">Move-in: </span>
                          <span className="font-medium">{new Date(matchingMutation.data.applicant.criteria.move_in_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Matches List */}
              <div className="space-y-4">
                {matchingMutation.data.matches.map((match: PropertyMatch, index: number) => (
                  <Card key={match.property_id} className={index === 0 ? "ring-2 ring-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              {Math.round(match.score)}% Match
                            </Badge>
                            {index === 0 && (
                              <Badge variant="outline" className="bg-primary/10">
                                Best Match
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="mt-2 text-lg">
                            {capitalizeWords(
                              getFlatOrUnitNumber(match.property.address_line1 || match.property.address, match.property.city) || match.property.city
                            )}
                          </CardTitle>
                          <CardDescription>
                            {match.property.city}, {match.property.postcode}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          {match.property.rent && (
                            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                              <PoundSterling className="h-5 w-5" />
                              {match.property.rent.toLocaleString()}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">per month</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Property Details */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Bed className="h-4 w-4" />
                          <span>{match.property.bedrooms} beds</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Bath className="h-4 w-4" />
                          <span>{match.property.bathrooms} baths</span>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {match.property.property_type}
                        </Badge>
                      </div>

                      {/* Match Reasons */}
                      <div>
                        <div className="mb-2 text-sm font-medium">Why this matches:</div>
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
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSendToApplicant(match)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send to Applicant
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBookViewing(match.property_id)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Viewing
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <Link to={`/properties/${match.property_id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Property
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Next Steps */}
              {matchingMutation.data.next_steps && matchingMutation.data.next_steps.length > 0 && (
                <Card className="mt-6 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-sm">Recommended Next Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {matchingMutation.data.next_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
