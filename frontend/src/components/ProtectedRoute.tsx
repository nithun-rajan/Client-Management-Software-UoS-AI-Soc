import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getAuthRequired } from "@/lib/authSettings";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [authRequired, setAuthRequired] = useState(getAuthRequired());

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

  // If auth is not required, allow access
  if (!authRequired) {
    return <>{children}</>;
  }

  // If auth is required, check authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


