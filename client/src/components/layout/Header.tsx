import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut } from "lucide-react";
import FishIcon from "@/components/icons/FishIcon";
import MetallicFishIcon from "@/components/icons/MetallicFishIcon";

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.display_name) return "U";

    const names = user.display_name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();

    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();

      // Clear any local storage or session storage that might contain auth state
      localStorage.removeItem("auth_state");
      sessionStorage.removeItem("auth_state");

      // Force a slight delay to ensure state updates
      setTimeout(() => {
        setLocation("/login");
      }, 50);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout API call fails, redirect to login page
      setLocation("/login");
    }
  };

  // Simple navigation function
  const navigateTo = (path: string) => {
    // The SetlistContext will handle any scoring mode changes based on URL
    setLocation(path);
  };

  return (
    <header className="m-2 mb-0 px-3">
      <nav className="container mx-auto flex justify-between items-center mb-1 md:mb-4">
        {/* Logo and title section */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigateTo("/")}
        >
          <MetallicFishIcon className="w-[4.8rem] h-[4.8rem] sm:w-[6rem] sm:h-[6rem] md:w-[7.2rem] md:h-[7.2rem] mr-1 text-primary-foreground" />

          {/* Mobile version */}
          <div className="sm:hidden flex flex-col items-start justify-center">
            <h1 className="font-display text-xl leading-tight text-primary font-bold">
              phantasy
            </h1>
            <h1 className="font-display text-xl leading-tight text-primary font-bold -mt-1">
              phish
            </h1>
          </div>

          {/* Desktop version */}
          <h1 className="hidden sm:block font-display text-4xl sm:text-4xl md:text-5xl lg:text-6xl text-primary truncate font-bold">
            phantasy phish
          </h1>
        </div>

        {/* Auth section */}
        <div className="flex items-center">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0"
                >
                  <Avatar className="h-10 w-10 md:h-14 md:w-14 border-2 md:border-[3px] border-primary">
                    {user?.avatar_path ? (
                      <AvatarImage
                        src={user.avatar_path}
                        alt={user.display_name || "User"}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 md:w-56"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {user?.display_name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo("/my-predictions")}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="2" />
                    <path d="m9 14 2 2 4-4" />
                  </svg>
                  <span>points and picks</span>
                </DropdownMenuItem>
                {user?.is_admin && (
                  <DropdownMenuItem onClick={() => navigateTo("/admin")}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 3.32 3.32 2.5 2.5 0 0 0 3.16-1.32c.25-.8.14-1.56-.26-2.24" />
                      <path d="M19.5 12a2.5 2.5 0 0 0-3.16-1.32 2.5 2.5 0 0 0-1.04 4.04 2.5 2.5 0 0 0 3 .42 2.5 2.5 0 0 0 1.2-3.14Z" />
                      <path d="M12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.04-3 2.5 2.5 0 0 0-3.32-3.32 2.5 2.5 0 0 0-3.68 5.88Z" />
                      <path d="M4.5 12a2.5 2.5 0 0 0 3.16 1.32 2.5 2.5 0 0 0 1.04-4.04 2.5 2.5 0 0 0-3-.42 2.5 2.5 0 0 0-1.2 3.14Z" />
                    </svg>
                    <span>admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-2">
              <Button
                size="sm"
                className="mb-1 sm:mb-0 text-xs md:text-sm px-2 md:px-4 min-w-16"
                onClick={() => navigateTo("/register")}
              >
                Register
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs md:text-sm px-2 md:px-4 min-w-16"
                onClick={() => navigateTo("/login")}
              >
                Log in
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
