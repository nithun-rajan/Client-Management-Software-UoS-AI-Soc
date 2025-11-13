import { useState } from "react";
import {
  ShoppingBag,
  User,
  UserCheck,
  Mail,
  Phone,
  Bed,
  PoundSterling,
  Eye,
  MapPin,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Search,
  X,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApplicants } from "@/hooks/useApplicants";
import { usePropertyMatching, PropertyMatch } from "@/hooks/useMatching";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyTeamAgents } from "@/hooks/useAgents";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";
import BookViewingDialog from "@/components/shared/BookViewingDialog";
import { useMatchSending } from "@/hooks/useMatchSending";
import { useToast } from "@/hooks/use-toast";

export default function Buyers() {
  const navigate = useNavigate();
  const { data: applicants, isLoading } = useApplicants();
  const { user } = useAuth();
  const { data: teamAgents } = useMyTeamAgents();
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);
  const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [bookViewingOpen, setBookViewingOpen] = useState(false);
  const [selectedPropertyForViewing, setSelectedPropertyForViewing] = useState<{ propertyId: string; propertyAddress?: string } | null>(null);
  const { toast } = useToast();
  const { sendMatches, loading: sendingMatches } = useMatchSending();

  const matchingMutation = usePropertyMatching(5, 50);

  // Filter applicants that are buyers (willing_to_buy = true)
  const buyers = useMemo(() => applicants?.filter((a: any) => a.willing_to_buy) || [], [applicants]);

  // Get team agent IDs
  const teamAgentIds = teamAgents?.map(a => a.id) || [];

  // Filter by tab
  const filteredByTab = useMemo(() => {
    if (activeTab === "managed-by-me") {
      return buyers.filter((buyer: any) => buyer.assigned_agent_id === user?.id);
    } else if (activeTab === "managed-by-team") {
      return buyers.filter((buyer: any) => buyer.assigned_agent_id && teamAgentIds.includes(buyer.assigned_agent_id));
    }
    return buyers;
  }, [buyers, activeTab, user?.id, teamAgentIds]);

  // Calculate counts
  const allCount = buyers.length;
  const managedByMeCount = buyers.filter((b: any) => b.assigned_agent_id === user?.id).length;
  const managedByTeamCount = buyers.filter((b: any) => b.assigned_agent_id && teamAgentIds.includes(b.assigned_agent_id)).length;

  // Apply search filter
  const filteredBuyers = useMemo(() => {
    if (!searchQuery) return filteredByTab;
    
    const query = searchQuery.toLowerCase();
    return filteredByTab.filter((buyer: any) => (
      buyer.first_name?.toLowerCase().includes(query) ||
      buyer.last_name?.toLowerCase().includes(query) ||
      buyer.email?.toLowerCase().includes(query) ||
      buyer.phone?.includes(query) ||
      buyer.preferred_locations?.toLowerCase().includes(query) ||
      buyer.status?.toLowerCase().includes(query) ||
      buyer.mortgage_status?.toLowerCase().includes(query) ||
      buyer.buyer_type?.toLowerCase().includes(query)
    ));
  }, [filteredByTab, searchQuery]);
  
  const matchData = matchingMutation.data;

  const handleFindMatches = async (buyerId: string) => {
    setSelectedBuyerId(buyerId);
    try {
      const result = await matchingMutation.mutateAsync(buyerId);
      if (result.matches.length > 0) {
        setMatchesDialogOpen(true);
      }
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Buyers" />
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

  return (
    <div>
      <Header title="Buyers" />
      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, location, status, or mortgage status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All Buyers ({allCount})
            </TabsTrigger>
            <TabsTrigger value="managed-by-me">
              <User className="mr-2 h-4 w-4" />
              Managed by Me ({managedByMeCount})
            </TabsTrigger>
            <TabsTrigger value="managed-by-team">
              <UserCheck className="mr-2 h-4 w-4" />
              Managed by My Team ({managedByTeamCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBuyers.map((buyer) => (
            <Card
              key={buyer.id}
              className="shadow-card transition-shadow hover:shadow-elevated"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary font-bold text-white">
                      {getInitials(buyer.first_name, buyer.last_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">
                          {buyer.first_name} {buyer.last_name}
                        </h3>
                        {buyer.buyer_questions_answered ? (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Questions
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <StatusBadge status={buyer.status} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {buyer.assigned_agent_id === user?.id ? (
                      <Badge className="bg-accent text-white text-xs font-semibold px-2 py-0.5">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Managed by Me
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span className="text-right whitespace-nowrap">
                          {buyer.managed_by_name || "Unassigned"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{buyer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{buyer.phone}</span>
                </div>
                {buyer.desired_bedrooms && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bed className="h-4 w-4 shrink-0" />
                    <span>{buyer.desired_bedrooms} beds</span>
                  </div>
                )}
                {buyer.preferred_locations && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{buyer.preferred_locations}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={() => handleFindMatches(buyer.id)}
                  disabled={matchingMutation.isPending}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {matchingMutation.isPending && selectedBuyerId === buyer.id
                    ? "Finding..."
                    : "Find Matches"}
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/applicants/${buyer.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredBuyers.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title={searchQuery || activeTab !== "all" ? "No buyers found" : "No buyers yet"}
            description={searchQuery || activeTab !== "all" ? "Try adjusting your search or filters to see more results" : "Start building your buyer database by adding your first buyer"}
            actionLabel={searchQuery || activeTab !== "all" ? undefined : "+ Add Buyer"}
            onAction={searchQuery || activeTab !== "all" ? undefined : () => {}}
          />
        )}
      </div>

      {/* Matches Dialog - Similar to Applicants page */}
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
              {/* Buyer Criteria */}
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
                            {match.property.address}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {match.property.city}, {match.property.postcode}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          {(match.property as any).asking_price ? (
                            <>
                              <div className="text-2xl font-bold text-primary">
                                £{((match.property as any).asking_price as number).toLocaleString()}
                              </div>
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
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span>{match.property.bedrooms} beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="capitalize">
                            {match.property.property_type}
                          </span>
                        </div>
                      </div>
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
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                          AI-Generated Message:
                        </div>
                        <p className="text-sm">{match.personalized_message}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={async () => {
                          if (!matchData?.applicant.id) return;
                          try {
                            await sendMatches(
                              matchData.applicant.id,
                              [match.property_id],
                              'email',
                              match.personalized_message
                            );
                            toast({
                              title: "Success",
                              description: "Property match sent to buyer",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error?.message || "Failed to send match",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={sendingMatches}
                      >
                        {sendingMatches ? "Sending..." : "Send to Buyer"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedPropertyForViewing({
                            propertyId: match.property_id,
                            propertyAddress: match.property.address
                          });
                          setBookViewingOpen(true);
                        }}
                      >
                        Book Viewing
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setMatchesDialogOpen(false);
                          navigate(`/properties/${match.property_id}`);
                        }}
                      >
                        View Property
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Book Viewing Dialog */}
      {selectedPropertyForViewing && matchData?.applicant && (
        <BookViewingDialog
          open={bookViewingOpen}
          onOpenChange={setBookViewingOpen}
          propertyId={selectedPropertyForViewing.propertyId}
          applicantId={matchData.applicant.id}
          propertyAddress={selectedPropertyForViewing.propertyAddress}
          applicantName={matchData.applicant.name}
        />
      )}
    </div>
  );
}

