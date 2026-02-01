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
import ForumFAQ from "./pages/forum/ForumFAQ";
import ForumStaff from "./pages/forum/ForumStaff";
import ForumUsers from "./pages/forum/ForumUsers";
import ForumDashboard from "./pages/forum/ForumDashboard";
import Updates from "./pages/Updates";
import Games from "./pages/forum/Games";
import Market from "./pages/forum/Market";
import Character from "./pages/forum/Character";
import Trading from "./pages/forum/Trading";
import Players from "./pages/forum/Players";
import Groups from "./pages/forum/Groups";
import GroupDetail from "./pages/forum/GroupDetail";
import GroupSettings from "./pages/forum/GroupSettings";
import Friends from "./pages/forum/Friends";
import Achievements from "./pages/forum/Achievements";
import Create from "./pages/forum/Create";
import AcceptAffiliate from "./pages/forum/AcceptAffiliate";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Main Routes with ForumLayout */}
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
              <Route path="players" element={<Players />} />
              <Route path="groups" element={<Groups />} />
              <Route path="group/:slug" element={<GroupDetail />} />
              <Route path="group/:slug/settings" element={<GroupSettings />} />
              <Route path="staff" element={<ForumStaff />} />
              <Route path="updates" element={<Updates />} />
              <Route path="games" element={<Games />} />
              <Route path="market" element={<Market />} />
              <Route path="character" element={<Character />} />
              <Route path="trading" element={<Trading />} />
              <Route path="login" element={<ForumLogin />} />
              <Route path="register" element={<ForumRegister />} />
              <Route path="forgot-password" element={<ForumForgotPassword />} />
              <Route path="faq" element={<ForumFAQ />} />
              <Route path="friends" element={<Friends />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="create" element={<Create />} />
              <Route path="accept-affiliate" element={<AcceptAffiliate />} />
            </Route>

            {/* Admin Route - outside ForumLayout */}
            <Route path="/admin" element={<Admin />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
