import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Landlords from "./pages/Landlords";
import Applicants from "./pages/Applicants";
import Search from "./pages/Search";
import KPIsDashboard from "./pages/KPIsDashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PropertyDetails from "./pages/PropertyDetails";
import LandlordDetails from "./pages/LandlordDetails";
import ApplicantDetails from "./pages/ApplicantDetails";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 ml-64">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:id" element={<PropertyDetails />} /> 
              <Route path="/landlords" element={<Landlords />} />
              <Route path="/landlords/:id" element={<LandlordDetails />} />
              <Route path="/applicants" element={<Applicants />} />
              <Route path="/applicants/:id" element={<ApplicantDetails />} />
              <Route path="/search" element={<Search />} />
              <Route path="/kpis" element={<KPIsDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
