import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired" | "used">("loading");
  const token = location.split("/").pop();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${token}`);
        
        if (response.redirected) {
          window.location.href = response.url;
          return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
          if (data.message?.includes("expired")) {
            setStatus("expired");
          } else if (data.message?.includes("already been used")) {
            setStatus("used");
          } else {
            setStatus("error");
          }
          return;
        }
        
        setStatus("success");
        // Redirect to login page after successful verification
        setTimeout(() => {
          setLocation("/login?verified=true");
        }, 3000);
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token, setLocation]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Verifying your email address</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <Alert>
              <div className="flex items-center">
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
                <AlertTitle>Verifying...</AlertTitle>
              </div>
              <AlertDescription>
                Please wait while we verify your email address.
              </AlertDescription>
            </Alert>
          )}

          {status === "success" && (
            <Alert className="bg-green-50 border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <AlertTitle className="text-green-700">Success!</AlertTitle>
              <AlertDescription>
                Your email has been successfully verified. You can now log in to your account.
                Redirecting to login page...
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert className="bg-red-50 border-red-500">
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
              <AlertTitle className="text-red-700">Error</AlertTitle>
              <AlertDescription>
                There was an error verifying your email. The verification link may be invalid.
              </AlertDescription>
            </Alert>
          )}

          {status === "expired" && (
            <Alert className="bg-amber-50 border-amber-500">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
              <AlertTitle className="text-amber-700">Link Expired</AlertTitle>
              <AlertDescription>
                This verification link has expired. Please request a new verification email.
              </AlertDescription>
            </Alert>
          )}

          {status === "used" && (
            <Alert className="bg-amber-50 border-amber-500">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
              <AlertTitle className="text-amber-700">Link Already Used</AlertTitle>
              <AlertDescription>
                This verification link has already been used. If you need to verify your email again, 
                please request a new verification email.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
          {(status === "expired" || status === "error" || status === "used") && (
            <Button asChild>
              <Link href="/resend-verification">Resend Verification</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}