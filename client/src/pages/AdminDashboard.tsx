import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { useConfig } from "../contexts/ConfigContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface User {
  id: number;
  email: string;
  display_name: string | null;
  avatar_path: string | null;
  is_admin: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config, isLoading: isLoadingConfig, updateConfig } = useConfig();
  const [adminChecked, setAdminChecked] = useState(false);

  // Query to check admin access
  const adminCheckQuery = useQuery({
    queryKey: ["/api/admin/check"],
    enabled: !!user && !adminChecked
  });

  useEffect(() => {
    if (adminCheckQuery.isSuccess) {
      setAdminChecked(true);
    } else if (adminCheckQuery.isError) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have admin privileges to access this page."
      });
    }
  }, [adminCheckQuery.isSuccess, adminCheckQuery.isError, toast]);

  // Query to fetch all users
  const { data: userData, isLoading: isLoadingUsers } = useQuery<{ users: User[] }>({
    queryKey: ["/api/admin/users"],
    enabled: adminChecked
  });

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Handle test mode toggle change
  const handleTestModeToggle = async (enabled: boolean) => {
    try {
      await updateConfig({ testModeEnabled: enabled });
      toast({
        title: "Settings Updated",
        description: `Test mode has been ${enabled ? 'enabled' : 'disabled'}.`,
        duration: 3000
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update application settings."
      });
    }
  };

  useEffect(() => {
    // Set page title
    document.title = "Admin Dashboard - Phish Predictions";
  }, []);

  if (adminCheckQuery.isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Checking Admin Access...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Manage users and application settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Admin Access</AlertTitle>
            <AlertDescription>
              You have administrator privileges. With great power comes great responsibility.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Admin User Info</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Email:</div>
                <div>{user?.email}</div>
                <div className="font-medium">Name:</div>
                <div>{user?.display_name || "Not set"}</div>
                <div className="font-medium">User ID:</div>
                <div>{user?.id}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Configure global application settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConfig ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="test-mode">Test Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When disabled, users will not be able to use the "Test Score" button on setlist builder.
                  </p>
                </div>
                <Switch
                  id="test-mode"
                  checked={config.testModeEnabled}
                  onCheckedChange={handleTestModeToggle}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : userData?.users && userData.users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userData.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.display_name || "—"}</TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Badge className="bg-blue-500">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Admin
                          </Badge>
                        ) : "No"}
                      </TableCell>
                      <TableCell>
                        {user.email_verified ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}