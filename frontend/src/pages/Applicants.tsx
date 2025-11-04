import { useState } from 'react';
import { Users, Mail, Phone, Bed, PoundSterling, Eye, Pencil, Trash2, Dog, Sparkles, MapPin, Home, Calendar, } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useApplicants } from '@/hooks/useApplicants';
import { usePropertyMatching, PropertyMatch } from '@/hooks/useMatching';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import { Link } from 'react-router-dom';

export default function Applicants() {
  const { data: applicants, isLoading } = useApplicants();
  const [selectedApplicantId, setSelectedApplicantId] = useState<number | null>(null);
  const [matchesDialogOpen, setMatchesDialogOpen] = useState(false);
  
  const matchingMutation = usePropertyMatching(
    selectedApplicantId ? String(selectedApplicantId) : '',
    5,
    50
  );

  const handleFindMatches = async (applicantId: number) => {
    setSelectedApplicantId(applicantId);
    const result = await matchingMutation.mutateAsync();
    if (result.matches.length > 0) {
      setMatchesDialogOpen(true);
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applicants?.map((applicant) => (
            <Card key={applicant.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-white font-bold shrink-0">
                    {getInitials(applicant.first_name, applicant.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {applicant.first_name} {applicant.last_name}
                    </h3>
                    <StatusBadge status={applicant.status} className="mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
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
                      £{applicant.rent_budget_min || 0} - £{applicant.rent_budget_max || 0} pcm
                    </span>
                  </div>
                )}
                {applicant.has_pets && (
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <Dog className="h-4 w-4 shrink-0" />
                    <span>Pet friendly</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={() => handleFindMatches(applicant.id)}
                  disabled={matchingMutation.isPending}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {matchingMutation.isPending && selectedApplicantId === applicant.id ? 'Finding...' : 'Find Matches'}
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
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applicants yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first applicant</p>
            <Button>+ Add Applicant</Button>
          </div>
        )}
      </div>

      {/* Matches Dialog */}
      <Dialog open={matchesDialogOpen} onOpenChange={setMatchesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Property Matches for {matchData?.applicant.name}
            </DialogTitle>
            <DialogDescription>
              Found {matchData?.total_matches} matching properties (AI Confidence: {((matchData?.ai_confidence || 0) * 100).toFixed(0)}%)
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
                    <span className="ml-2 font-medium">{matchData.applicant.criteria.bedrooms}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="ml-2 font-medium">{matchData.applicant.criteria.budget}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Locations:</span>
                    <span className="ml-2 font-medium">{matchData.applicant.criteria.locations}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Move-in:</span>
                    <span className="ml-2 font-medium">{matchData.applicant.criteria.move_in_date || 'Flexible'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Matched Properties */}
              <div className="space-y-4">
                {matchData.matches.map((match: PropertyMatch, index: number) => (
                  <Card key={match.property_id} className="border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={match.score >= 75 ? "default" : "secondary"} className="font-bold">
                              {match.score}% Match
                            </Badge>
                            {index === 0 && <Badge variant="outline">Best Match</Badge>}
                          </div>
                          <CardTitle className="text-lg">{match.property.address}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3" />
                            {match.property.city}, {match.property.postcode}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">£{match.property.rent}</div>
                          <div className="text-xs text-muted-foreground">per month</div>
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
                          <span className="capitalize">{match.property.property_type}</span>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div>
                        <div className="text-sm font-medium mb-2">Why this matches:</div>
                        <div className="flex flex-wrap gap-2">
                          {match.match_reasons.map((reason, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Personalized Message */}
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-muted-foreground mb-1">AI-Generated Message:</div>
                        <p className="text-sm">{match.personalized_message}</p>
                      </div>

                      {/* Viewing Slots */}
                      <div>
                        <div className="text-sm font-medium mb-2 flex items-center gap-1">
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
                      <Button size="sm" variant="outline">
                        View Property
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
