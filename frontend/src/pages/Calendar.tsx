import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Building2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewingsQuery, useUpcomingViewings, Viewing } from "@/hooks/useViewings";
import { useProperties } from "@/hooks/useProperties";
import { useApplicants } from "@/hooks/useApplicants";
import { useAgents } from "@/hooks/useAgents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedApplicant, setSelectedApplicant] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get agents for selection
  const { data: agents } = useAgents();
  
  // Common time slots
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return slots;
  }, []);

  // Create viewing mutation
  const createViewing = useMutation({
    mutationFn: async (viewingData: {
      property_id: string;
      applicant_id: string;
      scheduled_date: string;
      duration_minutes?: string;
      assigned_agent?: string;
    }) => {
      const { data } = await api.post("/api/v1/viewings/", viewingData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast({
        title: "Success",
        description: "Viewing scheduled successfully",
      });
      // Reset form
      setSelectedProperty("");
      setSelectedApplicant("");
      setSelectedTime("09:00");
      setSelectedAgent("");
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to schedule viewing",
        variant: "destructive",
      });
    },
  });

  const { data: viewings, isLoading: isLoadingViewings } = useViewingsQuery();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: applicants, isLoading: isLoadingApplicants } = useApplicants();
  const { data: upcomingViewings, isLoading: isLoadingUpcoming } = useUpcomingViewings(30);

  // Get viewings for the current month
  const monthViewings = useMemo(() => {
    if (!viewings) return [];
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // Set end of month to end of day (23:59:59)
    monthEnd.setHours(23, 59, 59, 999);
    
    return viewings.filter((viewing) => {
      const viewingDate = new Date(viewing.scheduled_date);
      return viewingDate >= monthStart && viewingDate <= monthEnd;
    });
  }, [viewings, currentMonth]);

  // Get viewings for a specific date
  const getViewingsForDate = (date: Date) => {
    return monthViewings.filter((viewing) =>
      isSameDay(new Date(viewing.scheduled_date), date)
    );
  };

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad calendar to start on Monday
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const paddedDays = [
    ...Array(paddingDays).fill(null),
    ...calendarDays,
  ];

  const handleSchedule = async () => {
    if (!selectedProperty || !selectedApplicant) {
      toast({
        title: "Error",
        description: "Please select both property and applicant",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time into datetime string
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    createViewing.mutate({
      property_id: selectedProperty,
      applicant_id: selectedApplicant,
      scheduled_date: scheduledDateTime.toISOString(),
      duration_minutes: "30",
      assigned_agent: selectedAgent || undefined,
    });
  };

  const getViewingStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getViewingStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      case "pending":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (isLoadingViewings || isLoadingProperties || isLoadingApplicants) {
    return (
      <div>
        <Header title="Calendar" />
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Skeleton className="h-[600px]" />
            </div>
            <div>
              <Skeleton className="h-[600px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Calendar" hideQuickAdd={true} />
      <div className="p-6 space-y-6">
        {/* Month navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly View</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-muted-foreground p-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {paddedDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="h-24" />;
                    }

                    const dayViewings = getViewingsForDate(day);
                    const isCurrentDay = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    const handleDateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Select the date to show viewings in sidebar
                      setSelectedDate(day);
                      setShowAddForm(false);
                      // Reset form when selecting a new date
                      setSelectedProperty("");
                      setSelectedApplicant("");
                      setSelectedTime("09:00");
                      setSelectedAgent("");
                    };

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={handleDateClick}
                        className={cn(
                          "h-24 border-2 rounded-lg p-1 text-left w-full flex flex-col transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                            : "hover:bg-accent hover:border-primary/50 border-border bg-background"
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm font-medium mb-1",
                            isCurrentDay && !isSelected && "text-primary font-bold",
                            isSelected && "text-primary-foreground font-bold"
                          )}
                        >
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5 overflow-y-auto max-h-16 flex-1">
                          {dayViewings.slice(0, 2).map((viewing) => (
                            <div
                              key={viewing.id}
                              className={cn(
                                "text-[10px] px-1 py-0.5 rounded truncate",
                                getViewingStatusColor(viewing.status || "pending"),
                                isSelected && "opacity-90"
                              )}
                              title={`${viewing.property?.address || "Property"} - ${format(
                                new Date(viewing.scheduled_date),
                                "HH:mm"
                              )}`}
                            >
                              {format(new Date(viewing.scheduled_date), "HH:mm")}
                            </div>
                          ))}
                          {dayViewings.length > 2 && (
                            <div className={cn(
                              "text-[10px] px-1",
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}>
                              +{dayViewings.length - 2} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Viewings Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Viewings */}
            {selectedDate ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      if (!showAddForm) {
                        // Reset form when opening
                        setSelectedProperty("");
                        setSelectedApplicant("");
                        setSelectedTime("09:00");
                        setSelectedAgent("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showAddForm ? "Cancel" : "Add Viewing"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Viewing Form */}
                  {showAddForm && (
                    <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Property *</Label>
                        <Select
                          value={selectedProperty}
                          onValueChange={setSelectedProperty}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a property" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties
                              ?.filter((p) => p.landlord_id && !p.vendor_id)
                              .map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.address_line1 || property.city} - {property.postcode}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Applicant *</Label>
                        <Select
                          value={selectedApplicant}
                          onValueChange={setSelectedApplicant}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an applicant" />
                          </SelectTrigger>
                          <SelectContent>
                            {applicants?.map((applicant) => (
                              <SelectItem key={applicant.id} value={applicant.id}>
                                {applicant.first_name} {applicant.last_name} - {applicant.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Time *</Label>
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-background rounded-lg border">
                          {timeSlots.map((time) => {
                            const isSelected = selectedTime === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                className={cn(
                                  "p-2 border rounded text-xs font-medium transition-all",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "hover:bg-accent border-border"
                                )}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Agent (Optional)</Label>
                        <Select
                          value={selectedAgent || undefined}
                          onValueChange={(value) => setSelectedAgent(value || "")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an agent" />
                          </SelectTrigger>
                          <SelectContent>
                            {agents?.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.first_name} {agent.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleSchedule}
                        disabled={
                          createViewing.isPending ||
                          !selectedProperty ||
                          !selectedApplicant ||
                          !selectedTime
                        }
                        className="w-full"
                      >
                        {createViewing.isPending ? "Scheduling..." : "Schedule Viewing"}
                      </Button>
                    </div>
                  )}

                  {/* Existing Viewings */}
                  <div className="space-y-3">
                    {getViewingsForDate(selectedDate).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No viewings scheduled
                      </p>
                    ) : (
                      getViewingsForDate(selectedDate).map((viewing) => (
                        <div
                          key={viewing.id}
                          className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {format(
                                  new Date(viewing.scheduled_date),
                                  "HH:mm"
                                )}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={getViewingStatusColor(
                                viewing.status || "pending"
                              )}
                            >
                              {getViewingStatusIcon(viewing.status || "pending")}
                              <span className="ml-1 capitalize">
                                {viewing.status || "Pending"}
                              </span>
                            </Badge>
                          </div>
                          {viewing.property && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">
                                {viewing.property.address || "Property"}
                              </span>
                            </div>
                          )}
                          {viewing.applicant && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{viewing.applicant.name}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select a Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Click on a date in the calendar to view and manage viewings
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Viewings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Viewings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingUpcoming ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : upcomingViewings && upcomingViewings.length > 0 ? (
                  upcomingViewings.slice(0, 5).map((viewing) => (
                    <div
                      key={viewing.id}
                      className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedDate(new Date(viewing.scheduled_date));
                        setCurrentMonth(new Date(viewing.scheduled_date));
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(
                                new Date(viewing.scheduled_date),
                                "MMM d, HH:mm"
                              )}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={getViewingStatusColor(
                            viewing.status || "pending"
                          )}
                        >
                          {getViewingStatusIcon(viewing.status || "pending")}
                        </Badge>
                      </div>
                      {viewing.property && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">
                            {viewing.property.address || "Property"}
                          </span>
                        </div>
                      )}
                      {viewing.applicant && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {viewing.applicant.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming viewings
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}
