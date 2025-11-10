import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Users,
  Mail,
  Phone,
  PoundSterling,
  Calendar,
  ArrowLeft,
  Home,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building,
  AlertCircle,
  CheckSquare,
  Wrench,
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
import { useTasks } from "@/hooks/useTasks";
import { useTickets } from "@/hooks/useTickets";

export default function ApplicantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

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
  const [expandedQuestions, setExpandedQuestions] = useState(false);

  // Get all tasks to filter by assigned_to
  const { data: allTasks } = useTasks();
  
  // Get applicant's full name for matching tasks
  const getApplicantFullName = () => {
    if (!applicant) return "";
    return `${applicant.first_name || ""} ${applicant.last_name || ""}`.trim();
  };
  
  // Filter tasks assigned to this applicant
  const assignedTasks = allTasks?.filter(
    (task) => task.assigned_to === getApplicantFullName()
  ) || [];

  // Get all tickets to filter by applicant_id
  const { data: allTickets } = useTickets();
  
  // Filter tickets reported by this applicant
  const reportedTickets = allTickets?.filter(
    (ticket) => ticket.applicant_id === applicant?.id
  ) || [];

  const handleSendEmail = () => {
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

  if (error) {
    return (
      <div>
        <Header title="Applicant Details" />
        <div className="p-6">
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Error loading applicant</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
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
            <Button onClick={() => navigate("/applicants")}>Back to Tenants</Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "?";
  };

  const isBuyer = applicant.willing_to_buy === true && applicant.willing_to_rent !== true;
  const backPath = isBuyer ? "/buyers" : "/applicants";
  const backLabel = isBuyer ? "Back to Buyers" : "Back to Tenants";

  const handleSendQuestionsEmail = () => {
    toast({
      title: "Email Sent",
      description: `Buyer registration questions have been sent to ${applicant?.email || "the buyer"}`,
    });
  };

  const toggleQuestionsExpanded = () => {
    setExpandedQuestions(!expandedQuestions);
  };

  return (
    <div>
      <Header title={isBuyer ? "Buyer Details" : "Tenant Details"} />
      <div className="space-y-6 p-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(backPath)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
          {applicant.status && <StatusBadge status={applicant.status} />}
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
                    {applicant.first_name || ""} {applicant.last_name || ""}
                  </CardTitle>
                  <div className="mt-2 flex items-center gap-2">
                    {applicant.status && <StatusBadge status={applicant.status} />}
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
                  {applicant.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{applicant.email}</div>
                      </div>
                    </div>
                  )}
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
                          {(() => {
                            try {
                              return new Date(applicant.date_of_birth).toLocaleDateString();
                            } catch {
                              return applicant.date_of_birth;
                            }
                          })()}
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
                        {(() => {
                          try {
                            return new Date(applicant.move_in_date).toLocaleDateString();
                          } catch {
                            return applicant.move_in_date;
                          }
                        })()}
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

              {/* Assigned Tasks Section */}
              <div>
                <h3 className="mb-3 font-semibold">Assigned Tasks</h3>
                {assignedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assigned tasks</p>
                ) : (
                  <div className="space-y-2">
                    {assignedTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => navigate("/tasks")}
                        className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{task.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reported Tickets Section */}
              <div>
                <h3 className="mb-3 font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Reported Tickets
                </h3>
                {reportedTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reported tickets</p>
                ) : (
                  <div className="space-y-2">
                    {reportedTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => navigate("/tickets")}
                        className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{ticket.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {ticket.status.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {ticket.urgency}
                            </Badge>
                          </div>
                        </div>
                        {ticket.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {ticket.description}
                          </p>
                        )}
                        {ticket.ticket_category && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Category: {ticket.ticket_category}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
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

            {/* Registration Questions for Buyers */}
            {isBuyer && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Registration Questions</CardTitle>
                    {!applicant.buyer_questions_answered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendQuestionsEmail}
                      >
                        <Mail className="mr-2 h-3 w-3" />
                        Send Questions
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!applicant.buyer_questions_answered ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Buyer has not yet answered registration questions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between"
                        onClick={toggleQuestionsExpanded}
                      >
                        <span className="text-sm font-medium">View Registration Answers</span>
                        {expandedQuestions ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {expandedQuestions && (
                        <div className="space-y-3 rounded-lg bg-muted/50 p-3 text-sm">
                          <div className="grid gap-2">
                            {applicant.move_in_date && (
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <div className="font-medium">Ideal Timeframe</div>
                                  <div className="text-muted-foreground">
                                    {(() => {
                                      try {
                                        return new Date(applicant.move_in_date).toLocaleDateString();
                                      } catch {
                                        return applicant.move_in_date;
                                      }
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                            {(applicant.rent_budget_min || applicant.rent_budget_max) && (
                              <div className="flex items-start gap-2">
                                <PoundSterling className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <div className="font-medium">Budget Range</div>
                                  <div className="text-muted-foreground">
                                    {applicant.rent_budget_min && applicant.rent_budget_max
                                      ? `£${applicant.rent_budget_min.toLocaleString()} - £${applicant.rent_budget_max.toLocaleString()}`
                                      : applicant.rent_budget_min
                                      ? `From £${applicant.rent_budget_min.toLocaleString()}`
                                      : applicant.rent_budget_max
                                      ? `Up to £${applicant.rent_budget_max.toLocaleString()}`
                                      : "Not specified"}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex items-start gap-2">
                              <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <div className="font-medium">Property to Sell</div>
                                <div className="text-muted-foreground">
                                  {applicant.has_property_to_sell ? "Yes" : "No"}
                                  {applicant.has_property_to_sell && applicant.is_chain_free && " (Chain-free)"}
                                </div>
                              </div>
                            </div>
                            {applicant.mortgage_status && (
                              <div className="flex items-start gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <div className="font-medium">Mortgage Status</div>
                                  <div className="text-muted-foreground capitalize">
                                    {applicant.mortgage_status.replace(/_/g, " ")}
                                  </div>
                                </div>
                              </div>
                            )}
                            {applicant.buyer_type && (
                              <div className="flex items-start gap-2">
                                <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <div className="font-medium">Buyer Type</div>
                                  <div className="text-muted-foreground capitalize">
                                    {applicant.buyer_type.replace(/_/g, " ")}
                                  </div>
                                </div>
                              </div>
                            )}
                            {applicant.special_requirements && (
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <div className="font-medium">Special Requirements</div>
                                  <div className="text-muted-foreground">
                                    {applicant.special_requirements}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
