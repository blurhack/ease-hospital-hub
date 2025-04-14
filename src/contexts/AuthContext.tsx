
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "doctor" | "staff";
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Sample users data for demonstration
const USERS = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@mediease.com",
    password: "admin123",
    role: "admin" as const,
    avatar: "https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff",
  },
  {
    id: "2",
    name: "Dr. John Smith",
    email: "doctor@mediease.com",
    password: "doctor123",
    role: "doctor" as const,
    avatar: "https://ui-avatars.com/api/?name=John+Smith&background=0D8ABC&color=fff",
  },
  {
    id: "3",
    name: "Staff Member",
    email: "staff@mediease.com",
    password: "staff123",
    role: "staff" as const,
    avatar: "https://ui-avatars.com/api/?name=Staff+Member&background=0D8ABC&color=fff",
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in local storage
    const storedUser = localStorage.getItem("mediease-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const foundUser = USERS.find(
        (u) => u.email === email && u.password === password
      );
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem("mediease-user", JSON.stringify(userWithoutPassword));
        toast({
          title: "Login successful",
          description: `Welcome back, ${foundUser.name}!`,
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mediease-user");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
