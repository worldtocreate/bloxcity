import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
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
import ForumUserProfile from "./pages/forum/ForumUserProfile";
import ForumMessages from "./pages/forum/ForumMessages";
import ForumReserve from "./pages/forum/ForumReserve";
import ForumCheckStatus from "./pages/forum/ForumCheckStatus";

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
          <Route path="/faq" element={<FAQ />} />
          <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
          
          {/* Legacy routes - redirect to forum */}
          <Route path="/reserve" element={<Navigate to="/forum/reserve" replace />} />
          <Route path="/reserve/check-status" element={<Navigate to="/forum/check-status" replace />} />
          
          {/* Forum Routes */}
          <Route path="/forum" element={<ForumLayout />}>
            <Route index element={<ForumHome />} />
            <Route path="category/:slug" element={<ForumCategory />} />
            <Route path="category/:slug/new" element={<ForumNewThread />} />
            <Route path="thread/:threadId" element={<ForumThread />} />
            <Route path="settings" element={<ForumSettings />} />
            <Route path="user/:username" element={<ForumUserProfile />} />
            <Route path="messages" element={<ForumMessages />} />
          </Route>
          <Route path="/forum/login" element={<ForumLogin />} />
          <Route path="/forum/register" element={<ForumRegister />} />
          <Route path="/forum/forgot-password" element={<ForumForgotPassword />} />
          <Route path="/forum/reserve" element={<ForumReserve />} />
          <Route path="/forum/check-status" element={<ForumCheckStatus />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
