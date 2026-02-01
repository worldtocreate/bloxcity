// v3
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, Link, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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

// Inline Request page to avoid missing-module build failures
function Request() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold text-[hsl(var(--bc-text))]">Request Verification</h1>
      <p className="text-[hsl(var(--bc-text-muted))] mt-2">This page is being prepared.</p>
    </div>
  );
}

// Inline AcceptAffiliate to avoid module persistence issues
function AcceptAffiliate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token) {
      supabase.functions.invoke('admin-manage-users', { body: { action: 'accept_affiliate', requestId: token } })
        .then(({ data, error }) => {
          if (error) {
            setStatus('error');
            setErrorMessage(error.message);
          } else if (data?.alreadyAccepted) {
            setStatus('already');
          } else if (data?.success) {
            setStatus('success');
          } else {
            setStatus('error');
            setErrorMessage(data?.error || 'Unknown error');
          }
        })
        .catch((err) => {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to accept');
        });
    } else {
      setStatus('error');
      setErrorMessage('No token provided');
    }
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-[hsl(var(--bc-primary))] animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Processing...</h1>
            <p className="text-[hsl(var(--bc-text-muted))]">Please wait while we verify your invitation.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">You're now an Affiliate!</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mb-4">
              Congratulations! You now have a blue checkmark <BadgeCheck className="w-4 h-4 text-blue-500 inline" /> next to your username.
            </p>
            <Link to="/" className="inline-block bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-6 py-2 rounded-lg transition">
              Go to Dashboard
            </Link>
          </>
        )}
        {status === 'already' && (
          <>
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Already Accepted</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mb-4">You've already accepted this affiliate invitation.</p>
            <Link to="/" className="inline-block bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-6 py-2 rounded-lg transition">
              Go to Dashboard
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Something went wrong</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mb-4">{errorMessage || 'The invitation link may be invalid or expired.'}</p>
            <Link to="/" className="inline-block bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] px-6 py-2 rounded-lg transition">
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// Inline ForumResetPassword to avoid file/module persistence issues
function ForumResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setHasValidSession(true);
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) setHasValidSession(true);
      setChecking(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSuccess(true);
    toast({
      title: "Password updated",
      description: "Your password has been successfully reset.",
    });

    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/login");
    }, 1500);
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Invalid or Expired Link</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-4">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button onClick={() => navigate("/forgot-password")} className="w-full">
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Password Reset Successful</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))]">Reset Your Password</h1>
          <p className="text-[hsl(var(--bc-text-muted))] text-sm mt-1">Enter your new password below</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

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
              <Route path="reset-password" element={<ForumResetPassword />} />
              <Route path="faq" element={<ForumFAQ />} />
              <Route path="friends" element={<Friends />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="create" element={<Create />} />
              <Route path="request" element={<Request />} />
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
