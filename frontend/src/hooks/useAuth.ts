import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState, useEffect, useMemo } from "react";
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: "admin" | "manager" | "agent" | "viewer";
  organization_id: string;
  branch_id?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  organization_id: string;
  branch_id?: string | null;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load token from localStorage on mount
<<<<<<< HEAD
=======
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
    }
<<<<<<< HEAD
  }, []);

  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
=======
    // Mark initial load as complete after checking for token
    setIsInitialLoad(false);
  }, []);

  // Get current user - only query when we have a token
  const { data: user, isLoading: isLoadingUser, error: userError } = useQuery({
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/auth/me");
      return data as User;
    },
    enabled: !!token,
    retry: false,
<<<<<<< HEAD
  });

=======
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent loops
    refetchOnMount: false, // Don't refetch on mount if we already have data
  });

  // Clear token if user query fails with 401 (invalid token) - only once
  useEffect(() => {
    if (userError && (userError as any)?.response?.status === 401 && token) {
      // Only clear if we have a token (avoid clearing on initial load)
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      setToken(null);
      queryClient.setQueryData(["auth", "me"], null);
    }
  }, [userError, token, queryClient]);

>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // OAuth2PasswordRequestForm expects form data
      const formData = new URLSearchParams();
      formData.append("username", credentials.email); // OAuth2 uses 'username' for email
      formData.append("password", credentials.password);
<<<<<<< HEAD
      formData.append("grant_type", "password");

      const { data } = await api.post<AuthResponse>(
=======

      const response = await api.post<AuthResponse>(
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
        "/api/v1/auth/login",
        formData.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
<<<<<<< HEAD
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setToken(data.access_token);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Login successful!");
      navigate("/");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Login failed");
=======
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.access_token && data?.refresh_token) {
        localStorage.setItem("auth_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        setToken(data.access_token);
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        toast.success("Login successful!");
        navigate("/");
      } else {
        throw new Error("Invalid response from server");
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      // Error will be automatically thrown to the caller (Login component)
      // Don't show toast here - let the Login component handle error display
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (registerData: RegisterData) => {
      const { data } = await api.post<User>("/api/v1/auth/register", registerData);
      return data;
    },
    onSuccess: () => {
      toast.success("Registration successful! Please login.");
      navigate("/login");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Registration failed");
    },
  });

  // Logout
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

<<<<<<< HEAD
  // Check if authenticated
  const isAuthenticated = !!token && !!user;
=======
  // Check if authenticated - only true if we have both token and user data
  // Use useMemo to stabilize the value and prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => {
    // If we're still loading the user, return false (not authenticated yet)
    if (isLoadingUser) {
      return false;
    }
    // If we have an error fetching user, we're not authenticated
    if (userError) {
      return false;
    }
    // Only authenticated if we have both token and user data
    return !!(token && user);
  }, [token, user, userError, isLoadingUser]);
  
  // Determine if we're still loading auth state
  // We're loading if: we have a token and we're still fetching the user, OR we're checking for a token on initial load
  const isLoading = isInitialLoad || (!!token && isLoadingUser);
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

  return {
    user,
    token,
<<<<<<< HEAD
    isLoading: isLoadingUser,
=======
    isLoading, // Use the computed isLoading instead of isLoadingUser
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}


