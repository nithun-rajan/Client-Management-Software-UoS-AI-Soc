import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get("/api/v1/auth/me");
      return data as User;
    },
    enabled: !!token,
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // OAuth2PasswordRequestForm expects form data
      const formData = new URLSearchParams();
      formData.append("username", credentials.email); // OAuth2 uses 'username' for email
      formData.append("password", credentials.password);
      formData.append("grant_type", "password");

      const { data } = await api.post<AuthResponse>(
        "/api/v1/auth/login",
        formData.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
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

  // Check if authenticated
  const isAuthenticated = !!token && !!user;

  return {
    user,
    token,
    isLoading: isLoadingUser,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}


