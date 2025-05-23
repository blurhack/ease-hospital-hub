
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

// Layout
import AppLayout from "@/components/layout/AppLayout";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SqlConsole from "@/pages/SqlConsole";
import RoomsManagement from "@/pages/RoomsManagement";
import Appointments from "@/pages/Appointments";
import Medications from "@/pages/Medications";
import Billing from "@/pages/Billing";
import Doctors from "@/pages/Doctors";
import Analytics from "@/pages/Analytics";
import Patients from "@/pages/Patients";
import Reports from "@/pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sql-console" element={<SqlConsole />} />
                <Route path="/rooms" element={<RoomsManagement />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/medications" element={<Medications />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/reports" element={<Reports />} />
                
                {/* Add these routes as placeholders for now */}
                <Route path="/profile" element={<ComingSoon title="User Profile" />} />
                <Route path="/settings" element={<ComingSoon title="Settings" />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Placeholder component for routes that are not yet implemented
const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
    <h1 className="text-2xl font-bold mb-2">{title}</h1>
    <p className="text-muted-foreground mb-6">
      This section is coming soon. We're working hard to implement it!
    </p>
    <div className="w-16 h-1 bg-mediease-500 rounded-full mb-6"></div>
    <p className="text-sm text-muted-foreground max-w-md">
      In the meantime, feel free to explore the Dashboard and other available features for a preview of the system's capabilities.
    </p>
  </div>
);

export default App;
