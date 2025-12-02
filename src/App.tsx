import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SOSButton } from "@/components/SOSButton";
import Index from "./pages/Index";
import AboutUs from "./pages/AboutUs";
import FreeIndependent from "./pages/FreeIndependent";
import Exclusive from "./pages/Exclusive";
import TourOperators from "./pages/TourOperators";
import Reviews from "./pages/Reviews";
import Login from "./pages/Login";
import InteractiveMap from "./pages/InteractiveMap";
import AIPlanner from "./pages/AIPlanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-16">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/free-independent" element={<FreeIndependent />} />
                <Route path="/ai-planner" element={<AIPlanner />} />
                <Route path="/exclusive" element={<Exclusive />} />
                <Route path="/tour-operators" element={<TourOperators />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/login" element={<Login />} />
                <Route path="/map" element={<InteractiveMap />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <SOSButton />
          </div>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
