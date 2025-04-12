import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Camera, User } from "lucide-react";

// Profile update schema
const profileSchema = z.object({
  display_name: z.string().min(2, "Display name must be at least 2 characters"),
});

// Password update schema
const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // User type definition
  interface User {
    id: number;
    email: string;
    display_name: string | null;
    avatar_path: string | null;
    created_at: string;
    updated_at: string;
  }

  // Use Auth context instead of direct query
  const { user: userData, isLoading, isAuthenticated } = useAuth();
  const isError = !isLoading && !isAuthenticated;

  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: userData?.display_name || "",
    },
    values: {
      display_name: userData?.display_name || "",
    }
  });

  // Password form setup
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      return apiRequest("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      const { confirmPassword, ...passwordData } = values;
      return apiRequest("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update password",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      
      return apiRequest("/api/auth/avatar", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to upload avatar",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to logout",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Profile form submission handler
  const onProfileSubmit = async (values: ProfileFormValues) => {
    setIsUpdatingProfile(true);
    try {
      await updateProfileMutation.mutateAsync(values);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Password form submission handler
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    try {
      await updatePasswordMutation.mutateAsync(values);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      await uploadAvatarMutation.mutateAsync(file);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!userData?.display_name) return "U";
    
    const names = userData.display_name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>
            You need to be logged in to access this page. Redirecting to login...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24">
              {userData?.avatar_path ? (
                <AvatarImage src={userData.avatar_path} alt={userData.display_name || "Profile"} />
              ) : null}
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={isUploadingAvatar}
            />
          </div>
          <h1 className="text-2xl font-bold">{userData?.display_name || "Your Profile"}</h1>
          <p className="text-muted-foreground">{userData?.email}</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-8">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your display name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Update your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}