import React from 'react';
import { Link, useLocation } from "wouter";
import { Button } from '@/components/ui/button';
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
    await logout();
    setLocation("/login");
  };

  return (
    <header className="mb-8">
      <nav className="flex justify-between items-center mb-6">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => setLocation("/")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" stroke="#3B82F6" fill="#1E1E1E"/>
            <path d="M12 6v6l4 2" stroke="#3B82F6"/>
          </svg>
          <h1 className="font-display text-3xl md:text-4xl text-primary">Phantasy Phish</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    {user?.avatar_path ? (
                      <AvatarImage src={user.avatar_path} alt={user.display_name || "User"} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.display_name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/login")}>
                Log in
              </Button>
              <Button size="sm" onClick={() => setLocation("/register")}>
                Register
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
