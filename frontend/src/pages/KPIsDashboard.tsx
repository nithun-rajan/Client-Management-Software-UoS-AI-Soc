import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useKPIs } from "@/hooks/useKPIs";
import Header from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#6b7280"];

export default function KPIsDashboard() {
  const { data: kpis, isLoading } = useKPIs();

  if (isLoading) {
    return (
      <div>
        <Header title="Key Performance Indicators" />
        <div className="space-y-6 p-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const propertiesByStatus = [
    { name: "Available", value: kpis?.properties.available || 0 },
    { name: "Let By", value: kpis?.properties.let_by || 0 },
    { name: "Managed", value: kpis?.properties.managed || 0 },
  ];

  return (
    <div>
      <Header title="Key Performance Indicators" />
      <div className="space-y-6 p-6">
        {/* Property Analytics */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Properties by Status</CardTitle>
            <CardDescription>Distribution of property statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertiesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {propertiesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {kpis?.properties.total || 0}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Across all statuses</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Landlord Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {kpis?.landlords.verification_rate.toFixed(0) || 0}%
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {kpis?.landlords.aml_verified || 0} of {kpis?.landlords.total || 0}{" "}
                verified
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Applicant Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {kpis?.applicants.qualification_rate.toFixed(0) || 0}%
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {kpis?.applicants.qualified || 0} of {kpis?.applicants.total || 0}{" "}
                qualified
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
