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
import { Loader2, CheckCircle, XCircle, BadgeCheck, Crown, Shield, Mail, AlertTriangle, Coins, DollarSign, ArrowRightLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForumAuth } from "@/hooks/useForumAuth";
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

// Inline Request component (verification request page)
function Request() {
  const { user, forumUser, loading: authLoading, emailVerified } = useForumAuth();
  const { toast } = useToast();
  const [has2FA, setHas2FA] = useState<boolean | null>(null);
  const [hasGold, setHasGold] = useState<boolean | null>(null);
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [requestType, setRequestType] = useState<"gold" | "blue" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (forumUser) checkPrerequisites();
  }, [forumUser]);

  const checkPrerequisites = async () => {
    if (!forumUser) return;
    setCheckingStatus(true);
    const { data: twoFaData } = await supabase.from("forum_2fa_settings").select("is_enabled").eq("forum_user_id", forumUser.id).single();
    setHas2FA(twoFaData?.is_enabled === true);
    const { data: goldData } = await supabase.from("forum_gold_checkmarks").select("id").eq("forum_user_id", forumUser.id).single();
    setHasGold(!!goldData);
    const { data: affiliateData } = await supabase.from("forum_affiliates").select("id").eq("affiliate_user_id", forumUser.id).single();
    setIsAffiliate(!!affiliateData);
    const { data: pendingData } = await supabase.from("forum_verification_requests").select("*").eq("forum_user_id", forumUser.id).eq("status", "pending").single();
    setPendingRequest(pendingData);
    setCheckingStatus(false);
  };

  const handleSubmit = async () => {
    if (!forumUser || !requestType) return;
    setSubmitting(true);
    const { error } = await supabase.from("forum_verification_requests").insert({ forum_user_id: forumUser.id, request_type: requestType, reason: reason.trim() || null });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Request Submitted", description: "Your verification request has been submitted for review." }); checkPrerequisites(); }
    setSubmitting(false);
  };

  if (authLoading || checkingStatus) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!user || !forumUser) return <div className="max-w-2xl mx-auto p-6"><div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center"><AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" /><h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Login Required</h1><p className="text-[hsl(var(--bc-text-muted))] mb-4">You must be logged in to request verification.</p><Link to="/login"><Button>Login</Button></Link></div></div>;
  if (hasGold || isAffiliate) return <div className="max-w-2xl mx-auto p-6"><div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center"><div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-500" /></div><h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Already Verified</h1><p className="text-[hsl(var(--bc-text-muted))]">You already have a {hasGold ? "Gold" : "Blue"} checkmark.</p></div></div>;
  if (pendingRequest) return <div className="max-w-2xl mx-auto p-6"><div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center"><div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Loader2 className="w-8 h-8 text-orange-500" /></div><h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Request Pending</h1><p className="text-[hsl(var(--bc-text-muted))]">You have a pending {pendingRequest.request_type === "gold" ? "Gold" : "Blue"} checkmark request.</p></div></div>;

  const meetsRequirements = emailVerified && has2FA;
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8"><h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Request Verification</h1><p className="text-[hsl(var(--bc-text-muted))]">Apply for a verified badge on your profile</p></div>
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Prerequisites</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">{emailVerified ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}<div className="flex-1"><div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" /><span className="text-[hsl(var(--bc-text))]">Verified Email</span></div>{!emailVerified && <p className="text-sm text-red-400 mt-1">Please verify your email in <Link to="/settings" className="underline">settings</Link></p>}</div></div>
          <div className="flex items-center gap-3">{has2FA ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}<div className="flex-1"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" /><span className="text-[hsl(var(--bc-text))]">Two-Factor Authentication Enabled</span></div>{!has2FA && <p className="text-sm text-red-400 mt-1">Please enable 2FA in <Link to="/settings" className="underline">settings</Link></p>}</div></div>
        </div>
      </div>
      {meetsRequirements && (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <button onClick={() => setRequestType("gold")} className={`p-6 rounded-xl border-2 text-left transition-all ${requestType === "gold" ? "border-yellow-500 bg-yellow-500/10" : "border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg-card))] hover:border-yellow-500/50"}`}>
              <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center"><Crown className="w-6 h-6 text-yellow-500" /></div><div><h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Gold Checkmark</h3><span className="text-sm text-yellow-500">Verified Notable</span></div></div>
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">For notable public figures, content creators, and community leaders.</p>
            </button>
            <button onClick={() => setRequestType("blue")} className={`p-6 rounded-xl border-2 text-left transition-all ${requestType === "blue" ? "border-blue-500 bg-blue-500/10" : "border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg-card))] hover:border-blue-500/50"}`}>
              <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center"><BadgeCheck className="w-6 h-6 text-blue-500" /></div><div><h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Blue Checkmark</h3><span className="text-sm text-blue-500">Verified Affiliate</span></div></div>
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">For users affiliated with Gold checkmark holders or notable online presence.</p>
            </button>
          </div>
          {requestType && (
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 space-y-4">
              <div><label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Why should you be verified? (Optional)</label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide links to your social media, content, or other proof..." className="min-h-[100px]" maxLength={500} /><p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">{reason.length}/500</p></div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">{submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : `Submit ${requestType === "gold" ? "Gold" : "Blue"} Request`}</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Inline Convert component (currency exchange page)
function Convert() {
  const { user, forumUser, loading: authLoading, refreshForumUser } = useForumAuth();
  const { toast } = useToast();
  const [direction, setDirection] = useState<"coins-to-cash" | "cash-to-coins">("coins-to-cash");
  const [amount, setAmount] = useState("");
  const [converting, setConverting] = useState(false);

  const coins = forumUser?.coins ?? 0;
  const cash = forumUser?.cash ?? 0;
  const inputAmount = parseInt(amount) || 0;
  const TAX_RATE = 0.10;

  let outputAmount = 0, taxAmount = 0, isValid = false, errorMessage = "";
  if (direction === "coins-to-cash") {
    if (inputAmount >= 100) { const rawCash = inputAmount / 100; taxAmount = Math.floor(rawCash * TAX_RATE * 100) / 100; outputAmount = Math.floor((rawCash - taxAmount) * 100) / 100; isValid = inputAmount <= coins; if (inputAmount > coins) errorMessage = "Insufficient coins"; }
    else if (inputAmount > 0) errorMessage = "Minimum 100 coins required";
  } else {
    if (inputAmount >= 1) { const rawCoins = inputAmount * 100; taxAmount = Math.floor(rawCoins * TAX_RATE); outputAmount = rawCoins - taxAmount; isValid = inputAmount <= cash; if (inputAmount > cash) errorMessage = "Insufficient cash"; }
    else if (inputAmount > 0) errorMessage = "Minimum $1 required";
  }

  const handleConvert = async () => {
    if (!forumUser || !isValid) return;
    setConverting(true);
    let newCoins = coins, newCash = cash;
    if (direction === "coins-to-cash") { newCoins = coins - inputAmount; newCash = cash + Math.floor(outputAmount); }
    else { newCash = cash - inputAmount; newCoins = coins + outputAmount; }
    const { error } = await supabase.from("forum_users").update({ coins: newCoins, cash: newCash }).eq("id", forumUser.id);
    if (error) toast({ title: "Conversion Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Conversion Successful", description: direction === "coins-to-cash" ? `Converted ${inputAmount} coins to $${Math.floor(outputAmount)} cash` : `Converted $${inputAmount} to ${outputAmount} coins` }); setAmount(""); refreshForumUser(); }
    setConverting(false);
  };

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!user || !forumUser) return <div className="max-w-2xl mx-auto p-6"><div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center"><AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" /><h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Login Required</h1><p className="text-[hsl(var(--bc-text-muted))] mb-4">You must be logged in to use the currency exchange.</p><Link to="/login"><Button>Login</Button></Link></div></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8"><h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Currency Exchange</h1><p className="text-[hsl(var(--bc-text-muted))]">Convert between Coins and Cash</p></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center"><Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" /><p className="text-2xl font-bold text-[hsl(var(--bc-text))]">{coins.toLocaleString()}</p><p className="text-sm text-[hsl(var(--bc-text-muted))]">Coins</p></div>
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center"><DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold text-[hsl(var(--bc-text))]">${cash.toLocaleString()}</p><p className="text-sm text-[hsl(var(--bc-text-muted))]">Cash</p></div>
      </div>
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => { setDirection("coins-to-cash"); setAmount(""); }} className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${direction === "coins-to-cash" ? "bg-[hsl(var(--bc-primary))] text-white" : "bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-border))]"}`}><Coins className="w-4 h-4 inline mr-2" />Coins → Cash</button>
          <button onClick={() => { setDirection("cash-to-coins"); setAmount(""); }} className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${direction === "cash-to-coins" ? "bg-[hsl(var(--bc-primary))] text-white" : "bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-border))]"}`}><DollarSign className="w-4 h-4 inline mr-2" />Cash → Coins</button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">{direction === "coins-to-cash" ? "Coins to Convert" : "Cash to Convert"}</label><div className="relative">{direction === "cash-to-coins" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--bc-text-muted))]">$</span>}<Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={direction === "coins-to-cash" ? "Enter coins" : "Enter cash"} min={direction === "coins-to-cash" ? 100 : 1} className={direction === "cash-to-coins" ? "pl-7" : ""} /></div>{errorMessage && <p className="text-sm text-red-400 mt-1">{errorMessage}</p>}</div>
          {inputAmount > 0 && !errorMessage && (
            <div className="bg-[hsl(var(--bc-bg-light))] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">{direction === "coins-to-cash" ? <><Coins className="w-6 h-6 text-yellow-500 mx-auto" /><p className="text-lg font-semibold text-[hsl(var(--bc-text))]">{inputAmount.toLocaleString()}</p></> : <><DollarSign className="w-6 h-6 text-green-500 mx-auto" /><p className="text-lg font-semibold text-[hsl(var(--bc-text))]">${inputAmount.toLocaleString()}</p></>}</div>
                <ArrowRightLeft className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
                <div className="text-center">{direction === "coins-to-cash" ? <><DollarSign className="w-6 h-6 text-green-500 mx-auto" /><p className="text-lg font-semibold text-[hsl(var(--bc-text))]">${outputAmount.toLocaleString()}</p></> : <><Coins className="w-6 h-6 text-yellow-500 mx-auto" /><p className="text-lg font-semibold text-[hsl(var(--bc-text))]">{outputAmount.toLocaleString()}</p></>}</div>
              </div>
              <div className="text-center text-sm text-red-400">Tax (10%): {direction === "coins-to-cash" ? `$${taxAmount.toFixed(2)}` : `${taxAmount} coins`}</div>
            </div>
          )}
          <Button onClick={handleConvert} disabled={!isValid || converting} className="w-full">{converting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting...</> : <><ArrowRightLeft className="w-4 h-4 mr-2" />Convert</>}</Button>
        </div>
      </div>
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4"><div className="flex items-start gap-3"><Info className="w-5 h-5 text-[hsl(var(--bc-primary))] flex-shrink-0 mt-0.5" /><div className="text-sm text-[hsl(var(--bc-text-muted))]"><p className="font-medium text-[hsl(var(--bc-text))] mb-1">Exchange Rates</p><ul className="space-y-1"><li>• 100 Coins = $1 Cash</li><li>• 10% tax on all conversions</li><li>• Minimum: 100 coins or $1</li></ul></div></div></div>
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
              <Route path="convert" element={<Convert />} />
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
