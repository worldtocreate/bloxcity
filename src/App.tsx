import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Reserve from "./pages/Reserve";
import FAQ from "./pages/FAQ";
import CheckStatus from "./pages/CheckStatus";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe";
import NotFound from "./pages/NotFound";

// Forum imports
import ForumLayout from "./components/forum/ForumLayout";
import ForumHome from "./pages/forum/ForumHome";
import ForumCategory from "./pages/forum/ForumCategory";
import ForumThread from "./pages/forum/ForumThread";
import ForumNewThread from "./pages/forum/ForumNewThread";
import ForumLogin from "./pages/forum/ForumLogin";
import ForumRegister from "./pages/forum/ForumRegister";
import ForumForgotPassword from "./pages/forum/ForumForgotPassword";
import ForumSettings from "./pages/forum/ForumSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/reserve" element={<Reserve />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/reserve/check-status" element={<CheckStatus />} />
          <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
          
          {/* Forum Routes */}
          <Route path="/forum" element={<ForumLayout />}>
            <Route index element={<ForumHome />} />
            <Route path="category/:slug" element={<ForumCategory />} />
            <Route path="category/:slug/new" element={<ForumNewThread />} />
            <Route path="thread/:threadId" element={<ForumThread />} />
            <Route path="settings" element={<ForumSettings />} />
          </Route>
          <Route path="/forum/login" element={<ForumLogin />} />
          <Route path="/forum/register" element={<ForumRegister />} />
          <Route path="/forum/forgot-password" element={<ForumForgotPassword />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
