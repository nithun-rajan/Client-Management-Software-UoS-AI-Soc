import { useState } from "react";
import { 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  User,
  Briefcase,
  Home,
  DollarSign,
  Calendar,
  MapPin,
  Dog,
  Users,
  RefreshCw
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AICall } from "@/types";
import { useApplyCallData, useSyncAICall, useAutoSyncCall } from "@/hooks/useAICalls";

interface AICallSummaryCardProps {
  call: AICall;
  onApplyData?: () => void;
}

export default function AICallSummaryCard({ call, onApplyData }: AICallSummaryCardProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [extractedDataExpanded, setExtractedDataExpanded] = useState(true);
  
  const applyDataMutation = useApplyCallData();
  const syncCallMutation = useSyncAICall();
  
  // Auto-sync in-progress calls every 15 seconds
  useAutoSyncCall(call.id, call.status);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "no_answer":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "failed":
      case "no_answer":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const handleApplyData = async () => {
    try {
      await applyDataMutation.mutateAsync(call.id);
      if (onApplyData) {
        onApplyData();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSync = async () => {
    try {
      await syncCallMutation.mutateAsync(call.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
              <CardTitle className="text-base">
                AI Call - {formatDate(call.created_at).split(',')[0]}
              </CardTitle>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(call.duration_seconds)}
              </span>
              <span>{formatDate(call.started_at).split(',')[1]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={getStatusColor(call.status)} variant="outline">
              {getStatusIcon(call.status)}
              <span className="ml-1.5 capitalize text-xs">{call.status.replace("_", " ")}</span>
            </Badge>
            {call.status === "completed" && !call.transcript && (
              <Button
                onClick={handleSync}
                disabled={syncCallMutation.isPending}
                size="sm"
                variant="outline"
              >
                {syncCallMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Load
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Summary - Always visible */}
        {call.summary && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-md border">
            {call.summary}
          </div>
        )}

        {/* Message when transcript not loaded yet */}
        {call.status === "completed" && !call.transcript && !call.summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                Click the <strong>"Load"</strong> button above to fetch transcript, extracted data, and recording.
              </div>
            </div>
          </div>
        )}

        {/* View Details Button */}
        {(call.transcript || call.extracted_data || call.recording_url || call.user_context) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => setDetailsExpanded(!detailsExpanded)}
          >
            {detailsExpanded ? (
              <>
                <ChevronUp className="mr-1.5 h-3 w-3" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="mr-1.5 h-3 w-3" />
                View Details (Transcript, Recording & Data)
              </>
            )}
          </Button>
        )}

        {/* Detailed View - Only shown when expanded */}
        {detailsExpanded && (
          <>
            <Separator className="my-3" />
            
            {/* Additional Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {call.completed_at && (
                <div>
                  <div className="text-muted-foreground">Completed</div>
                  <div className="font-medium">{formatDate(call.completed_at).split(',')[1]}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground">Phone</div>
                <div className="font-medium">{call.phone_number}</div>
              </div>
            </div>

            {/* User Context */}
            {call.user_context && (
              <div className="mt-3">
                <div className="text-xs font-medium mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Agent Instructions
                </div>
                <div className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
                  "{call.user_context}"
                </div>
              </div>
            )}

            {/* Extracted Data */}
            {call.extracted_data && Object.keys(call.extracted_data).length > 0 && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-7 px-2 text-xs"
                  onClick={() => setExtractedDataExpanded(!extractedDataExpanded)}
                >
                  <span className="font-medium">📊 Extracted Information</span>
                  {extractedDataExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              
              {extractedDataExpanded && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {call.extracted_data.full_name && (
                      <div className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Name</div>
                          <div className="font-medium truncate">{call.extracted_data.full_name}</div>
                        </div>
                      </div>
                    )}
                    
                    {call.extracted_data.employment_status && (
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Employment</div>
                          <div className="font-medium capitalize">
                            {call.extracted_data.employment_status.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {call.extracted_data.monthly_income && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Monthly Income</div>
                          <div className="font-medium">
                            £{call.extracted_data.monthly_income.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {(call.extracted_data.budget_min || call.extracted_data.budget_max) && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Budget Range</div>
                          <div className="font-medium">
                            £{call.extracted_data.budget_min || 0} - £{call.extracted_data.budget_max || 0}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {call.extracted_data.desired_bedrooms && (
                      <div className="flex items-start gap-2">
                        <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Bedrooms</div>
                          <div className="font-medium">{call.extracted_data.desired_bedrooms}</div>
                        </div>
                      </div>
                    )}
                    
                    {call.extracted_data.preferred_locations && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Preferred Locations</div>
                          <div className="font-medium">
                            {call.extracted_data.preferred_locations.join(", ")}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {call.extracted_data.move_in_date && (
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Move-in Date</div>
                          <div className="font-medium">{call.extracted_data.move_in_date}</div>
                        </div>
                      </div>
                    )}
                    
                    {call.extracted_data.has_pets && (
                      <div className="flex items-start gap-2">
                        <Dog className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Pets</div>
                          <div className="font-medium">
                            {call.extracted_data.pet_type && call.extracted_data.pet_count
                              ? `${call.extracted_data.pet_count} ${call.extracted_data.pet_type}(s)`
                              : "Yes"}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {(call.extracted_data.number_of_adults || call.extracted_data.number_of_children) && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground text-xs">Household</div>
                          <div className="font-medium">
                            {call.extracted_data.number_of_adults || 0} adults, {call.extracted_data.number_of_children || 0} children
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {call.extracted_data.additional_notes && (
                    <div className="pt-2">
                      <div className="text-muted-foreground text-xs mb-1">Additional Notes</div>
                      <div className="text-sm bg-muted/50 p-2 rounded">
                        {call.extracted_data.additional_notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Transcript */}
            {call.transcript && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-7 px-2 text-xs"
                  onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                >
                  <span className="font-medium">📄 Full Transcript</span>
                  {transcriptExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
                
                {transcriptExpanded && (
                  <ScrollArea className="h-[250px] mt-2 rounded border bg-muted/50">
                    <div className="p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {call.transcript}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {/* Recording */}
            {call.recording_url && (
              <div className="mt-3">
                <div className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  🎵 Call Recording
                </div>
                <audio controls className="w-full h-8">
                  <source src={call.recording_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Error Message */}
            {call.error_message && (
              <div className="mt-3 rounded-md bg-red-500/10 border border-red-500/20 p-2">
                <div className="text-xs font-medium text-red-700 mb-0.5">Error</div>
                <div className="text-xs text-red-600">{call.error_message}</div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {(call.status === "completed" || call.status === "in_progress") && detailsExpanded && (
        <CardFooter className="border-t pt-3 pb-3 flex gap-2">
          {call.status === "in_progress" && (
            <Button
              onClick={handleSync}
              disabled={syncCallMutation.isPending}
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              {syncCallMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-3 w-3" />
                  Refresh
                </>
              )}
            </Button>
          )}
          {call.status === "completed" && call.extracted_data && (
            <>
              <Button
                onClick={handleSync}
                disabled={syncCallMutation.isPending}
                variant="outline"
                size="sm"
                className="h-8 px-3"
              >
                {syncCallMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
              <Button
                onClick={handleApplyData}
                disabled={applyDataMutation.isPending}
                size="sm"
                className="flex-1 h-8 text-xs"
              >
                {applyDataMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Download className="mr-1.5 h-3 w-3" />
                    Apply to Profile
                  </>
                )}
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

