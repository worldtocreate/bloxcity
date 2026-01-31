// v3
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe";
import NotFound from "./pages/NotFound";

// Forum imports (now main pages)
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
import ForumFAQ from "./pages/forum/ForumFAQ";
import ForumStaff from "./pages/forum/ForumStaff";
import ForumUsers from "./pages/forum/ForumUsers";
import ForumDashboard from "./pages/forum/ForumDashboard";
import Updates from "./pages/Updates";
import Games from "./pages/forum/Games";
import Market from "./pages/forum/Market";
import Character from "./pages/forum/Character";
import Trading from "./pages/forum/Trading";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Main Forum Routes (now at root) */}
            <Route path="/" element={<ForumLayout />}>
              <Route index element={<ForumDashboard />} />
              <Route path="forum" element={<ForumHome />} />
              <Route path="category/:slug" element={<ForumCategory />} />
              <Route path="category/:slug/new" element={<ForumNewThread />} />
              <Route path="thread/:threadId" element={<ForumThread />} />
              <Route path="settings" element={<ForumSettings />} />
              <Route path="user/:username" element={<ForumUserProfile />} />
              <Route path="messages" element={<ForumMessages />} />
              <Route path="users" element={<ForumUsers />} />
            </Route>
            <Route path="/staff" element={<ForumStaff />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/games" element={<Games />} />
            <Route path="/market" element={<Market />} />
            <Route path="/character" element={<Character />} />
            <Route path="/trading" element={<Trading />} />
            <Route path="/login" element={<ForumLogin />} />
            <Route path="/register" element={<ForumRegister />} />
            <Route path="/forgot-password" element={<ForumForgotPassword />} />
            <Route path="/reserve" element={<ForumReserve />} />
            <Route path="/check-status" element={<ForumCheckStatus />} />
            <Route path="/faq" element={<ForumFAQ />} />
            
            {/* Admin & Auth */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
            
            {/* Legacy redirects from old /forum/* paths */}
            <Route path="/forum" element={<Navigate to="/" replace />} />
            <Route path="/forum/category/:slug" element={<Navigate to="/category/:slug" replace />} />
            <Route path="/forum/thread/:threadId" element={<Navigate to="/thread/:threadId" replace />} />
            <Route path="/forum/settings" element={<Navigate to="/settings" replace />} />
            <Route path="/forum/user/:username" element={<Navigate to="/user/:username" replace />} />
            <Route path="/forum/messages" element={<Navigate to="/messages" replace />} />
            <Route path="/forum/login" element={<Navigate to="/login" replace />} />
            <Route path="/forum/register" element={<Navigate to="/register" replace />} />
            <Route path="/forum/forgot-password" element={<Navigate to="/forgot-password" replace />} />
            <Route path="/forum/reserve" element={<Navigate to="/reserve" replace />} />
            <Route path="/forum/check-status" element={<Navigate to="/check-status" replace />} />
            <Route path="/reserve/check-status" element={<Navigate to="/check-status" replace />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
