import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Mail,
  Phone,
  PoundSterling,
  Calendar,
  ArrowLeft,
  Home,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ApplicantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  console.log("ApplicantDetails rendering, id:", id);

  const { data: applicant, isLoading } = useQuery({
    queryKey: ["applicant", id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/applicants/${id}/`);
      return response.data;
    },
  });
  const handleSendEmail = () => {
    console.log("📧 Sending email for property:", applicant.id);
    toast({
      title: "Email Sent",
      description: `Property details sent to interested parties`,
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
        <Button variant="outline" onClick={() => navigate("/applicants")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applicants
        </Button>
        <Button onClick={handleSendEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Send Details
        </Button>

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
                <h3 className="mb-3 font-semibold">Contact Information</h3>
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
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">
                    {applicant.status.replace("_", " ")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matched Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Home className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Matches</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
