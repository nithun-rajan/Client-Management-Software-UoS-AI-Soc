/**
 * Applicant Funnel Chart Widget
 * 
 * Visual representation of applicants moving through stages:
 * Lead → Viewing → Offer → Completed
 * Uses a bar chart component to show the funnel.
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, TrendingDown } from "lucide-react";
import { useApplicantsForFunnel } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const statusLabels: Record<string, string> = {
  new: "Lead",
  qualified: "Qualified",
  viewing_booked: "Viewing",
  offer_submitted: "Offer",
  offer_accepted: "Accepted",
  let_agreed: "Agreed",
  tenancy_started: "Completed",
  archived: "Archived",
};

export default function ApplicantFunnelWidget() {
  const { data: applicants, isLoading } = useApplicantsForFunnel();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applicant Funnel</CardTitle>
          <CardDescription>Applicants by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  // Group applicants by status
  const statusCounts: Record<string, number> = {};
  applicants?.forEach((applicant) => {
    const status = applicant.status || "new";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Create funnel data in order (always show all stages, even if count is 0)
  const funnelOrder = [
    "new",
    "qualified",
    "viewing_booked",
    "offer_submitted",
    "offer_accepted",
    "let_agreed",
    "tenancy_started",
  ];

  const funnelData = funnelOrder.map((status) => ({
    stage: statusLabels[status] || status,
    count: statusCounts[status] || 0,
  }));

  const totalApplicants = applicants?.length || 0;
  if (totalApplicants === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Applicant Funnel
          </CardTitle>
          <CardDescription>Applicants by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No applicant data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Applicant Funnel
        </CardTitle>
        <CardDescription>Applicants progressing through stages</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="stage" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#667eea" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Total: {applicants?.length || 0} applicants
        </div>
      </CardContent>
    </Card>
  );
}

