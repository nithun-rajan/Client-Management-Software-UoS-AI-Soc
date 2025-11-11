import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
import {
  Users,
  Mail,
  Phone,
  PoundSterling,
  Calendar,
  ArrowLeft,
  Home,
  CreditCard,
  Building,
  AlertCircle,
  CheckSquare,
  Wrench,
  Handshake,
  Pencil,
  Trash2,
  Edit,
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
import { useOffers } from "@/hooks/useOffers";
import NotesSection from "@/components/shared/NotesSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ApplicantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLastContactedDialogOpen, setEditLastContactedDialogOpen] = useState(false);
  const [lastContactedDate, setLastContactedDate] = useState<string>("");

  const { data: applicant, isLoading, error, refetch } = useQuery({
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

  // Get all offers to filter by applicant_id
  const { data: allOffers } = useOffers();
  
  // Filter offers made by this applicant
  const applicantOffers = allOffers?.filter(
    (offer) => offer.applicant_id === applicant?.id
  ) || [];


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

  const updateLastContacted = async () => {
    if (!id) return;
    try {
      await api.put(`/api/v1/applicants/${id}`, {
        last_contacted_at: new Date().toISOString(),
      });
      refetch?.();
    } catch (error) {
      console.error("Failed to update last contacted:", error);
    }
  };

  const handleSendQuestionsEmail = async () => {
    await updateLastContacted();
    toast({
      title: "Email Sent",
      description: `${isBuyer ? "Buyer" : "Tenant"} registration questions have been sent to ${applicant?.email || "the applicant"}`,
    });
  };

  const handleSendEmail = async () => {
    await updateLastContacted();
    toast({
      title: "Email Sent",
      description: `Property details sent to interested parties`,
    });
  };

  // Calculate days since last contacted
  const getDaysSinceLastContacted = () => {
    if (!applicant?.last_contacted_at) return null;
    const lastContacted = new Date(applicant.last_contacted_at);
    const now = new Date();
    // Normalize both dates to midnight to compare only dates, not times
    const lastContactedDate = new Date(lastContacted.getFullYear(), lastContacted.getMonth(), lastContacted.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = todayDate.getTime() - lastContactedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceLastContacted = getDaysSinceLastContacted();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.delete(`/api/v1/applicants/${id}`);
      toast({ title: "Success", description: `${isBuyer ? "Buyer" : "Tenant"} deleted successfully` });
      navigate(backPath);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${isBuyer ? "buyer" : "tenant"}`,
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const formData = new FormData(e.currentTarget);
    try {
      await api.put(`/api/v1/applicants/${id}`, {
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
      });
      toast({ title: "Success", description: `${isBuyer ? "Buyer" : "Tenant"} updated successfully` });
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${isBuyer ? "buyer" : "tenant"}`,
        variant: "destructive",
      });
    }
  };

  const handleEditLastContacted = async () => {
    if (!id || !lastContactedDate) return;
    try {
      const date = new Date(lastContactedDate);
      await api.put(`/api/v1/applicants/${id}`, {
        last_contacted_at: date.toISOString(),
      });
      toast({ title: "Success", description: "Last contacted date updated successfully" });
      setEditLastContactedDialogOpen(false);
      setLastContactedDate("");
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update last contacted date",
        variant: "destructive",
      });
    }
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
          <div className="flex items-center gap-2">
            {applicant.status && <StatusBadge status={applicant.status} />}
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            {/* Contact Info + Property Requirements Card */}
            <Card>
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
                                return format(new Date(applicant.date_of_birth), "dd/MM/yyyy");
                              } catch {
                                return applicant.date_of_birth;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Last Contacted */}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">Last Contacted</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              if (applicant.last_contacted_at) {
                                const date = new Date(applicant.last_contacted_at);
                                setLastContactedDate(date.toISOString().split('T')[0]);
                              }
                              setEditLastContactedDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          {applicant.last_contacted_at ? (
                            <>
                              <div className="font-medium">
                                {format(new Date(applicant.last_contacted_at), "dd/MM/yyyy")}
                              </div>
                              {daysSinceLastContacted !== null && (
                                <div className="text-sm">
                                  (<span style={{ color: `hsl(var(--accent))`, fontWeight: 600 }}>
                                    {daysSinceLastContacted}
                                  </span>{" "}
                                  {daysSinceLastContacted === 1 ? "day" : "days"} ago)
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">Never contacted</div>
                          )}
                        </div>
                      </div>
                    </div>
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
                              return format(new Date(applicant.move_in_date), "dd/MM/yyyy");
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

                {/* Registration Questions for Buyers */}
                {isBuyer && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Registration Questions</h3>
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
                    {!applicant.buyer_questions_answered ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Buyer has not yet answered registration questions
                        </p>
                      </div>
                    ) : (
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
                                      return format(new Date(applicant.move_in_date), "dd/MM/yyyy");
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

                {/* Registration Questions for Tenants */}
                {!isBuyer && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Registration Questions</h3>
                      {!applicant.tenant_questions_answered && (
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
                    {!applicant.tenant_questions_answered ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Tenant has not yet answered registration questions
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-lg bg-muted/50 p-3 text-sm">
                        <div className="grid gap-2">
                          {applicant.move_in_date && (
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <div className="font-medium">Ideal Move-in Date</div>
                                <div className="text-muted-foreground">
                                  {(() => {
                                    try {
                                      return format(new Date(applicant.move_in_date), "dd/MM/yyyy");
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
                          {applicant.desired_bedrooms && (
                            <div className="flex items-start gap-2">
                              <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <div className="font-medium">Desired Bedrooms</div>
                                <div className="text-muted-foreground">
                                  {applicant.desired_bedrooms}
                                </div>
                              </div>
                            </div>
                          )}
                          {applicant.desired_property_type && (
                            <div className="flex items-start gap-2">
                              <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <div className="font-medium">Property Type</div>
                                <div className="text-muted-foreground capitalize">
                                  {applicant.desired_property_type}
                                </div>
                              </div>
                            </div>
                          )}
                          {applicant.has_pets && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <div className="font-medium">Pets</div>
                                <div className="text-muted-foreground">
                                  {applicant.has_pets ? (applicant.pet_details || "Yes") : "No"}
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

            {/* Tasks, Tickets, Offers Card */}
            <div className="space-y-6">
              {/* Assigned Tasks Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Assigned Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Reported Tickets Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Reported Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Offers Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Handshake className="h-5 w-5" />
                    Offers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applicantOffers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No offers</p>
                  ) : (
                    <div className="space-y-2">
                      {applicantOffers.map((offer) => (
                        <button
                          key={offer.id}
                          onClick={() => navigate("/offers")}
                          className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">£{offer.offered_rent.toLocaleString()}</span>
                                {offer.property_id && (
                                  <span className="text-xs text-muted-foreground">
                                    for{" "}
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/properties/${offer.property_id}`);
                                      }}
                                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
                                    >
                                      {offer.property?.address || "Unknown Property"}
                                    </span>
                                  </span>
                                )}
                              </div>
                              {offer.proposed_term_months && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Term: {offer.proposed_term_months} months
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {offer.status}
                            </Badge>
                          </div>
                          {offer.special_conditions && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {offer.special_conditions}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6 flex flex-col h-full">
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
                  <div className="text-center">
                    <Home className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <div className="text-3xl font-bold">0</div>
                    <p className="text-sm text-muted-foreground">Matches</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes Section - matches height of Budget + Matched Properties */}
            <div className="flex-1">
              <NotesSection
                entityType="applicant"
                entityId={id || ""}
                initialNotes={applicant?.notes || ""}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {isBuyer ? "Buyer" : "Tenant"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" name="first_name" defaultValue={applicant?.first_name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" name="last_name" defaultValue={applicant?.last_name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={applicant?.email} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={applicant?.phone} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {isBuyer ? "buyer" : "tenant"}{" "}
              "{applicant?.first_name} {applicant?.last_name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Last Contacted Dialog */}
      <Dialog open={editLastContactedDialogOpen} onOpenChange={setEditLastContactedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Last Contacted Date</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="last_contacted_date">Last Contacted Date</Label>
              <Input
                id="last_contacted_date"
                type="date"
                value={lastContactedDate}
                onChange={(e) => setLastContactedDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditLastContactedDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleEditLastContacted}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
