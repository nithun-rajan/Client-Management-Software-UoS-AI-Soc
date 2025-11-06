import { useParams, useNavigate } from 'react-router-dom';
import { Users, Mail, Phone, ArrowLeft, MapPin, PoundSterling, Bed, MessageSquare, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import api from '@/lib/api';

export default function ApplicantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: applicant, isLoading: applicantLoading } = useQuery({
    queryKey: ['applicant', id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/applicants/${id}/`);
      return response.data;
    },
  });

  const handleSendEmail = () => {
    toast({
      title: 'Email Sent',
      description: `Email sent to ${applicant?.email}`,
    });
  };

  if (applicantLoading) {
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
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Applicant not found</h3>
            <Button onClick={() => navigate('/applicants')}>Back to Applicants</Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      <Header title="Applicant Details" />
      <div className="p-6 space-y-6">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/applicants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applicants
          </Button>
          <Button onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-white text-2xl font-semibold">
                  {getInitials(applicant.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{applicant.name}</CardTitle>
                    <StatusBadge status={applicant.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {applicant.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {applicant.email}
                      </div>
                    )}
                    {applicant.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {applicant.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {applicant.current_address && (
                <div>
                  <h3 className="font-semibold mb-2">Current Address</h3>
                  <p className="text-sm text-muted-foreground">{applicant.current_address}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Search Criteria</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {applicant.min_bedrooms && (
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bedrooms</p>
                        <p className="font-semibold">{applicant.min_bedrooms}+</p>
                      </div>
                    </div>
                  )}
                  {applicant.max_rent && (
                    <div className="flex items-center gap-2">
                      <PoundSterling className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Max Budget</p>
                        <p className="font-semibold">£{applicant.max_rent}</p>
                      </div>
                    </div>
                  )}
                  {applicant.preferred_areas && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Preferred Areas</p>
                        <p className="font-semibold">{applicant.preferred_areas}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(applicant.has_pets || applicant.special_requirements) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Additional Requirements</h3>
                  <div className="space-y-2">
                    {applicant.has_pets && (
                      <div>
                        <Badge>Has Pets</Badge>
                        {applicant.pet_details && (
                          <p className="text-sm text-muted-foreground mt-1">{applicant.pet_details}</p>
                        )}
                      </div>
                    )}
                    {applicant.special_requirements && (
                      <p className="text-sm text-muted-foreground">{applicant.special_requirements}</p>
                    )}
                  </div>
                </div>
              )}

              {applicant.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{applicant.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Right to Rent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {applicant.right_to_rent_verified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Not Verified</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communications</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/messages?applicant_id=${id}`)}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Communications
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Match Properties
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Create Tenancy
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

