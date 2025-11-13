import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getAuthRequired } from "@/lib/authSettings";
import { useState, useEffect, useRef } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [authRequired, setAuthRequired] = useState(getAuthRequired());
  const location = useLocation();
  const shouldRedirect = useRef(false);

  // Listen for auth setting changes
  useEffect(() => {
    const handleAuthSettingChange = () => {
      setAuthRequired(getAuthRequired());
    };

    window.addEventListener("auth-setting-changed", handleAuthSettingChange);
    return () => {
      window.removeEventListener("auth-setting-changed", handleAuthSettingChange);
    };
  }, []);

  // Reset redirect flag when location changes
  useEffect(() => {
    shouldRedirect.current = false;
  }, [location.pathname]);

  // If auth is not required, allow access
  if (!authRequired) {
    return <>{children}</>;
  }

  // If auth is required, check authentication status
  // Wait for loading to complete before making decisions
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only redirect once if not authenticated
  if (!isAuthenticated) {
    if (!shouldRedirect.current) {
      shouldRedirect.current = true;
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    // If we've already redirected, show loading to prevent loops
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}


