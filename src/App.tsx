import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import ServicesPage from "./pages/ServicesPage";
import AdminPage from "./pages/AdminPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";

const queryClient = new QueryClient();

export default function App() {
  // Fallback para garantir o título correto mesmo se algum deploy estiver servindo um HTML antigo.
  useEffect(() => {
    document.title = "NEWagro - loja online";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/servicos" element={<ServicesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/produto/:id" element={<ProductDetailsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

