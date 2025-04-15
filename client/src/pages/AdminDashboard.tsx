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
import { AlertTriangle, CheckCircle2, Settings, BarChart3, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isResettingScores, setIsResettingScores] = useState(false);

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
  
  // Handle prediction score reset
  const handleResetPredictionScores = async () => {
    try {
      setIsResettingScores(true);
      
      const response = await fetch('/api/admin/reset-prediction-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Reset Successful",
          description: "All prediction scores have been reset to null and shows marked as unscored.",
          duration: 5000
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset prediction scores');
      }
    } catch (error) {
      console.error('Error resetting prediction scores:', error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset prediction scores",
        duration: 5000
      });
    } finally {
      setIsResettingScores(false);
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
            <CardTitle>checking admin access...</CardTitle>
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
          <CardTitle className="font-display">admin dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">admin tools</h3>
              <div className="flex flex-wrap gap-4">
                <Link href="/admin/scoring">
                  <Button className="flex items-center gap-2 font-display">
                    <BarChart3 className="h-5 w-5" />
                    scoring management
                  </Button>
                </Link>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 flex items-center gap-2 font-display"
                      disabled={isResettingScores}
                    >
                      {isResettingScores ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-amber-700 border-t-transparent rounded-full mr-1 font-display" />
                          resetting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-5 w-5" />
                          reset scores
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will reset all prediction scores to null and mark all shows as unscored.
                        This is primarily for testing purposes and will affect all users' prediction scores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleResetPredictionScores}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        yes, reset all scores
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            <span className="font-display">application settings</span>
          </CardTitle>
          <CardDescription>
            configure global application settings
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
                  <Label htmlFor="test-mode">test mode</Label>
                  <p className="text-sm text-muted-foreground">
                    when disabled, users will not be able to use the "Test Score" button on setlist builder.
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
          <CardTitle>
             <span className="font-display">user management</span>
            </CardTitle>
          <CardDescription>
            view and manage all users in the system
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
              <p className="text-muted-foreground">no users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}