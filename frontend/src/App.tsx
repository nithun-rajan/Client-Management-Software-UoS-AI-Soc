import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { applyAccentColorFromStorage } from "@/lib/accentColor";
import Sidebar from "./components/layout/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import MyTasks from "./pages/MyTasks";
import Notes from "./pages/Notes";
import Properties from "./pages/Properties";
import Landlords from "./pages/Landlords";
import LandlordDetails from "./pages/LandlordDetails";
import Applicants from "./pages/Applicants";
import ApplicantDetails from "./pages/ApplicantDetails";
import PropertyDetails from "./pages/PropertyDetails";
import Vendors from "./pages/Vendors";
import VendorDetails from "./pages/VendorDetails";
import Buyers from "./pages/Buyers";
import PropertiesForSale from "./pages/PropertiesForSale";
import Messages from "./pages/Messages";
import Search from "./pages/Search";
import KPIsDashboard from "./pages/KPIsDashboard";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import Tickets from "./pages/Tickets";
import Offers from "./pages/Offers";
import Valuations from "./pages/Valuations";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => {
  // Apply accent color on app mount and when theme changes
  useEffect(() => {
    // Small delay to ensure theme is applied first
    const timer = setTimeout(() => {
      applyAccentColorFromStorage();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      themes={["light", "dark"]}
      enableSystem={false}
    >
      <AppContent />
    </ThemeProvider>
  );
};

const AppContent = () => {
  const { theme } = useTheme();
  
  // Re-apply accent color when theme changes
  useEffect(() => {
    if (theme) {
      const timer = setTimeout(() => {
        applyAccentColorFromStorage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex min-h-screen w-full bg-background">
                    <Sidebar />
                    <main className="ml-64 flex-1">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/my-tasks" element={<MyTasks />} />
                        <Route path="/notes" element={<Notes />} />
                        <Route path="/properties" element={<Properties />} />
                        <Route path="/properties/:id" element={<PropertyDetails />} />
                        <Route path="/landlords" element={<Landlords />} />
                        <Route path="/landlords/:id" element={<LandlordDetails />} />
                        <Route path="/applicants" element={<Applicants />} />
                        <Route path="/applicants/:id" element={<ApplicantDetails />} />
                        <Route path="/vendors" element={<Vendors />} />
                        <Route path="/vendors/:id" element={<VendorDetails />} />
                        <Route path="/buyers" element={<Buyers />} />
                        <Route path="/properties-for-sale" element={<PropertiesForSale />} />
                        <Route path="/valuations" element={<Valuations />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/tickets" element={<Tickets />} />
                        <Route path="/offers" element={<Offers />} />
                        <Route path="/kpis" element={<KPIsDashboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
