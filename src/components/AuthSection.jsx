"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EyeOff, Eye, LogIn, UserRound, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";

export default function AuthSection() {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // Error states
  const [loginErrors, setLoginErrors] = useState({});
  const [signupErrors, setSignupErrors] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateLoginForm = () => {
    const errors = {};
    
    if (!loginForm.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(loginForm.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!loginForm.password) {
      errors.password = "Password is required";
    }
    
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignupForm = () => {
    const errors = {};
    
    if (!signupForm.name) {
      errors.name = "Name is required";
    }
    
    if (!signupForm.email) {
      errors.email = "Email is required";
    } else if (!validateEmail(signupForm.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!signupForm.password) {
      errors.password = "Password is required";
    } else if (!validatePassword(signupForm.password)) {
      errors.password = "Password must be at least 6 characters long";
    }
    
    if (!signupForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (signupForm.password !== signupForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Dispatch custom auth event
  const dispatchAuthSuccess = () => {
    window.dispatchEvent(new CustomEvent('authChanged', {
      detail: { isAuthenticated: true }
    }));
  };

  // Form handlers
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token using the same key as expected by other components
        localStorage.setItem("bearer_token", data.token);
        
        toast.success("Welcome back! Redirecting to dashboard...");
        
        // Reset forms
        setLoginForm({ email: "", password: "" });
        setLoginErrors({});

        // Dispatch auth success event
        dispatchAuthSuccess();
        
      } else {
        // Handle server errors
        if (data.code === 'INVALID_CREDENTIALS') {
          toast.error("Invalid email or password. Please try again.");
        } else {
          toast.error(data.error || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSignupForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signupForm.name,
          email: signupForm.email,
          password: signupForm.password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token using the same key as expected by other components
        localStorage.setItem("bearer_token", data.token);
        
        toast.success("Account created successfully! Welcome to your dashboard.");
        
        // Reset forms
        setSignupForm({ name: "", email: "", password: "", confirmPassword: "" });
        setSignupErrors({});

        // Dispatch auth success event
        dispatchAuthSuccess();
        
      } else {
        // Handle server errors
        if (data.code === 'EMAIL_EXISTS') {
          setSignupErrors({ email: "Email already exists. Please use a different email." });
        } else if (data.code === 'PASSWORD_TOO_SHORT') {
          setSignupErrors({ password: "Password must be at least 6 characters long." });
        } else {
          toast.error(data.error || "Signup failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-4rem)]">
          {/* Left Column - Branding */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-heading font-bold text-foreground">
                  Next-Level Expense Tracker
                </h1>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Take control of your finances with intelligent expense tracking, 
                automated categorization, and insightful analytics.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-foreground">Smart Categorization</h3>
                  <p className="text-muted-foreground">
                    Automatically organize your expenses with intelligent categorization
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-foreground">Real-time Analytics</h3>
                  <p className="text-muted-foreground">
                    Get instant insights into your spending patterns and financial health
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-foreground">Secure & Private</h3>
                  <p className="text-muted-foreground">
                    Your financial data is encrypted and stored securely
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Auth Forms */}
          <div className="flex flex-col justify-center">
            <Card className="w-full max-w-md mx-auto bg-card border-border shadow-lg">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-heading font-bold text-center">
                  Welcome
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login" className="flex items-center space-x-2">
                      <LogIn className="h-4 w-4" />
                      <span>Login</span>
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="flex items-center space-x-2">
                      <UserRound className="h-4 w-4" />
                      <span>Sign up</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Login Form */}
                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className={loginErrors.email ? "border-destructive" : ""}
                          disabled={isLoading}
                        />
                        {loginErrors.email && (
                          <p className="text-sm text-destructive" role="alert">
                            {loginErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            className={loginErrors.password ? "border-destructive pr-10" : "pr-10"}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {loginErrors.password && (
                          <p className="text-sm text-destructive" role="alert">
                            {loginErrors.password}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Signup Form */}
                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleSignupSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={signupForm.name}
                          onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                          className={signupErrors.name ? "border-destructive" : ""}
                          disabled={isLoading}
                        />
                        {signupErrors.name && (
                          <p className="text-sm text-destructive" role="alert">
                            {signupErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className={signupErrors.email ? "border-destructive" : ""}
                          disabled={isLoading}
                        />
                        {signupErrors.email && (
                          <p className="text-sm text-destructive" role="alert">
                            {signupErrors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signupForm.password}
                            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            className={signupErrors.password ? "border-destructive pr-10" : "pr-10"}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {signupErrors.password && (
                          <p className="text-sm text-destructive" role="alert">
                            {signupErrors.password}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 6 characters long
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={signupForm.confirmPassword}
                            onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                            className={signupErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isLoading}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {signupErrors.confirmPassword && (
                          <p className="text-sm text-destructive" role="alert">
                            {signupErrors.confirmPassword}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            <span>Creating account...</span>
                          </div>
                        ) : (
                          "Create account"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}