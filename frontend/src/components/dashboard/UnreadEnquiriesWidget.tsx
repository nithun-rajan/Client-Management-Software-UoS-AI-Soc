/**
 * Unread Enquiries Widget
 * 
 * Shows count and short preview of unread client messages or new enquiries.
 * Option to click through to the messaging panel.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Mail, Phone, Clock } from "lucide-react";
import { useUnreadEnquiries } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const communicationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  call: Phone,
  sms: MessageSquare,
  note: MessageSquare,
};

export default function UnreadEnquiriesWidget() {
  const { data: unreadEnquiries, isLoading } = useUnreadEnquiries();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unread Enquiries</CardTitle>
          <CardDescription>New client messages</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  const enquiries = unreadEnquiries || [];
  const count = enquiries.length;

  if (count === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            Unread Enquiries
          </CardTitle>
          <CardDescription>New client messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No unread enquiries</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-500" />
          Unread Enquiries
        </CardTitle>
        <CardDescription>
          {count} unread message{count !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {enquiries.map((enquiry) => {
            const IconComponent = communicationIcons[enquiry.type?.toLowerCase() || "email"] || MessageSquare;
            const timeAgo = formatDistanceToNow(new Date(enquiry.created_at), {
              addSuffix: true,
            });

            return (
              <div
                key={enquiry.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate("/messages")}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 flex-shrink-0">
                    <IconComponent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {enquiry.subject || "New Enquiry"}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {enquiry.content || "No content"}
                    </p>
                    {enquiry.is_important && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                        Important
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/messages")}
          >
            View All Messages
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

