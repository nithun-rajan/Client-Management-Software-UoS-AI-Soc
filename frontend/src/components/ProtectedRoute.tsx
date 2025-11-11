<<<<<<< HEAD
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getAuthRequired } from "@/lib/authSettings";
import { useState, useEffect } from "react";
=======
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getAuthRequired } from "@/lib/authSettings";
import { useState, useEffect, useRef } from "react";
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [authRequired, setAuthRequired] = useState(getAuthRequired());
<<<<<<< HEAD
=======
  const location = useLocation();
  const shouldRedirect = useRef(false);
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

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

<<<<<<< HEAD
=======
  // Reset redirect flag when location changes
  useEffect(() => {
    shouldRedirect.current = false;
  }, [location.pathname]);

>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
  // If auth is not required, allow access
  if (!authRequired) {
    return <>{children}</>;
  }

  // If auth is required, check authentication status
<<<<<<< HEAD
=======
  // Wait for loading to complete before making decisions
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

<<<<<<< HEAD
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

=======
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
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
  return <>{children}</>;
}


