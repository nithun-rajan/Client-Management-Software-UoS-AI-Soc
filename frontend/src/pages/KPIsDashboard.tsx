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
  const { data: kpis, isLoading, error } = useKPIs();

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

  if (error) {
    return (
      <div>
        <Header title="Key Performance Indicators" />
        <div className="space-y-6 p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Error loading KPI data</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : "An error occurred"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div>
        <Header title="Key Performance Indicators" />
        <div className="space-y-6 p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No KPI data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Properties for letting by status
  const propertiesByStatus = [
    { name: "Available", value: Number(kpis?.properties_letting?.available || kpis?.properties?.available || 0) },
    { name: "Let By", value: Number(kpis?.properties_letting?.let_by || kpis?.properties?.let_by || 0) },
    { name: "Managed", value: Number(kpis?.properties_letting?.managed || kpis?.properties?.managed || 0) },
  ];

  const totalProperties = propertiesByStatus.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <Header title="Key Performance Indicators" />
      <div className="space-y-6 p-6">
        {/* Property Analytics */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Properties for Letting by Status</CardTitle>
            <CardDescription>Distribution of property statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {totalProperties > 0 ? (
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
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No property data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Properties for Letting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {kpis?.properties_letting?.total || kpis?.properties?.total || 0}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {(kpis?.properties_letting?.available || kpis?.properties?.available || 0)} available
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Properties for Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {kpis?.properties_sale?.total || 0}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Avg: £{(kpis?.properties_sale?.avg_selling_price || 0).toLocaleString()}
              </p>
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
                {Number(kpis?.landlords?.verification_rate || 0).toFixed(0)}%
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {kpis?.landlords?.aml_verified || 0} of {kpis?.landlords?.total || 0}{" "}
                verified
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tenant Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {Number(kpis?.tenants?.qualification_rate || kpis?.applicants?.qualification_rate || 0).toFixed(0)}%
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {kpis?.tenants?.qualified || kpis?.applicants?.qualified || 0} of {kpis?.tenants?.total || kpis?.applicants?.total || 0}{" "}
                qualified
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {kpis?.buyers?.total || 0}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Active buyers</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {kpis?.vendors?.total || 0}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Active vendors</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Rent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                £{Number(kpis?.properties_letting?.avg_rent || kpis?.properties?.avg_rent || 0).toFixed(0)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Per calendar month</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Selling Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600">
                £{Number(kpis?.properties_sale?.avg_selling_price || 0).toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Properties for sale</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
