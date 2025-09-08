"use client";

import { useState, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import AuthSection from "@/components/AuthSection";
import DashboardSection from "@/components/DashboardSection";
import { Toaster } from "sonner";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("bearer_token");
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Validate token with backend
        try {
          const response = await fetch("/api/auth/profile", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });

          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Invalid token
            localStorage.removeItem("bearer_token");
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("bearer_token");
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes across tabs and from AuthSection
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bearer_token") {
        if (e.newValue) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    };

    // Listen for custom auth events from components
    const handleAuthChange = (e: CustomEvent) => {
      setIsAuthenticated(e.detail.isAuthenticated);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChanged", handleAuthChange as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChanged", handleAuthChange as EventListener);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader isAuthenticated={isAuthenticated} />
      <main>
        {isAuthenticated ? <DashboardSection /> : <AuthSection />}
      </main>
      <Toaster />
    </div>
  );
}