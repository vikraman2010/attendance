import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Permissions from "./pages/Permissions";
import LocationRegistration from "./pages/LocationRegistration";
import AuthGate from "./components/AuthGate";
import NotFound from "./pages/NotFound";
import { setupWindsurfOfficeLocation } from "./utils/locationSetup";

const queryClient = new QueryClient();

const App = () => {
  // Initialize Windsurf AI Office location on app start
  useEffect(() => {
    setupWindsurfOfficeLocation();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/permissions"
            element={
              <AuthGate>
                <Permissions />
              </AuthGate>
            }
          />
          <Route
            path="/locations"
            element={
              <AuthGate>
                <LocationRegistration />
              </AuthGate>
            }
          />
          <Route
            path="/"
            element={
              <AuthGate>
                <Index />
              </AuthGate>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
