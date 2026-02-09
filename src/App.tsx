// v3
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, Link, useNavigate, Outlet, useOutletContext, useParams } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, BadgeCheck, Crown, Shield, Mail, AlertTriangle, Coins, DollarSign, ArrowRightLeft, Info, User, Lock as LockIcon, Gamepad2, FileText, Lock, Users, Store, Plus, Calendar, Image } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAvatar from "@/components/forum/UserAvatar";
import MembershipBadge from "@/components/forum/MembershipBadge";
import UserLevelBadge from "@/components/forum/UserLevelBadge";
import VerifiedBadge from "@/components/forum/VerifiedBadge";
import TwoFactorSetup from "@/components/forum/TwoFactorSetup";
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

// Inlined Maintenance page to avoid module resolution issues
function Maintenance() {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/';
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#efefef] font-['Asap'] text-[#404040]">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="mt-[100px] flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="hidden md:block md:w-5/12">
            <img src="/builder.png" alt="Builder" className="w-full max-w-[400px]" />
          </div>
          <div className="w-full md:w-7/12 text-center md:text-left">
            <h2 className="text-[2.92rem] leading-[110%] font-semibold mt-0 md:mt-[75px] mb-4">
              BLOX City is Currently Offline
            </h2>
            <div className="text-[20px] mb-6">
              BLOX City is offline for maintenance and upgrades to improve your browsing experience. 
              We'll redirect you when we are finished. Please check back soon!
            </div>
            <div className="text-sm text-[#666] mb-6">
              Page will auto-refresh in {countdown} seconds...
            </div>
            <div className="text-center">
              <div className="text-[25px] font-medium mb-2">Follow us on Social Media!</div>
              <div className="flex justify-center gap-6 text-[40px]">
                <a href="https://discord.gg/bloxcity" target="_blank" rel="noopener noreferrer" className="text-[#7289da] hover:opacity-80 transition-opacity" aria-label="Discord">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                </a>
                <a href="https://twitter.com/bloxcity" target="_blank" rel="noopener noreferrer" className="text-[#1da1f2] hover:opacity-80 transition-opacity" aria-label="Twitter">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="https://youtube.com/@bloxcity" target="_blank" rel="noopener noreferrer" className="text-[#ff0000] hover:opacity-80 transition-opacity" aria-label="YouTube">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline error pages
function Error403() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[hsla(var(--bc-accent),0.1)] flex items-center justify-center">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Error 403: You are not allowed to access this resource.</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-6">You don't have permission to view this page.</p>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition font-medium">
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}

function Error419() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[hsla(var(--bc-accent),0.1)] flex items-center justify-center">
            <span className="text-4xl">⏱️</span>
          </div>
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Error 419: Authentication timeout.</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-6">Try reloading the page and trying again.</p>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition font-medium">
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}

function Error500() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[hsla(var(--bc-accent),0.1)] flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Error 500: Something went wrong on our end.</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-6">Please try again later.</p>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition font-medium">
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureDisabled({ title = 'Feature Disabled' }: { title?: string }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[hsla(var(--bc-accent),0.15)] flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-[hsl(var(--bc-accent))]" />
          </div>
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">{title}</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">This feature is currently disabled.</p>
        </div>
      </div>
    </div>
  );
}

// Inline Bugs/Blog pages to avoid production module resolution issues
function Bugs() {
  const { forumUser, loading: authLoading } = useForumAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (forumUser) fetchData();
  }, [forumUser]);

  // Subscribe to realtime updates for bug status changes
  useEffect(() => {
    if (!forumUser) return;
    
    const channel = supabase
      .channel('bug-reports-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bug_reports', filter: `forum_user_id=eq.${forumUser.id}` },
        (payload) => {
          setReports(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
        }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [forumUser]);

  const fetchData = async () => {
    if (!forumUser) return;
    setLoading(true);
    const { data: countData } = await supabase.rpc('get_bug_report_count_today', { p_forum_user_id: forumUser.id });
    setReportCount(countData || 0);
    const { data } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('forum_user_id', forumUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setReports(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!forumUser || !title.trim() || !description.trim()) return;
    if (reportCount >= 5) {
      toast({ title: 'Daily limit reached', description: 'You can only submit 5 bug reports per day.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('bug_reports').insert({ forum_user_id: forumUser.id, title: title.trim(), description: description.trim(), status: 'received' });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Bug report submitted!', description: 'Thank you for helping improve BLOX City.' });
      setTitle('');
      setDescription('');
      setShowCreate(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open': return { label: 'Received', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: '📩' };
      case 'in_review': return { label: 'Investigating', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: '🔍' };
      case 'fixed': return { label: 'Patched', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: '✅' };
      case 'closed': return { label: 'Closed', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: '🔒' };
      default: return { label: status, color: 'bg-gray-500/10 text-gray-600', icon: '📝' };
    }
  };

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  
  if (!forumUser) return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Login Required</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-4">You must be logged in to submit bug reports.</p>
        <Link to="/login"><Button>Login</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-primary-dark))] rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🐛 Bug Reports
            </h1>
            <p className="text-white/80 mt-1">Help us squash bugs and improve BLOX City</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold">{reportCount}/5</div>
              <div className="text-xs text-white/70">Reports today</div>
            </div>
            <Button 
              onClick={() => setShowCreate(true)} 
              disabled={reportCount >= 5}
              className="bg-white text-[hsl(var(--bc-primary))] hover:bg-white/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Report Bug
            </Button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-xl">🐛</div>
              <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Submit Bug Report</h2>
            </div>
            <div>
              <Label className="text-[hsl(var(--bc-text))]">Title</Label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Brief description of the bug" 
                maxLength={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[hsl(var(--bc-text))]">Description</Label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Steps to reproduce, expected behavior, screenshots, etc." 
                className="min-h-[140px] mt-1" 
                maxLength={2000}
              />
              <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">{description.length}/2000 characters</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !description.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--bc-bg-light))] flex items-center justify-center mx-auto mb-4 text-3xl">
            🔍
          </div>
          <h3 className="font-semibold text-[hsl(var(--bc-text))] text-lg">No bug reports yet</h3>
          <p className="text-[hsl(var(--bc-text-muted))] mt-2 max-w-sm mx-auto">
            Found something that doesn't work right? Click "Report Bug" to let us know and help improve the platform.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-[hsl(var(--bc-text-muted))] uppercase tracking-wide">Your Reports</h2>
          <div className="grid gap-4">
            {reports.map((report) => {
              const status = getStatusInfo(report.status);
              return (
                <div 
                  key={report.id} 
                  className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-5 hover:border-[hsl(var(--bc-primary))/30] transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{status.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                          {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[hsl(var(--bc-text))]">{report.title}</h3>
                      <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-1 line-clamp-2">{report.description}</p>
                      {report.admin_notes && (
                        <div className="mt-3 p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg">
                          <p className="text-xs font-medium text-[hsl(var(--bc-text-muted))] mb-1">Admin Response:</p>
                          <p className="text-sm text-[hsl(var(--bc-text))]">{report.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select(`
        id, title, slug, excerpt, thumbnail_url, published_at, 
        author:author_id(id, username, avatar_url, is_verified),
        collaborators:blog_post_collaborators(
          forum_user:forum_user_id(id, username, avatar_url, is_verified)
        )
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;

  // Get featured post (first/latest post)
  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-primary-dark))] flex items-center justify-center text-white">
            <FileText className="w-5 h-5" />
          </div>
          Blog
        </h1>
        <p className="text-[hsl(var(--bc-text-muted))] mt-2">News, updates, and announcements from BLOX City</p>
      </div>

      {posts.length === 0 ? (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--bc-bg-light))] flex items-center justify-center mx-auto mb-4 text-3xl">
            📝
          </div>
          <h3 className="font-semibold text-[hsl(var(--bc-text))] text-lg">No posts yet</h3>
          <p className="text-[hsl(var(--bc-text-muted))] mt-2">Check back soon for news and updates!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Post */}
          {featuredPost && (
            <Link 
              to={`/blog/${featuredPost.slug}`} 
              className="block group"
            >
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl overflow-hidden hover:border-[hsl(var(--bc-primary))] transition-all hover:shadow-lg">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-video md:aspect-auto">
                    {featuredPost.thumbnail_url ? (
                      <img 
                        src={featuredPost.thumbnail_url} 
                        alt={featuredPost.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-primary-dark))] flex items-center justify-center">
                        <FileText className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 text-xs font-semibold bg-[hsl(var(--bc-primary))] text-white rounded-full">
                        Latest
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition mb-3">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-[hsl(var(--bc-text-muted))] mb-4 line-clamp-3">{featuredPost.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-auto">
                      {featuredPost.author?.avatar_url ? (
                        <img src={featuredPost.author.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-bg-light))] flex items-center justify-center">
                          <User className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--bc-text))] flex items-center gap-1">
                          {featuredPost.author?.username || 'BLOX City'}
                          {featuredPost.author?.is_verified && <VerifiedBadge size="sm" />}
                        </p>
                        <p className="text-xs text-[hsl(var(--bc-text-muted))] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                        </p>
                      </div>
                      {/* Collaborators */}
                      {featuredPost.collaborators && featuredPost.collaborators.length > 0 && (
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-xs text-[hsl(var(--bc-text-muted))]">with</span>
                          <div className="flex -space-x-1">
                            {featuredPost.collaborators.slice(0, 3).map((collab: any, i: number) => (
                              <div key={i} className="relative">
                                {collab.forum_user?.avatar_url ? (
                                  <img src={collab.forum_user.avatar_url} alt="" className="w-6 h-6 rounded-full border-2 border-[hsl(var(--bc-bg-card))]" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-[hsl(var(--bc-bg-light))] border-2 border-[hsl(var(--bc-bg-card))] flex items-center justify-center">
                                    <User className="w-3 h-3 text-[hsl(var(--bc-text-muted))]" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Other Posts Grid */}
          {otherPosts.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-[hsl(var(--bc-text-muted))] uppercase tracking-wide">More Posts</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {otherPosts.map((post) => (
                  <Link 
                    key={post.id} 
                    to={`/blog/${post.slug}`} 
                    className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden hover:border-[hsl(var(--bc-primary))] transition-all group hover:shadow-md"
                  >
                    <div className="aspect-video relative">
                      {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--bc-bg-light))] to-[hsl(var(--bc-bg))] flex items-center justify-center">
                          <FileText className="w-10 h-10 text-[hsl(var(--bc-text-muted))]" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-2 line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-xs text-[hsl(var(--bc-text-muted))]">
                        {post.author?.avatar_url && <img src={post.author.avatar_url} alt="" className="w-5 h-5 rounded-full" />}
                        <span className="flex items-center gap-1">
                          {post.author?.username || 'Unknown'}
                          {post.author?.is_verified && <VerifiedBadge size="sm" />}
                        </span>
                        {post.collaborators && post.collaborators.length > 0 && (
                          <span className="flex items-center gap-1">
                            +{post.collaborators.length}
                          </span>
                        )}
                        <span>•</span>
                        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select(`
        *, 
        author:author_id(id, username, avatar_url, is_verified),
        collaborators:blog_post_collaborators(
          forum_user:forum_user_id(id, username, avatar_url, is_verified)
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    setPost(data);
    setLoading(false);
  };

  // Convert content to properly formatted HTML with paragraphs
  const formatContent = (content: string) => {
    // Always split by double newlines to create paragraphs
    // This preserves any inline HTML like <b> while adding proper paragraph structure
    return content
      .split(/\n\n+/)
      .map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        // Convert single newlines within paragraph to <br/>
        return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
      })
      .filter(p => p)
      .join('\n');
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  
  if (!post) return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[hsl(var(--bc-bg-light))] flex items-center justify-center mx-auto mb-4 text-3xl">
        📄
      </div>
      <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Post Not Found</h1>
      <p className="text-[hsl(var(--bc-text-muted))] mt-2">This blog post doesn't exist or has been removed.</p>
      <Link to="/blog" className="mt-4 inline-block text-[hsl(var(--bc-primary))] hover:underline">← Back to Blog</Link>
    </div>
  );

  return (
    <article className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Back Button */}
      <Link to="/blog" className="inline-flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition mb-6">
        ← Back to Blog
      </Link>
      
      {/* Thumbnail */}
      {post.thumbnail_url && (
        <div className="rounded-2xl overflow-hidden mb-8">
          <img src={post.thumbnail_url} alt={post.title} className="w-full aspect-video object-cover" />
        </div>
      )}
      
      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--bc-text))] leading-tight mb-6">
        {post.title}
      </h1>
      
      {/* Author & Date */}
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[hsl(var(--bc-border))]">
        {post.author?.avatar_url ? (
          <img src={post.author.avatar_url} alt="" className="w-12 h-12 rounded-full" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-primary-dark))] flex items-center justify-center text-white font-semibold">
            {(post.author?.username || 'B')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-1.5">
            {post.author?.username || 'BLOX City'}
            {post.author?.is_verified && <VerifiedBadge size="sm" />}
          </p>
          <p className="text-sm text-[hsl(var(--bc-text-muted))] flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date unknown'}
          </p>
        </div>
        {/* Collaborators */}
        {post.collaborators && post.collaborators.length > 0 && (
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-xs text-[hsl(var(--bc-text-muted))] font-medium">Collaborators</p>
              <div className="flex -space-x-2 mt-1">
                {post.collaborators.map((collab: any, i: number) => (
                  <div key={i} className="relative group/collab">
                    {collab.forum_user?.avatar_url ? (
                      <img 
                        src={collab.forum_user.avatar_url} 
                        alt={collab.forum_user?.username} 
                        className="w-8 h-8 rounded-full border-2 border-[hsl(var(--bc-bg-card))]" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-bg-light))] border-2 border-[hsl(var(--bc-bg-card))] flex items-center justify-center">
                        <User className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
                      </div>
                    )}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg text-xs font-medium text-[hsl(var(--bc-text))] whitespace-nowrap opacity-0 group-hover/collab:opacity-100 transition pointer-events-none flex items-center gap-1">
                      {collab.forum_user?.username}
                      {collab.forum_user?.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div 
        className="prose prose-lg max-w-none 
          prose-headings:text-[hsl(var(--bc-text))] prose-headings:font-bold
          prose-p:text-[hsl(var(--bc-text))] prose-p:leading-relaxed
          prose-a:text-[hsl(var(--bc-primary))] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-[hsl(var(--bc-text))]
          prose-li:text-[hsl(var(--bc-text))]
          prose-blockquote:border-l-[hsl(var(--bc-primary))] prose-blockquote:text-[hsl(var(--bc-text-muted))]
          prose-code:text-[hsl(var(--bc-primary))] prose-code:bg-[hsl(var(--bc-bg-light))] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          [&_p]:mb-4 [&_p]:last:mb-0"
        dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} 
      />
      
      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-[hsl(var(--bc-border))]">
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))] rounded-lg hover:bg-[hsl(var(--bc-primary))] hover:text-white transition"
        >
          ← More Posts
        </Link>
      </div>
    </article>
  );
}

// NOTE: Full g0dfrey panel inlined to avoid production module resolution issues.
const AUTHORIZED_USERNAMES = ['soba', 'dylan'];

function GodfreyPanel() {
  const { forumUser, loading } = useForumAuth();
  const navigate = useNavigate();

  const { toast } = useToast();

  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; username: string; coins: number; cash: number }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
  const [coins, setCoins] = useState('');
  const [cash, setCash] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLoggedIn = !!forumUser;
  const isAuthorized = forumUser && AUTHORIZED_USERNAMES.includes(forumUser.username.toLowerCase());

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (forumUser && !isAuthorized) {
      navigate('/');
      return;
    }
    if (forumUser && isAuthorized) {
      checkPin();
    }
  }, [loading, isLoggedIn, forumUser, isAuthorized]);

  const hashPinValue = async (pinValue: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pinValue + 'godfrey_panel_salt_v1');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const checkPin = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('godfrey_panel_pins')
      .select('id')
      .eq('forum_user_id', forumUser.id)
      .maybeSingle();
    setHasPin(!!data);
  };

  const setupPin = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast({ title: 'PIN must be exactly 4 digits', variant: 'destructive' });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: 'PINs do not match', variant: 'destructive' });
      return;
    }
    if (!forumUser) return;
    const pinHash = await hashPinValue(newPin);
    const { error } = await supabase.from('godfrey_panel_pins').insert({ forum_user_id: forumUser.id, pin_hash: pinHash });
    if (error) {
      toast({ title: 'Failed to set PIN', description: error.message, variant: 'destructive' });
      return;
    }
    setHasPin(true);
    setIsAuthed(true);
    toast({ title: 'PIN set successfully' });
  };

  const verifyPin = async () => {
    if (!forumUser) return;
    if (pin.length !== 4) {
      toast({ title: 'Enter your 4-digit PIN', variant: 'destructive' });
      return;
    }
    const pinHash = await hashPinValue(pin);
    const { data } = await supabase.from('godfrey_panel_pins').select('pin_hash').eq('forum_user_id', forumUser.id).maybeSingle();
    if (data?.pin_hash === pinHash) {
      setIsAuthed(true);
      toast({ title: 'Access granted' });
    } else {
      toast({ title: 'Invalid PIN', variant: 'destructive' });
    }
  };

  const searchUsers = async () => {
    const q = query.trim();
    if (!q) return;
    const { data } = await supabase.from('forum_users').select('id,username,coins,cash').ilike('username', `%${q}%`).limit(10);
    setResults((data as any) || []);
  };

  const award = async () => {
    if (!forumUser || !selectedUser) return;
    const c = parseInt(coins || '0', 10) || 0;
    const k = parseInt(cash || '0', 10) || 0;
    if (c <= 0 && k <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    if (c > 1000 || k > 1000) {
      toast({ title: 'Max is 1000 per currency', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('godfrey-award-currency', {
        body: { recipientId: selectedUser.id, coins: c, cash: k, granterId: forumUser.id },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: data.error, variant: 'destructive' });
      } else {
        toast({ title: `Awarded ${c} coins and ${k} cash to ${selectedUser.username}` });
        setSelectedUser(null);
        setCoins('');
        setCash('');
        setResults([]);
        setQuery('');
      }
    } catch (e: any) {
      toast({ title: 'Award failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Access denied
  if (!isLoggedIn || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-6">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-[hsl(var(--bc-text-muted))]" />
          <p className="text-[hsl(var(--bc-text))]">Access denied.</p>
        </div>
      </div>
    );
  }

  // Loading PIN state
  if (hasPin === null) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }

  // Setup PIN
  if (!hasPin) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-6">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center gap-2 mb-6">
            <LockIcon className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
            <h1 className="text-xl font-bold text-[hsl(var(--bc-text))]">Set g0dfrey PIN</h1>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-[hsl(var(--bc-text))]">New 4-digit PIN</Label>
              <Input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="mt-1" />
            </div>
            <div>
              <Label className="text-[hsl(var(--bc-text))]">Confirm PIN</Label>
              <Input type="password" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} className="mt-1" />
            </div>
            <Button className="w-full" onClick={setupPin}>Save PIN</Button>
          </div>
        </div>
      </div>
    );
  }

  // Verify PIN
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center p-6">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
            <h1 className="text-xl font-bold text-[hsl(var(--bc-text))]">The g0dfrey panel</h1>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-[hsl(var(--bc-text))]">Enter PIN</Label>
              <Input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && verifyPin()} className="mt-1" />
            </div>
            <Button className="w-full" onClick={verifyPin}>Unlock</Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated panel
  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-yellow-500" />
            <h1 className="text-xl font-bold text-[hsl(var(--bc-text))]">The g0dfrey panel</h1>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search username…" onKeyDown={(e) => e.key === 'Enter' && searchUsers()} />
              <Button variant="secondary" onClick={searchUsers}><User className="w-4 h-4" /></Button>
            </div>
            {results.length > 0 && (
              <div className="border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden">
                {results.map((u) => (
                  <button key={u.id} type="button" onClick={() => setSelectedUser(u)} className={`w-full text-left px-4 py-3 border-b border-[hsl(var(--bc-border))] last:border-b-0 hover:bg-[hsl(var(--bc-bg-light))] ${selectedUser?.id === u.id ? 'bg-[hsl(var(--bc-bg-light))]' : ''}`}>
                    <span className="font-medium text-[hsl(var(--bc-text))]">{u.username}</span>
                    <span className="text-sm text-[hsl(var(--bc-text-muted))] ml-2">({u.coins} coins, {u.cash} cash)</span>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="bg-[hsl(var(--bc-bg-light))] rounded-lg p-4 space-y-4">
                <p className="text-[hsl(var(--bc-text))]">Awarding to: <strong>{selectedUser.username}</strong></p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1 text-[hsl(var(--bc-text))]"><Coins className="w-4 h-4 text-yellow-500" /> Coins (max 1000)</Label>
                    <Input type="number" min={0} max={1000} value={coins} onChange={(e) => setCoins(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-[hsl(var(--bc-text))]"><DollarSign className="w-4 h-4 text-green-500" /> Cash (max 1000)</Label>
                    <Input type="number" min={0} max={1000} value={cash} onChange={(e) => setCash(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <Button className="w-full" disabled={submitting} onClick={award}>{submitting ? 'Sending…' : 'Award Currency'}</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Forum imports (now main pages)
import ForumLayout from "./components/forum/ForumLayout";
// SettingsLayout is inlined below due to module resolution issues
import ForumHome from "./pages/forum/ForumHome";
// ForumLeaderboard inlined below due to module resolution issues
import ForumCategory from "./pages/forum/ForumCategory";
import ForumThread from "./pages/forum/ForumThread";
import ForumNewThread from "./pages/forum/ForumNewThread";
import ForumLogin from "./pages/forum/ForumLogin";
import ForumRegister from "./pages/forum/ForumRegister";
import ForumForgotPassword from "./pages/forum/ForumForgotPassword";
import ForumSettings from "./pages/forum/ForumSettings";
// Bugs/Blog pages are inlined below to avoid production module resolution issues

import ForumUserProfile from "./pages/forum/ForumUserProfile";
import ForumMessages from "./pages/forum/ForumMessages";
import ForumFAQ from "./pages/forum/ForumFAQ";
// TermsOfService, PrivacyPolicy, GameDetail inlined below
import ForumStaff from "./pages/forum/ForumStaff";
// Notes inlined below
import ForumUsers from "./pages/forum/ForumUsers";
import ForumDashboard from "./pages/forum/ForumDashboard";
import Updates from "./pages/Updates";
import Games from "./pages/forum/Games";
// GameDetail inlined below
import Market from "./pages/forum/Market";
import Character from "./pages/forum/Character";
import Trading from "./pages/forum/Trading";
// Players page removed - using ForumUsers at /players instead
import Groups from "./pages/forum/Groups";
import GroupDetail from "./pages/forum/GroupDetail";
import GroupSettings from "./pages/forum/GroupSettings";
import Friends from "./pages/forum/Friends";
import Achievements from "./pages/forum/Achievements";
import Create from "./pages/forum/Create";
// Roadmap inlined below
// GameView, SettingsPrivacy, SettingsSecurity are inlined below
// Upgrades, Convert, Support, TermsOfService, PrivacyPolicy, GameDetail, MarketItem, Roadmap are inlined below

// MarketItemDetailInline placeholder removed - using MarketItem component directly in routes

// Inline Inventory component
function InventoryPage() {
  const { forumUser } = useOutletContext<{ forumUser: any }>();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [sellPrice, setSellPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (forumUser) fetchInventory();
  }, [forumUser]);

  const fetchInventory = async () => {
    if (!forumUser) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_inventory')
      .select(
        [
          '*',
          'item:item_id(id, name, thumbnail_url, category, is_limited, limited_stock, limited_sold, is_on_sale, offsale_at)',
        ].join(', '),
      )
      .eq('forum_user_id', forumUser.id)
      .order('acquired_at', { ascending: false });
    setInventory(data || []);
    setLoading(false);
  };

  const openListForSale = (inventoryId: string) => {
    setSelectedInventoryId(inventoryId);
    setSellPrice('');
    setShowSellModal(true);
  };

  const listForSale = async () => {
    const price = parseInt(sellPrice, 10);
    if (!selectedInventoryId) return;
    if (!Number.isFinite(price) || price <= 0) {
      toast({ title: 'Enter a valid price', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('user_inventory')
      .update({ is_for_sale: true, sale_price_coins: price })
      .eq('id', selectedInventoryId)
      .eq('forum_user_id', forumUser?.id);

    setSubmitting(false);

    if (error) {
      toast({ title: 'Failed to list item', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Item listed for sale!' });
    setShowSellModal(false);
    setSellPrice('');
    setSelectedInventoryId('');
    fetchInventory();
  };

  const removeListing = async (inventoryId: string) => {
    setSubmitting(true);
    const { error } = await supabase
      .from('user_inventory')
      .update({ is_for_sale: false, sale_price_coins: null, sale_price_cash: null })
      .eq('id', inventoryId)
      .eq('forum_user_id', forumUser?.id);
    setSubmitting(false);

    if (error) {
      toast({ title: 'Failed to remove listing', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Listing removed' });
    fetchInventory();
  };

  if (!forumUser) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">My Inventory</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">View and manage your items ({inventory.length} items)</p>
        </div>
        <Link to="/trading" className="bc-btn bc-btn-primary gap-2">
          <ArrowRightLeft className="w-4 h-4" />Trade Items
        </Link>
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--bc-border))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">List for sale</h3>
              <button
                onClick={() => setShowSellModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--bc-bg))]"
              >
                <span className="text-[hsl(var(--bc-text-muted))]">×</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[hsl(var(--bc-text))]">Price (coins)</label>
                <Input
                  type="number"
                  min={1}
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSellModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={listForSale} disabled={submitting}>
                  {submitting ? 'Listing…' : 'List'}
                </Button>
              </div>
              <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                Your listing will show up under Private Sellers on the item page.
              </p>
            </div>
          </div>
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="bc-card p-6 text-center">
          <Package className="w-16 h-16 text-[hsl(var(--bc-text-muted))] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2">Your inventory is empty</h3>
          <p className="text-[hsl(var(--bc-text-muted))] mb-4">Visit the Market to purchase items!</p>
          <Link to="/market" className="bc-btn bc-btn-primary">Browse Market</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {inventory.map((inv) => {
            const limitedStock = inv.item?.limited_stock ?? null;
            const limitedSold = inv.item?.limited_sold ?? 0;
            const isSoldOutLimited = !!inv.item?.is_limited && limitedStock !== null && limitedSold >= limitedStock;
            const canListForSale = isSoldOutLimited && !inv.is_for_sale;

            return (
              <Link
                key={inv.id}
                to={`/market/item/${inv.item?.id}`}
                className="bc-card overflow-hidden hover:border-[hsl(var(--bc-primary))] transition-all group"
              >
                <div className="aspect-square bg-[hsl(var(--bc-bg))] relative">
                  {inv.item?.thumbnail_url ? (
                    <img src={inv.item.thumbnail_url} alt={inv.item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-12 h-12 text-[hsl(var(--bc-text-muted))]/40" />
                    </div>
                  )}
                  {inv.item?.is_limited && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500 text-white text-xs font-semibold">
                        Rare
                      </span>
                    </div>
                  )}
                  {inv.is_for_sale && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-500 text-white text-xs font-semibold">
                        On Sale
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div>
                    <h3 className="font-medium text-sm text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-primary))]">
                      {inv.item?.name || 'Unknown Item'}
                    </h3>
                    {inv.serial_number && <p className="text-xs text-[hsl(var(--bc-text-muted))]">Serial #{inv.serial_number}</p>}
                  </div>

                  {/* Actions (stop Link navigation) */}
                  {canListForSale && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openListForSale(inv.id);
                      }}
                    >
                      List for sale
                    </Button>
                  )}

                  {inv.is_for_sale && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeListing(inv.id);
                      }}
                      disabled={submitting}
                    >
                      Remove listing
                    </Button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inline Trading component  
function TradingPageComponent() {
  const { forumUser, isAdmin } = useOutletContext<{ forumUser: any; isAdmin: boolean }>();
  const [searchParams] = useSearchParams();
  const withUsername = searchParams.get('with');
  const [tradingWith, setTradingWith] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [selectedMyItems, setSelectedMyItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPageMaintenance, setIsPageMaintenance] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check page maintenance status
    const checkMaintenance = async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'page_maintenance')
        .single();
      if (data?.value && (data.value as any).trading && !isAdmin) {
        setIsPageMaintenance(true);
      }
    };
    checkMaintenance();
  }, [isAdmin]);

  useEffect(() => {
    if (forumUser) fetchData();
  }, [forumUser, withUsername]);

  const fetchData = async () => {
    if (!forumUser) return;
    setLoading(true);
    
    // Fetch user's inventory (only limited items can be traded)
    const { data: inventoryData } = await supabase
      .from('user_inventory')
      .select('*, item:item_id(id, name, thumbnail_url, is_limited, rap)')
      .eq('forum_user_id', forumUser.id)
      .eq('is_for_sale', false);
    
    const tradableItems = (inventoryData || []).filter((inv: any) => inv.item?.is_limited);
    setMyInventory(tradableItems);
    
    // Fetch friends
    const { data: friendships } = await supabase
      .from('forum_friendships')
      .select('user_1_id, user_2_id')
      .or(`user_1_id.eq.${forumUser.id},user_2_id.eq.${forumUser.id}`);
    
    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => f.user_1_id === forumUser.id ? f.user_2_id : f.user_1_id);
      const { data: friendUsers } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url')
        .in('id', friendIds);
      setFriends(friendUsers || []);
      
      if (withUsername && friendUsers) {
        const friend = friendUsers.find(f => f.username.toLowerCase() === withUsername.toLowerCase());
        if (friend) setTradingWith(friend);
      }
    }
    
    // Fetch existing trades
    const { data: tradesData } = await supabase
      .from('trades')
      .select('*, sender:sender_id(username, avatar_url), receiver:receiver_id(username, avatar_url)')
      .or(`sender_id.eq.${forumUser.id},receiver_id.eq.${forumUser.id}`)
      .order('created_at', { ascending: false })
      .limit(20);
    setTrades(tradesData || []);
    
    setLoading(false);
  };

  const toggleItemSelection = (inventoryId: string) => {
    setSelectedMyItems(prev => 
      prev.includes(inventoryId) 
        ? prev.filter(id => id !== inventoryId)
        : [...prev, inventoryId]
    );
  };

  if (!forumUser) return <Navigate to="/login" replace />;
  
  if (isPageMaintenance) {
    return (
      <div className="flex items-center justify-center p-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Package className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] mb-3">Trading is Under Maintenance</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-8">We're performing scheduled maintenance. Please check back soon!</p>
          <Link to="/" className="inline-flex items-center gap-2 text-[hsl(var(--bc-primary))] hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }
  
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Trading</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">Trade items with your friends</p>
        </div>
        <Link to="/inventory" className="bc-btn bc-btn-secondary gap-2"><Package className="w-4 h-4" />My Inventory</Link>
      </div>
      
      {tradingWith ? (
        <div className="bc-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <img src={tradingWith.avatar_url || '/placeholder.svg'} alt="" className="w-16 h-16 rounded-full" />
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--bc-text))]">Trade with {tradingWith.username}</h2>
              <p className="text-[hsl(var(--bc-text-muted))]">Select limited items to trade</p>
            </div>
            <button onClick={() => { setTradingWith(null); setSelectedMyItems([]); }} className="ml-auto text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]">✕</button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-[hsl(var(--bc-border))] rounded-xl p-4">
              <h3 className="font-semibold text-[hsl(var(--bc-text))] mb-3">Your Items ({selectedMyItems.length} selected)</h3>
              {myInventory.length === 0 ? (
                <div className="min-h-[200px] flex items-center justify-center text-[hsl(var(--bc-text-muted))]">
                  <p>You have no limited items to trade</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                  {myInventory.map((inv: any) => (
                    <button
                      key={inv.id}
                      onClick={() => toggleItemSelection(inv.id)}
                      className={`relative rounded-lg border-2 transition ${
                        selectedMyItems.includes(inv.id) 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))]'
                      }`}
                    >
                      <div className="aspect-square bg-[hsl(var(--bc-bg))]">
                        {inv.item?.thumbnail_url ? (
                          <img src={inv.item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 m-auto text-[hsl(var(--bc-text-muted))]" />
                        )}
                      </div>
                      <div className="p-1 text-center">
                        <p className="text-xs text-[hsl(var(--bc-text))] truncate">{inv.item?.name}</p>
                        {inv.serial_number && <p className="text-[10px] text-[hsl(var(--bc-text-muted))]">#{inv.serial_number}</p>}
                      </div>
                      {selectedMyItems.includes(inv.id) && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border border-[hsl(var(--bc-border))] rounded-xl p-4">
              <h3 className="font-semibold text-[hsl(var(--bc-text))] mb-3">{tradingWith.username}'s Items</h3>
              <div className="min-h-[200px] flex items-center justify-center text-[hsl(var(--bc-text-muted))]">
                <p>Select items to request from {tradingWith.username}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { setTradingWith(null); setSelectedMyItems([]); }} className="bc-btn bc-btn-secondary">Cancel</button>
            <button 
              className="bc-btn bc-btn-primary"
              disabled={selectedMyItems.length === 0}
              onClick={() => toast({ title: 'Trade feature coming soon!', description: 'Full trading will be available soon.' })}
            >
              Send Trade Request
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Friends List */}
          <div className="bc-card p-6">
            <h3 className="font-semibold text-[hsl(var(--bc-text))] mb-4">Trade with a Friend</h3>
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
                <p className="text-[hsl(var(--bc-text-muted))]">Add friends to start trading!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map(friend => (
                  <button key={friend.id} onClick={() => setTradingWith(friend)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition">
                    <img src={friend.avatar_url || '/placeholder.svg'} alt="" className="w-10 h-10 rounded-full" />
                    <span className="font-medium text-[hsl(var(--bc-text))]">{friend.username}</span>
                    <ArrowRightLeft className="w-4 h-4 ml-auto text-[hsl(var(--bc-primary))]" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent Trades */}
          <div className="bc-card p-6">
            <h3 className="font-semibold text-[hsl(var(--bc-text))] mb-4">Recent Trades</h3>
            {trades.length === 0 ? (
              <div className="text-center py-8">
                <ArrowRightLeft className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
                <p className="text-[hsl(var(--bc-text-muted))]">No trades yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trades.map(trade => (
                  <div key={trade.id} className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--bc-bg-light))]">
                    <img src={(trade.sender?.avatar_url || trade.receiver?.avatar_url) || '/placeholder.svg'} alt="" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-[hsl(var(--bc-text))]">
                        {trade.sender_id === forumUser.id ? `To ${trade.receiver?.username}` : `From ${trade.sender?.username}`}
                      </p>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))]">{trade.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { Package } from "lucide-react";

// Inline Jobs component
import { Briefcase, MapPin, Clock, Building2, Send } from "lucide-react";
 
 interface JobListing {
   id: string;
   title: string;
   description: string;
  category_id: string;
   work_type: 'remote' | 'hybrid' | 'on-site';
   status: 'open' | 'closed' | 'filled';
   created_at: string;
  job_categories?: { name: string };
 }
 
 interface JobApplication {
   id: string;
   job_id: string;
   forum_user_id: string;
   discord_username: string;
   age: number;
   reason: string;
   status: 'pending' | 'accepted' | 'declined';
   created_at: string;
 }
 
 function Jobs() {
   const { forumUser, loading: authLoading } = useForumAuth();
   const { toast } = useToast();
   const [jobs, setJobs] = useState<JobListing[]>([]);
   const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
   const [showApplyModal, setShowApplyModal] = useState(false);
   const [submitting, setSubmitting] = useState(false);
   
   // Application form state
   const [discordUsername, setDiscordUsername] = useState('');
   const [age, setAge] = useState('');
   const [reason, setReason] = useState('');
 
   useEffect(() => {
     fetchJobs();
   }, []);
 
   useEffect(() => {
     if (forumUser) {
       fetchMyApplications();
     }
   }, [forumUser]);
 
   const fetchJobs = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from('jobs')
      .select('*, job_categories(name)')
       .eq('status', 'open')
       .order('created_at', { ascending: false });
     
     if (error) {
       toast({ title: 'Error loading jobs', description: error.message, variant: 'destructive' });
     } else {
       setJobs((data as JobListing[]) || []);
     }
     setLoading(false);
   };
 
   const fetchMyApplications = async () => {
     if (!forumUser) return;
     const { data } = await supabase
       .from('job_applications')
       .select('*')
       .eq('forum_user_id', forumUser.id);
     setMyApplications((data as JobApplication[]) || []);
   };
 
   const hasApplied = (jobId: string) => {
     return myApplications.some(app => app.job_id === jobId);
   };
 
   const getApplicationStatus = (jobId: string) => {
     const app = myApplications.find(app => app.job_id === jobId);
     return app?.status;
   };
 
   const handleApply = async () => {
     if (!forumUser || !selectedJob) return;
     
     const ageNum = parseInt(age);
     if (!discordUsername.trim() || isNaN(ageNum) || ageNum < 13 || !reason.trim()) {
       toast({ title: 'Please fill all fields correctly', description: 'Age must be at least 13', variant: 'destructive' });
       return;
     }
 
     setSubmitting(true);
     const { error } = await supabase.from('job_applications').insert({
       job_id: selectedJob.id,
       forum_user_id: forumUser.id,
       discord_username: discordUsername.trim(),
       age: ageNum,
       reason: reason.trim(),
       status: 'pending'
     });
 
     if (error) {
       toast({ title: 'Application failed', description: error.message, variant: 'destructive' });
     } else {
       toast({ title: 'Application submitted!', description: 'We will review your application soon.' });
       setShowApplyModal(false);
       setDiscordUsername('');
       setAge('');
       setReason('');
       fetchMyApplications();
     }
     setSubmitting(false);
   };
 
   const workTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
     remote: { label: 'Remote', icon: <MapPin className="w-4 h-4" /> },
     hybrid: { label: 'Hybrid', icon: <Building2 className="w-4 h-4" /> },
     'on-site': { label: 'On-Site', icon: <Building2 className="w-4 h-4" /> },
   };
 
   if (authLoading || loading) {
     return (
       <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="flex items-center gap-3">
         <Briefcase className="w-8 h-8 text-[hsl(var(--bc-primary))]" />
         <div>
           <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Work for BLOX City</h1>
           <p className="text-[hsl(var(--bc-text-muted))]">Join our team and help build something amazing</p>
         </div>
       </div>
 
       {jobs.length === 0 ? (
         <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
           <Briefcase className="w-12 h-12 mx-auto mb-3 text-[hsl(var(--bc-text-muted))]" />
           <p className="text-[hsl(var(--bc-text-muted))]">No open positions at the moment. Check back soon!</p>
         </div>
       ) : (
         <div className="grid gap-4">
           {jobs.map((job) => {
             const applied = hasApplied(job.id);
             const status = getApplicationStatus(job.id);
             const workType = workTypeLabels[job.work_type] || workTypeLabels.remote;
 
             return (
               <div key={job.id} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
                 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-2">
                       <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">{job.title}</h3>
                      {job.job_categories?.name && (
                        <span className="px-2 py-0.5 text-xs rounded bg-[hsl(var(--bc-primary))]/10 text-[hsl(var(--bc-primary))]">
                          {job.job_categories.name}
                        </span>
                      )}
                     </div>
                      <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-3 whitespace-pre-wrap">{job.description}</p>
                     <div className="flex flex-wrap gap-3 text-sm text-[hsl(var(--bc-text-muted))]">
                       <span className="flex items-center gap-1">
                         {workType.icon} {workType.label}
                       </span>
                       <span className="flex items-center gap-1">
                         <Clock className="w-4 h-4" /> Posted {new Date(job.created_at).toLocaleDateString()}
                       </span>
                     </div>
                   </div>
                   <div className="flex-shrink-0">
                     {applied ? (
                       <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                         status === 'accepted' ? 'bg-green-500/10 text-green-500' :
                         status === 'declined' ? 'bg-red-500/10 text-red-500' :
                         'bg-yellow-500/10 text-yellow-500'
                       }`}>
                         {status === 'accepted' ? '✓ Accepted' :
                          status === 'declined' ? '✗ Declined' :
                          '⏳ Pending Review'}
                       </div>
                     ) : forumUser ? (
                       <Button
                         onClick={() => { setSelectedJob(job); setShowApplyModal(true); }}
                         className="flex items-center gap-2"
                       >
                         <Send className="w-4 h-4" /> Apply Now
                       </Button>
                     ) : (
                       <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] text-white rounded-lg text-sm font-medium">
                         Login to Apply
                       </Link>
                     )}
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
       )}
 
       {/* Apply Modal */}
       {showApplyModal && selectedJob && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 max-w-md w-full">
             <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-4">Apply for {selectedJob.title}</h2>
             <div className="space-y-4">
               <div>
                 <Label className="text-[hsl(var(--bc-text))]">Discord Username</Label>
                 <Input
                   value={discordUsername}
                   onChange={(e) => setDiscordUsername(e.target.value)}
                   placeholder="yourname#1234 or @yourname"
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label className="text-[hsl(var(--bc-text))]">Your Age</Label>
                 <Input
                   type="number"
                   min={13}
                   value={age}
                   onChange={(e) => setAge(e.target.value)}
                   placeholder="Must be 13+"
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label className="text-[hsl(var(--bc-text))]">Why do you want to work for BLOX City?</Label>
                 <Textarea
                   value={reason}
                   onChange={(e) => setReason(e.target.value)}
                   placeholder="Tell us about yourself and why you'd be a great fit..."
                   className="mt-1 min-h-[120px]"
                 />
               </div>
               <div className="flex gap-3 pt-2">
                 <Button
                   variant="outline"
                   onClick={() => setShowApplyModal(false)}
                   className="flex-1"
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={handleApply}
                   disabled={submitting}
                   className="flex-1"
                 >
                   {submitting ? 'Submitting...' : 'Submit Application'}
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
 
// Need useParams for GameDetail
function useGameParams() {
  const params = window.location.pathname.match(/\/game\/([^\/]+)/);
  return { gameId: params ? params[1] : undefined };
}

// Inline Landing Page for logged-out users
import bloxcityLogoLanding from "@/assets/IMG_2412_Original-1.png";

interface LandingThread {
  id: string;
  title: string;
  view_count: number;
  reply_count: number;
  created_at: string;
  author: { username: string; avatar_url: string | null };
}

interface LandingGame {
  id: string;
  title: string;
  thumbnail_url: string | null;
  play_count: number;
  creator: { username: string };
}

interface LandingItem {
  id: string;
  name: string;
  thumbnail_url: string | null;
  price_coins: number | null;
  price_cash: number | null;
  is_limited: boolean;
}

interface LandingStats {
  users: number;
  games: number;
  threads: number;
}

function LandingPage() {
  const { forumUser, loading } = useForumAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [threads, setThreads] = useState<LandingThread[]>([]);
  const [games, setGames] = useState<LandingGame[]>([]);
  const [items, setItems] = useState<LandingItem[]>([]);
  const [stats, setStats] = useState<LandingStats>({ users: 0, games: 0, threads: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch threads with author info - use forum_users_public for unauthenticated access
        const [threadsRes, gamesRes, itemsRes, usersCountRes, gamesCountRes, threadsCountRes] = await Promise.all([
          supabase
            .from('forum_threads')
            .select('id, title, view_count, reply_count, created_at, author_id')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('forum_games')
            .select('id, title, thumbnail_url, play_count, creator_id')
            .eq('is_private', false)
            .order('play_count', { ascending: false })
            .limit(6),
          supabase
            .from('marketplace_items')
            .select('id, name, thumbnail_url, price_coins, price_cash, is_limited')
            .order('created_at', { ascending: false })
            .limit(8),
          supabase.from('forum_users_public').select('id', { count: 'exact', head: true }),
          supabase.from('forum_games').select('id', { count: 'exact', head: true }).eq('is_private', false),
          supabase.from('forum_threads').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
        ]);

        // Fetch author data separately from public view
        if (threadsRes.data && threadsRes.data.length > 0) {
          const authorIds = [...new Set(threadsRes.data.map((t: any) => t.author_id).filter(Boolean))];
          const { data: authorsData } = await supabase
            .from('forum_users_public')
            .select('id, username, avatar_url')
            .in('id', authorIds);
          
          const authorsMap = new Map((authorsData || []).map((a: any) => [a.id, a]));
          
          setThreads(threadsRes.data.map((t: any) => {
            const author = authorsMap.get(t.author_id);
            return {
              id: t.id,
              title: t.title,
              view_count: t.view_count,
              reply_count: t.reply_count,
              created_at: t.created_at,
              author: author ? { username: author.username, avatar_url: author.avatar_url } : { username: 'Unknown', avatar_url: null },
            };
          }));
        }

        // Fetch creator data separately for games
        if (gamesRes.data && gamesRes.data.length > 0) {
          const creatorIds = [...new Set(gamesRes.data.map((g: any) => g.creator_id).filter(Boolean))];
          const { data: creatorsData } = await supabase
            .from('forum_users_public')
            .select('id, username')
            .in('id', creatorIds);
          
          const creatorsMap = new Map((creatorsData || []).map((c: any) => [c.id, c]));
          
          setGames(gamesRes.data.map((g: any) => {
            const creator = creatorsMap.get(g.creator_id);
            return {
              id: g.id,
              title: g.title,
              thumbnail_url: g.thumbnail_url,
              play_count: g.play_count || 0,
              creator: creator ? { username: creator.username } : { username: 'Unknown' },
            };
          }));
        }

        // Set items
        if (itemsRes.data) {
          setItems(itemsRes.data.map((i: any) => ({
            id: i.id,
            name: i.name,
            thumbnail_url: i.thumbnail_url,
            price_coins: i.price_coins,
            price_cash: i.price_cash,
            is_limited: i.is_limited,
          })));
        }

        setStats({
          users: usersCountRes.count || 0,
          games: gamesCountRes.count || 0,
          threads: threadsCountRes.count || 0,
        });
      } catch (err) {
        console.error('Landing data fetch error:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && forumUser) {
      navigate('/');
    }
  }, [loading, forumUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }

  // Only show landing if NOT logged in
  if (forumUser) return null;

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex flex-col">
      {/* Navigation */}
      <nav className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={bloxcityLogoLanding} alt="BLOX City" className="w-10 h-10 rounded-lg" />
              <span className="font-bold text-xl text-[hsl(var(--bc-text))] hidden sm:inline">BLOX City</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/games" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] font-medium transition">Games</Link>
              <Link to="/market" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] font-medium transition">Market</Link>
              <Link to="/forum" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] font-medium transition">Forum</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/register" className="px-4 py-2 bg-[hsl(var(--bc-success))] hover:bg-[hsl(var(--bc-success-light))] text-white rounded-lg font-semibold transition">
              Get Started
            </Link>
            <Link to="/login" className="px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg font-semibold transition">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-b from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-primary-dark))] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <img src={bloxcityLogoLanding} alt="BLOX City" className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-6 rounded-2xl shadow-2xl" />
          <h1 className="text-2xl md:text-3xl font-semibold mb-4">
            Join in on the action today. Buy & sell items, participate in groups, make friends, and more.
          </h1>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/login" className="px-8 py-3 bg-[hsl(var(--bc-warning))] hover:bg-[hsl(var(--bc-warning-dark))] text-white rounded-full font-semibold shadow-lg transition text-lg">
              🔑 Login
            </Link>
            <Link to="/register" className="px-8 py-3 bg-[hsl(var(--bc-success))] hover:bg-[hsl(var(--bc-success-light))] text-white rounded-full font-semibold shadow-lg transition text-lg">
              🚀 Register
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[hsl(var(--bc-primary))]">{stats.users.toLocaleString()}</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Players</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[hsl(var(--bc-success))]">{stats.games.toLocaleString()}</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Games</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[hsl(var(--bc-warning))]">{stats.threads.toLocaleString()}</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Forum Posts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 bg-[hsl(var(--bc-bg))]">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Featured Games Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[hsl(var(--bc-text))] flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
                Featured Games
              </h2>
              <Link to="/games" className="text-[hsl(var(--bc-primary))] hover:underline font-medium text-sm">
                View All →
              </Link>
            </div>
            {dataLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden animate-pulse">
                    <div className="aspect-square bg-[hsl(var(--bc-bg-light))]" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-[hsl(var(--bc-bg-light))] rounded w-3/4" />
                      <div className="h-3 bg-[hsl(var(--bc-bg-light))] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : games.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {games.map((game) => (
                  <Link key={game.id} to="/login" className="group bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden hover:border-[hsl(var(--bc-primary))] transition">
                    <div className="aspect-square bg-[hsl(var(--bc-bg-light))] flex items-center justify-center">
                      {game.thumbnail_url ? (
                        <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        <Gamepad2 className="w-12 h-12 text-[hsl(var(--bc-text-muted))]" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-[hsl(var(--bc-text))] text-sm truncate group-hover:text-[hsl(var(--bc-primary))] transition">{game.title}</div>
                      <div className="text-xs text-[hsl(var(--bc-text-muted))]">by {game.creator.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[hsl(var(--bc-text-muted))]">No games available yet.</div>
            )}
          </section>

          {/* Recent Items Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[hsl(var(--bc-text))] flex items-center gap-2">
                <Store className="w-6 h-6 text-[hsl(var(--bc-success))]" />
                New Items
              </h2>
              <Link to="/market" className="text-[hsl(var(--bc-primary))] hover:underline font-medium text-sm">
                View All →
              </Link>
            </div>
            {dataLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden animate-pulse">
                    <div className="aspect-square bg-[hsl(var(--bc-bg-light))]" />
                    <div className="p-2 space-y-2">
                      <div className="h-3 bg-[hsl(var(--bc-bg-light))] rounded w-3/4" />
                      <div className="h-3 bg-[hsl(var(--bc-bg-light))] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {items.map((item) => (
                  <Link key={item.id} to="/login" className="group bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden hover:border-[hsl(var(--bc-primary))] transition">
                    <div className="aspect-square bg-[hsl(var(--bc-bg-light))] flex items-center justify-center relative">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-[hsl(var(--bc-text-muted))]" />
                      )}
                      {item.is_limited && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded">
                          LTD
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="font-medium text-[hsl(var(--bc-text))] text-xs truncate group-hover:text-[hsl(var(--bc-primary))] transition">{item.name}</div>
                      <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                        {item.price_coins ? `${item.price_coins.toLocaleString()} Coins` : item.price_cash ? `${item.price_cash.toLocaleString()} Cash` : 'Free'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[hsl(var(--bc-text-muted))]">No items available yet.</div>
            )}
          </section>

          {/* Forum Posts + Character Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Recent Forum Posts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
                  💬 Recent Forum Posts
                </h2>
                <Link to="/forum" className="text-[hsl(var(--bc-primary))] hover:underline font-medium text-sm">
                  View All →
                </Link>
              </div>
              {dataLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[hsl(var(--bc-bg-light))] rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-[hsl(var(--bc-bg-light))] rounded w-3/4" />
                          <div className="h-3 bg-[hsl(var(--bc-bg-light))] rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : threads.length > 0 ? (
                <div className="space-y-3">
                  {threads.map((thread) => (
                    <div key={thread.id} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-4 flex items-center justify-between hover:border-[hsl(var(--bc-primary))] transition">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {thread.author.avatar_url ? (
                          <img src={thread.author.avatar_url} alt={thread.author.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-[hsl(var(--bc-primary))] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {thread.author.username[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-[hsl(var(--bc-text))] text-sm truncate">{thread.title}</div>
                          <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                            by {thread.author.username} • {getRelativeTime(thread.created_at)} • {thread.reply_count} replies
                          </div>
                        </div>
                      </div>
                      <Link to="/login" className="px-3 py-1.5 bg-[hsl(var(--bc-primary))] text-white text-xs rounded-lg font-medium flex-shrink-0 ml-3">
                        View Post
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[hsl(var(--bc-text-muted))]">No forum posts yet.</div>
              )}
            </div>

            {/* Customize Character */}
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[hsl(var(--bc-warning))]" />
                Customize your Character
              </h2>
              <p className="text-[hsl(var(--bc-text-muted))] mb-4">
                Pick and choose from a collection of items created by the community to create your own unique character with.
              </p>
              <div className="grid grid-cols-4 gap-3">
                {items.slice(0, 4).map((item) => (
                  <Link key={item.id} to="/login" className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-2 aspect-square flex items-center justify-center hover:border-[hsl(var(--bc-primary))] transition">
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-[hsl(var(--bc-bg-light))] rounded" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <section className="bg-gradient-to-r from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-primary-dark))] rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Join the Community?</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Create your account today and start playing games, trading items, and making friends on BLOX City!
            </p>
            <Link to="/register" className="inline-block px-8 py-3 bg-white text-[hsl(var(--bc-primary))] rounded-full font-semibold shadow-lg hover:bg-white/90 transition text-lg">
              🚀 Create Free Account
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(var(--bc-bg-card))] border-t border-[hsl(var(--bc-border))] py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2 mb-2">
              Copyright © {currentYear}
              <img src={bloxcityLogoLanding} alt="" className="w-6 h-6 rounded" />
              BLOX City. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <Link to="/terms-of-service" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] font-semibold">TERMS OF SERVICE</Link>
              <Link to="/privacy-policy" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] font-semibold">PRIVACY POLICY</Link>
              <Link to="/faq" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] font-semibold">FAQ</Link>
              <Link to="/notes" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] font-semibold">NOTES</Link>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="https://x.com/bloxcitynet" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] text-2xl transition">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://discord.gg/bloxcity" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] text-2xl transition">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Wrapper that shows Landing for guests, Dashboard for logged-in users
function HomeOrLanding() {
  const { user, forumUser, loading } = useForumAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    // If user has auth session but no forum profile, redirect to register to complete signup
    if (user && !forumUser) {
      navigate('/register', { replace: true });
      return;
    }
    
    // If no auth session at all, redirect to landing page
    if (!user && !forumUser) {
      navigate('/landing', { replace: true });
    }
  }, [loading, user, forumUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }

  // If logged in with forum profile, show dashboard
  if (forumUser) {
    return <ForumDashboard />;
  }

  // Loading/redirecting state
  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
    </div>
  );
}

// Inline TermsOfService component
function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] mb-6">Terms of Service</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-4">Last updated: February 2026</p>
        <div className="prose prose-invert max-w-none space-y-6 text-[hsl(var(--bc-text-muted))]">
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">1. Acceptance of Terms</h2><p>By accessing or using BLOX City, you agree to be bound by these Terms of Service.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">2. Eligibility</h2><p>You must be at least 13 years old to use BLOX City.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">3. User Accounts</h2><p>You are responsible for maintaining the security of your account and all activities under it.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">4. Prohibited Conduct</h2><p>Users may not harass others, post illegal content, exploit the system, impersonate others, or use bots.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">5. Virtual Currency</h2><p>Virtual currencies have no real-world value and are non-refundable. Exploiting systems results in ban.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">6. Moderation</h2><p>We reserve the right to remove content and suspend accounts that violate these terms.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">7. Disclaimer</h2><p>The Service is provided "as is" without warranties of any kind.</p></section>
        </div>
        <div className="mt-8 pt-6 border-t border-[hsl(var(--bc-border))]"><Link to="/" className="text-[hsl(var(--bc-primary))] hover:underline">← Back to Home</Link></div>
      </div>
    </div>
  );
}

// Inline PrivacyPolicy component
function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] mb-6">Privacy Policy</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-4">Last updated: February 2026</p>
        <div className="prose prose-invert max-w-none space-y-6 text-[hsl(var(--bc-text-muted))]">
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">1. Information We Collect</h2><p>We collect email, username, profile info, and usage data.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">2. How We Use Your Information</h2><p>To provide the Service, communicate updates, enforce terms, and prevent abuse.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">3. Information Sharing</h2><p>We do not sell your personal information. We share only with service providers or when legally required.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">4. Data Security</h2><p>We implement encryption and access controls to protect your data.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">5. Your Rights</h2><p>You can access, correct, delete your data, and opt out of marketing.</p></section>
          <section><h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">6. Children's Privacy</h2><p>BLOX City is for users 13 and older.</p></section>
        </div>
        <div className="mt-8 pt-6 border-t border-[hsl(var(--bc-border))]"><Link to="/" className="text-[hsl(var(--bc-primary))] hover:underline">← Back to Home</Link></div>
      </div>
    </div>
  );
}

// Inline GameDetail component
function GameDetail() {
  const { gameId } = useGameParams();
  const { forumUser, loading: authLoading } = useForumAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "" });
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { if (gameId) { fetchGame(); fetchComments(); } }, [gameId]);
  useEffect(() => { if (forumUser && gameId) { checkFavorite(); checkAdmin(); } }, [forumUser, gameId]);

  const checkAdmin = async () => { if (!forumUser) return; const { data } = await supabase.rpc("has_role", { _user_id: forumUser.user_id, _role: "admin" }); setIsAdmin(!!data); };
  const fetchGame = async () => { if (!gameId) return; const { data } = await supabase.from("forum_games").select("*, creator:forum_users!forum_games_creator_id_fkey (id, username, avatar_url)").eq("id", gameId).single(); setGame(data); if (data) setEditForm({ title: data.title, description: data.description || "", category: data.category }); setLoading(false); };
  const fetchComments = async () => { if (!gameId) return; const { data } = await supabase.from("forum_game_comments").select("*, author:forum_users!forum_game_comments_author_id_fkey (id, username, avatar_url)").eq("game_id", gameId).eq("is_deleted", false).order("created_at", { ascending: false }); setComments(data || []); };
  const checkFavorite = async () => { if (!forumUser || !gameId) return; const { data } = await supabase.from("forum_game_favorites").select("id").eq("game_id", gameId).eq("forum_user_id", forumUser.id).single(); setIsFavorited(!!data); };
  const toggleFavorite = async () => { if (!forumUser || !gameId) { toast({ title: "Please login to favorite", variant: "destructive" }); return; } if (isFavorited) { await supabase.from("forum_game_favorites").delete().eq("game_id", gameId).eq("forum_user_id", forumUser.id); setIsFavorited(false); } else { await supabase.from("forum_game_favorites").insert({ game_id: gameId, forum_user_id: forumUser.id }); setIsFavorited(true); } };
  const handleSaveEdit = async () => { if (!game) return; const { error } = await supabase.from("forum_games").update({ title: editForm.title, description: editForm.description || null, category: editForm.category }).eq("id", game.id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Game updated" }); setIsEditing(false); fetchGame(); } };
  const handleSubmitComment = async () => { if (!forumUser || !gameId || !newComment.trim()) return; setSubmittingComment(true); await supabase.from("forum_game_comments").insert({ game_id: gameId, author_id: forumUser.id, content: newComment.trim() }); setNewComment(""); fetchComments(); setSubmittingComment(false); };
  const handleDeleteComment = async (commentId: string) => { await supabase.from("forum_game_comments").update({ is_deleted: true }).eq("id", commentId); fetchComments(); };

  if (loading || authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!game) return <div className="max-w-4xl mx-auto p-6 text-center"><AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" /><h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Game Not Found</h1><Link to="/games"><Button>Back to Games</Button></Link></div>;

  const canEdit = forumUser && (forumUser.id === game.creator_id || isAdmin);
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
        <div className="aspect-video bg-[hsl(var(--bc-bg-light))] flex items-center justify-center">{game.thumbnail_url ? <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" /> : <span className="text-[hsl(var(--bc-text-muted))]">No Thumbnail</span>}</div>
        <div className="p-6 space-y-4">
          {isEditing ? (<div className="space-y-4"><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Game Title" /><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" /><div className="flex gap-2"><Button onClick={handleSaveEdit}>Save</Button><Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button></div></div>) : (<><div className="flex items-start justify-between"><div><h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">{game.title}</h1><Link to={`/id/${game.creator?.username}/profile`} className="text-[hsl(var(--bc-primary))] hover:underline text-sm">by {game.creator?.username}</Link></div>{canEdit && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>}</div>{game.description && <p className="text-[hsl(var(--bc-text-muted))]">{game.description}</p>}</>)}
          <div className="flex items-center gap-6 text-sm text-[hsl(var(--bc-text-muted))]"><span>{game.play_count || 0} plays</span><span>{game.favorite_count || 0} favorites</span></div>
          <div className="flex gap-3 pt-4 border-t border-[hsl(var(--bc-border))]"><Button className="flex-1">Play Now</Button><Button variant="outline" onClick={toggleFavorite} className={isFavorited ? "text-red-500" : ""}>♥</Button></div>
        </div>
      </div>
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Comments ({comments.length})</h2>
        {forumUser ? (<div className="flex gap-3 mb-6"><Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()} /><Button onClick={handleSubmitComment} disabled={submittingComment || !newComment.trim()}>{submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}</Button></div>) : <p className="text-[hsl(var(--bc-text-muted))] mb-6"><Link to="/login" className="text-[hsl(var(--bc-primary))] hover:underline">Login</Link> to comment</p>}
        <div className="space-y-4">{comments.length === 0 ? <p className="text-center text-[hsl(var(--bc-text-muted))] py-8">No comments yet</p> : comments.map((c) => (<div key={c.id} className="flex gap-3 p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"><img src={c.author?.avatar_url || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full" /><div className="flex-1"><div className="flex items-center justify-between"><Link to={`/id/${c.author?.username}/profile`} className="font-medium text-[hsl(var(--bc-text))]">{c.author?.username}</Link>{(forumUser?.id === c.author_id || isAdmin) && <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 text-sm">Delete</button>}</div><p className="text-[hsl(var(--bc-text-muted))] text-sm">{c.content}</p></div></div>))}</div>
      </div>
    </div>
  );
}

// Inline GameView component (game detail page with servers and comments)
function GameView() {
  // Support both /game/:serialId/:slug and /game/:id formats
  const newFormat = window.location.pathname.match(/\/game\/(\d+)\/([^\/]+)/);
  const oldFormat = window.location.pathname.match(/\/game\/([^\/]+)/);
  
  const serialIdParam = newFormat ? parseInt(newFormat[1]) : null;
  const uuidParam = (!newFormat && oldFormat) ? oldFormat[1] : null;
  
  const { forumUser, loading: authLoading } = useForumAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "" });
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'servers'>('comments');
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  useEffect(() => { if (serialIdParam || uuidParam) { fetchGame(); } }, [serialIdParam, uuidParam]);
  useEffect(() => { if (forumUser && game) { checkFavorite(); checkAdmin(); } }, [forumUser, game]);

  const checkAdmin = async () => { if (!forumUser) return; const { data } = await supabase.rpc("has_role", { _user_id: forumUser.user_id, _role: "admin" }); setIsAdmin(!!data); };
  const fetchGame = async () => { 
    if (!serialIdParam && !uuidParam) return; 
    let query = supabase.from("forum_games").select("*, creator:forum_users!forum_games_creator_id_fkey (id, serial_id, username, avatar_url)");
    if (serialIdParam) {
      query = query.eq("serial_id", serialIdParam);
    } else if (uuidParam) {
      query = query.eq("id", uuidParam);
    }
    const { data } = await query.single(); 
    setGame(data); 
    if (data) {
      setEditForm({ title: data.title, description: data.description || "", category: data.category }); 
      // Redirect to canonical URL if using old format
      if (uuidParam && data.serial_id) {
        const slug = data.title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
        navigate(`/game/${data.serial_id}/${slug}`, { replace: true });
      }
      fetchComments(data.id); 
      fetchServers(data.id);
    }
    setLoading(false); 
  };
  const fetchComments = async (gameId: string) => { if (!gameId) return; const { data } = await supabase.from("forum_game_comments").select("*, author:forum_users!forum_game_comments_author_id_fkey (id, serial_id, username, avatar_url)").eq("game_id", gameId).eq("is_deleted", false).order("created_at", { ascending: false }); setComments(data || []); };
  const fetchServers = async (gameId: string) => { if (!gameId) return; const { data } = await supabase.from("forum_game_servers").select("*").eq("game_id", gameId).eq("is_active", true).order("created_at", { ascending: false }); setServers(data || []); };
  const checkFavorite = async () => { if (!forumUser || !game) return; const { data } = await supabase.from("forum_game_favorites").select("id").eq("game_id", game.id).eq("forum_user_id", forumUser.id).single(); setIsFavorited(!!data); };
  const toggleFavorite = async () => { if (!forumUser || !game) { toast({ title: "Please login to favorite", variant: "destructive" }); return; } if (isFavorited) { await supabase.from("forum_game_favorites").delete().eq("game_id", game.id).eq("forum_user_id", forumUser.id); setIsFavorited(false); } else { await supabase.from("forum_game_favorites").insert({ game_id: game.id, forum_user_id: forumUser.id }); setIsFavorited(true); } };
  const handleSaveEdit = async () => { if (!game) return; const { error } = await supabase.from("forum_games").update({ title: editForm.title, description: editForm.description || null, category: editForm.category }).eq("id", game.id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Game updated" }); setIsEditing(false); fetchGame(); } };
  const handleSubmitComment = async () => { if (!forumUser || !game || !newComment.trim()) return; setSubmittingComment(true); await supabase.from("forum_game_comments").insert({ game_id: game.id, author_id: forumUser.id, content: newComment.trim() }); setNewComment(""); fetchComments(game.id); setSubmittingComment(false); };
  const handleDeleteComment = async (commentId: string) => { await supabase.from("forum_game_comments").update({ is_deleted: true, deleted_by: forumUser?.id, deleted_at: new Date().toISOString() }).eq("id", commentId); if (game) fetchComments(game.id); };
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !game) return;
    setUploadingThumbnail(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `game-thumbnails/${game.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('forum-uploads').upload(path, file, { upsert: true });
      if (uploadError) { 
        console.error('Upload error:', uploadError);
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); 
        setUploadingThumbnail(false); 
        return; 
      }
      const { data: urlData } = supabase.storage.from('forum-uploads').getPublicUrl(path);
      await supabase.from("forum_games").update({ thumbnail_url: urlData.publicUrl, thumbnail_status: 'pending' }).eq("id", game.id);
      toast({ title: "Thumbnail uploaded", description: "Pending review" });
      fetchGame();
    } catch (err: any) {
      console.error('Upload exception:', err);
      toast({ title: "Upload failed", description: err.message || "Unknown error", variant: "destructive" });
    }
    setUploadingThumbnail(false);
  };

  if (loading || authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!game) return <div className="max-w-4xl mx-auto p-6 text-center"><AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" /><h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Game Not Found</h1><Link to="/games"><Button>Back to Games</Button></Link></div>;

  const canEdit = forumUser && (forumUser.id === game.creator_id || isAdmin);
  // Games are playable by default - only blocked when admin explicitly flags as under_review
  const isUnderReview = game.is_under_review === true;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))] flex items-center justify-center relative">
          {game.thumbnail_url ? <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" /> : <Gamepad2 className="w-16 h-16 text-white/50" />}
          {canEdit && (
            <label className="absolute bottom-3 right-3 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingThumbnail} />
              <span className="px-3 py-1.5 bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text))] text-sm rounded-lg border border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))] transition">{uploadingThumbnail ? "Uploading..." : "Change Thumbnail"}</span>
            </label>
          )}
        </div>
        <div className="p-6 space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Game Title" />
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
              <div className="flex gap-2"><Button onClick={handleSaveEdit}>Save</Button><Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button></div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">{game.title}</h1>
                  <Link to={`/id/${game.creator?.username}/profile`} className="text-[hsl(var(--bc-primary))] hover:underline text-sm">by {game.creator?.username}</Link>
                </div>
                {canEdit && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>}
              </div>
              {game.description && <p className="text-[hsl(var(--bc-text-muted))]">{game.description}</p>}
              {game.thumbnail_status === 'denied' && game.thumbnail_denial_reason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  <strong>Thumbnail Denied:</strong> {game.thumbnail_denial_reason}
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-6 text-sm text-[hsl(var(--bc-text-muted))]">
            <span>{game.play_count || 0} plays</span>
            <span>{game.favorite_count || 0} favorites</span>
            <span className="px-2 py-0.5 bg-[hsl(var(--bc-bg-light))] rounded">{game.category}</span>
          </div>
          <div className="flex gap-3 pt-4 border-t border-[hsl(var(--bc-border))]">
            {isUnderReview ? (
              <Button className="flex-1" disabled>This game is under review</Button>
            ) : (
              <Button className="flex-1">Play Now</Button>
            )}
            <Button variant="outline" onClick={toggleFavorite} className={isFavorited ? "text-red-500" : ""}>♥</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
        <div className="flex border-b border-[hsl(var(--bc-border))]">
          <button onClick={() => setActiveTab('comments')} className={`flex-1 py-3 text-center font-medium transition ${activeTab === 'comments' ? 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]' : 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'}`}>Comments ({comments.length})</button>
          <button onClick={() => setActiveTab('servers')} className={`flex-1 py-3 text-center font-medium transition ${activeTab === 'servers' ? 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]' : 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'}`}>Servers ({servers.length})</button>
        </div>
        <div className="p-6">
          {activeTab === 'comments' && (
            <>
              {forumUser ? (
                <div className="flex gap-3 mb-6">
                  <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()} />
                  <Button onClick={handleSubmitComment} disabled={submittingComment || !newComment.trim()}>{submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}</Button>
                </div>
              ) : <p className="text-[hsl(var(--bc-text-muted))] mb-6"><Link to="/login" className="text-[hsl(var(--bc-primary))] hover:underline">Login</Link> to comment</p>}
              <div className="space-y-4">
                {comments.length === 0 ? <p className="text-center text-[hsl(var(--bc-text-muted))] py-8">No comments yet</p> : comments.map((c) => (
                  <div key={c.id} className="flex gap-3 p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg">
                    <img src={c.author?.avatar_url || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Link to={`/id/${c.author?.username}/profile`} className="font-medium text-[hsl(var(--bc-text))]">{c.author?.username}</Link>
                        {(forumUser?.id === c.author_id || isAdmin) && <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 text-sm hover:underline">Delete</button>}
                      </div>
                      <p className="text-[hsl(var(--bc-text-muted))] text-sm">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {activeTab === 'servers' && (
            <div className="space-y-3">
              {servers.length === 0 ? <p className="text-center text-[hsl(var(--bc-text-muted))] py-8">No active servers</p> : servers.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg">
                  <div>
                    <p className="font-medium text-[hsl(var(--bc-text))]">{s.name}</p>
                    <p className="text-sm text-[hsl(var(--bc-text-muted))]">{s.player_count}/{s.max_players} players</p>
                  </div>
                  <Button size="sm" disabled={isUnderReview}>Join</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline SettingsLayout component - passes context through to settings pages
function SettingsLayout() {
  // Preserve the parent <Route element> context (ForumLayout) so settings pages
  // can keep using useOutletContext() without rendering blank.
  const outletContext = useOutletContext<any>();
  
  return <Outlet context={outletContext} />;
}

// Inline SettingsPrivacy component - Full page for DMs and wall visibility
function SettingsPrivacy() {
  const { forumUser, loading: authLoading, refreshForumUser } = useForumAuth();
  const { toast } = useToast();
  const [allowDms, setAllowDms] = useState(true);
  const [wallIsPrivate, setWallIsPrivate] = useState(false);
  const [hideThreads, setHideThreads] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (forumUser) {
      setAllowDms(forumUser.allow_dms !== false);
      setWallIsPrivate((forumUser as any).wall_is_private === true);
      setHideThreads((forumUser as any).hide_threads === true);
    }
  }, [forumUser]);

  const handleSave = async () => {
    if (!forumUser) return;
    setSaving(true);
    const { error } = await supabase.from("forum_users").update({ 
      allow_dms: allowDms, 
      wall_is_private: wallIsPrivate,
      hide_threads: hideThreads 
    }).eq("id", forumUser.id);
    if (error) toast({ title: "Error saving settings", variant: "destructive" });
    else { toast({ title: "Privacy settings saved" }); refreshForumUser(); }
    setSaving(false);
  };

  if (authLoading) return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!forumUser) return <div className="max-w-2xl mx-auto p-6 text-center"><p className="text-[hsl(var(--bc-text-muted))]">Please login to access settings.</p><Link to="/login"><Button className="mt-4">Login</Button></Link></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Privacy Settings</h1>
        <p className="text-[hsl(var(--bc-text-muted))]">Control who can interact with you and what they can see</p>
      </div>
      
      {/* Direct Messages */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 space-y-6">
        <h3 className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Direct Messages
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[hsl(var(--bc-text))]">Allow Direct Messages</h4>
            <p className="text-sm text-[hsl(var(--bc-text-muted))]">Let other users send you private messages</p>
          </div>
          <button onClick={() => setAllowDms(!allowDms)} className={`w-12 h-6 rounded-full transition ${allowDms ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-bg-light))]'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition transform ${allowDms ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 space-y-6">
        <h3 className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
          <LockIcon className="w-5 h-5" />
          Profile Visibility
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[hsl(var(--bc-text))]">Private Profile Wall</h4>
            <p className="text-sm text-[hsl(var(--bc-text-muted))]">Only friends can see and post on your wall</p>
          </div>
          <button onClick={() => setWallIsPrivate(!wallIsPrivate)} className={`w-12 h-6 rounded-full transition ${wallIsPrivate ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-bg-light))]'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition transform ${wallIsPrivate ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[hsl(var(--bc-text))]">Hide Forum Threads</h4>
            <p className="text-sm text-[hsl(var(--bc-text-muted))]">Hide your threads from your public profile</p>
          </div>
          <button onClick={() => setHideThreads(!hideThreads)} className={`w-12 h-6 rounded-full transition ${hideThreads ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-bg-light))]'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition transform ${hideThreads ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Privacy Settings"}</Button>
    </div>
  );
}

// Inline SettingsSecurity component - Full page for 2FA and PINs
function SettingsSecurity() {
  const { forumUser, loading: authLoading, refreshForumUser, emailVerified } = useForumAuth();
  const { toast } = useToast();
  const [dmPin, setDmPin] = useState("");
  const [settingsPin, setSettingsPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    if (forumUser) {
      setDmPin((forumUser as any).dm_pin || "");
      setSettingsPin((forumUser as any).settings_pin || "");
    }
  }, [forumUser]);

  const handleSavePin = async (type: 'dm' | 'settings') => {
    if (!forumUser) return;
    setSavingPin(true);
    const pin = type === 'dm' ? dmPin : settingsPin;
    if (pin && (pin.length !== 4 || !/^\d+$/.test(pin))) {
      toast({ title: "PIN must be 4 digits", variant: "destructive" });
      setSavingPin(false);
      return;
    }
    const update: any = type === 'dm' ? { dm_pin: pin || null } : { settings_pin: pin || null };
    const { error } = await supabase.from("forum_users").update(update).eq("id", forumUser.id);
    if (error) toast({ title: "Error saving PIN", variant: "destructive" });
    else { toast({ title: `${type === 'dm' ? 'DM' : 'Settings'} PIN ${pin ? 'saved' : 'removed'}` }); refreshForumUser(); }
    setSavingPin(false);
  };

  if (authLoading) return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!forumUser) return <div className="max-w-2xl mx-auto p-6 text-center"><p className="text-[hsl(var(--bc-text-muted))]">Please login to access settings.</p><Link to="/login"><Button className="mt-4">Login</Button></Link></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Security Settings</h1>
        <p className="text-[hsl(var(--bc-text-muted))]">Protect your account with additional security measures</p>
      </div>
      
      {/* Two-Factor Authentication - Full component */}
      <TwoFactorSetup forumUserId={forumUser.id} emailVerified={emailVerified} />

      {/* DM Encryption PIN */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
            <LockIcon className="w-5 h-5" />
            DM Encryption PIN
          </h3>
          <p className="text-sm text-[hsl(var(--bc-text-muted))]">Required to view your direct messages. Keep this safe!</p>
        </div>
        <div className="flex gap-3">
          <Input 
            type="password" 
            value={dmPin} 
            onChange={(e) => setDmPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
            placeholder="4-digit PIN" 
            maxLength={4} 
            className="flex-1" 
          />
          <Button onClick={() => handleSavePin('dm')} disabled={savingPin}>
            {savingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
        {dmPin && (
          <Button variant="outline" size="sm" onClick={() => { setDmPin(''); handleSavePin('dm'); }}>
            Remove DM PIN
          </Button>
        )}
      </div>

      {/* Settings PIN */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Settings PIN
          </h3>
          <p className="text-sm text-[hsl(var(--bc-text-muted))]">Required to make sensitive account changes</p>
        </div>
        <div className="flex gap-3">
          <Input 
            type="password" 
            value={settingsPin} 
            onChange={(e) => setSettingsPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
            placeholder="4-digit PIN" 
            maxLength={4} 
            className="flex-1" 
          />
          <Button onClick={() => handleSavePin('settings')} disabled={savingPin}>
            {savingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
        {settingsPin && (
          <Button variant="outline" size="sm" onClick={() => { setSettingsPin(''); handleSavePin('settings'); }}>
            Remove Settings PIN
          </Button>
        )}
      </div>
    </div>
  );
}

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
    try {
      const { data, error } = await supabase.rpc('convert_currency', {
        p_direction: direction,
        p_amount: inputAmount
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; output_amount?: number };
      if (result && !result.success) {
        toast({ title: "Conversion Failed", description: result.error || "Unknown error", variant: "destructive" });
      } else if (result?.success) {
        toast({ 
          title: "Conversion Successful", 
          description: direction === "coins-to-cash" 
            ? `Converted ${inputAmount} coins to $${result.output_amount} cash` 
            : `Converted $${inputAmount} to ${result.output_amount} coins` 
        });
        setAmount("");
        refreshForumUser();
      }
    } catch (err: any) {
      toast({ title: "Conversion Failed", description: err.message, variant: "destructive" });
    }
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

// Inline Upgrades component with Stripe payments
function Upgrades() {
  const { user, forumUser, loading: authLoading, refreshForumUser } = useForumAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [fulfillingPurchase, setFulfillingPurchase] = useState(false);
  const [subscription, setSubscription] = useState<{ subscribed: boolean; tier: string | null; subscription_end: string | null } | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);

  // Membership tiers with GBP pricing and comprehensive benefits
  const tiers = [
    { 
      id: 'bronze', 
      name: 'Bronze', 
      priceGBP: 4.99,
      dailyCoins: 15,
      dailyCash: 0,
      color: 'from-amber-700 to-amber-900', 
      textColor: 'text-amber-600',
      borderColor: 'border-amber-500',
      iconBg: 'bg-gradient-to-br from-amber-600 to-amber-800',
      achievementImage: 'https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/forum-avatars/achievements/achievement_1770282152023.png',
      benefits: [
        { label: 'Daily Coins', value: '15 Coins/day', icon: 'coins' },
        { label: 'Bronze Badge', value: 'Profile & Posts', icon: 'badge' },
        { label: 'Groups', value: 'Create up to 5', icon: 'groups' },
        { label: 'Places', value: 'Up to 10 active', icon: 'places' },
        { label: 'Trading', value: 'Standard items only', icon: 'trading' },
        { label: 'Marketplace Fee', value: '10% discount', icon: 'discount' },
      ]
    },
    { 
      id: 'silver', 
      name: 'Silver', 
      priceGBP: 9.99,
      dailyCoins: 35,
      dailyCash: 1,
      color: 'from-gray-400 to-gray-600', 
      textColor: 'text-gray-400',
      borderColor: 'border-gray-400',
      iconBg: 'bg-gradient-to-br from-gray-400 to-gray-600',
      achievementImage: 'https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/forum-avatars/achievements/achievement_1770282205790.png',
      benefits: [
        { label: 'Daily Coins', value: '35 Coins/day', icon: 'coins' },
        { label: 'Daily Cash', value: '$1/day', icon: 'cash' },
        { label: 'Silver Badge', value: 'Profile & Posts', icon: 'badge' },
        { label: 'Groups', value: 'Create up to 10', icon: 'groups' },
        { label: 'Places', value: 'Up to 25 active', icon: 'places' },
        { label: 'Trading', value: 'Limited items enabled', icon: 'trading' },
        { label: 'Marketplace Fee', value: '15% discount', icon: 'discount' },
        { label: 'Bonus', value: 'Priority support', icon: 'star' },
      ]
    },
    { 
      id: 'gold', 
      name: 'Gold', 
      priceGBP: 19.99,
      popular: true,
      dailyCoins: 60,
      dailyCash: 3,
      color: 'from-yellow-400 to-yellow-600', 
      textColor: 'text-yellow-500',
      borderColor: 'border-yellow-500',
      iconBg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      achievementImage: 'https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/forum-avatars/achievements/achievement_1770282253918.png',
      benefits: [
        { label: 'Daily Coins', value: '60 Coins/day', icon: 'coins' },
        { label: 'Daily Cash', value: '$3/day', icon: 'cash' },
        { label: 'Gold Badge', value: 'Profile & Posts', icon: 'badge' },
        { label: 'Groups', value: 'Create up to 25', icon: 'groups' },
        { label: 'Places', value: 'Up to 50 active', icon: 'places' },
        { label: 'Trading', value: 'All items + faster trades', icon: 'trading' },
        { label: 'Marketplace Fee', value: '25% discount', icon: 'discount' },
        { label: 'Bonus', value: 'Username glow effect', icon: 'glow' },
        { label: 'Access', value: 'Beta features early', icon: 'early' },
      ]
    },
    { 
      id: 'platinum', 
      name: 'Platinum', 
      priceGBP: 25.99,
      dailyCoins: 100,
      dailyCash: 5,
      color: 'from-gray-800 to-black', 
      textColor: 'text-gray-100',
      borderColor: 'border-gray-700',
      iconBg: 'bg-gradient-to-br from-gray-800 to-black',
      achievementImage: 'https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/forum-avatars/achievements/achievement_1769935675116.png',
      benefits: [
        { label: 'Daily Coins', value: '100 Coins/day', icon: 'coins' },
        { label: 'Daily Cash', value: '$5/day', icon: 'cash' },
        { label: 'Platinum Badge', value: 'Exclusive design', icon: 'badge' },
        { label: 'Groups', value: 'Unlimited creation', icon: 'groups' },
        { label: 'Places', value: 'Unlimited active', icon: 'places' },
        { label: 'Trading', value: 'Instant trades + exclusive', icon: 'trading' },
        { label: 'Marketplace Fee', value: '50% discount', icon: 'discount' },
        { label: 'Experience', value: 'Completely ad-free', icon: 'noads' },
        { label: 'Access', value: 'VIP events & drops', icon: 'vip' },
        { label: 'Bonus', value: 'Monthly exclusive item', icon: 'gift' },
      ]
    }
  ];

  // Currency packs for purchase
  const currencyPacks = [
    { id: 'coins_500', type: 'coins', amount: 500, priceGBP: 2.99, bonus: 0 },
    { id: 'coins_1000', type: 'coins', amount: 1000, priceGBP: 4.99, bonus: 100 },
    { id: 'coins_2500', type: 'coins', amount: 2500, priceGBP: 9.99, bonus: 500 },
    { id: 'coins_5000', type: 'coins', amount: 5000, priceGBP: 17.99, bonus: 1500 },
    { id: 'cash_50', type: 'cash', amount: 50, priceGBP: 4.99, bonus: 0 },
    { id: 'cash_100', type: 'cash', amount: 100, priceGBP: 8.99, bonus: 10 },
    { id: 'cash_250', type: 'cash', amount: 250, priceGBP: 19.99, bonus: 50 },
    { id: 'cash_500', type: 'cash', amount: 500, priceGBP: 34.99, bonus: 150 },
  ];

  useEffect(() => {
    if (user) checkSubscription();
  }, [user]);

  useEffect(() => {
    // Handle success/cancel from Stripe
    const success = searchParams.get('success');
    const tier = searchParams.get('tier');
    const sessionId = searchParams.get('session_id');
    const currencySuccess = searchParams.get('currency_success');
    const packId = searchParams.get('pack');
    
    // Membership subscription success
    if (success === 'true' && tier && sessionId && !fulfillingPurchase) {
      fulfillMembership(tier, sessionId);
    }
    
    // Currency purchase success
    if (currencySuccess === 'true' && packId && sessionId && !fulfillingPurchase) {
      fulfillCurrency(packId, sessionId);
    }
  }, [searchParams]);
  
  const fulfillMembership = async (tier: string, sessionId: string) => {
    setFulfillingPurchase(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-notification', {
        body: { action: 'fulfill-membership', tier, sessionId }
      });
      if (error) throw error;
      
      if (data?.already_active) {
        toast({ title: 'Already Active', description: `You're already on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan.` });
      } else {
        const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
        toast({ 
          title: `${tierName} Membership Activated!`, 
          description: `You've received ${data?.coins_awarded || 0} coins and $${data?.cash_awarded || 0} cash as your first day's reward!` 
        });
      }
      checkSubscription();
      refreshForumUser();
      // Clear URL params
      window.history.replaceState({}, '', '/upgrades');
    } catch (err: any) {
      console.error('Failed to fulfill membership:', err);
      toast({ title: 'Error', description: err.message || 'Failed to activate membership', variant: 'destructive' });
    }
    setFulfillingPurchase(false);
  };
  
  const fulfillCurrency = async (packId: string, sessionId: string) => {
    setFulfillingPurchase(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-notification', {
        body: { action: 'fulfill-currency', packId, sessionId }
      });
      if (error) throw error;
      
      if (data?.already_fulfilled) {
        toast({ title: 'Already Claimed', description: 'This purchase has already been fulfilled.' });
      } else {
        const currencyName = data?.type === 'coins' ? 'Coins' : 'Cash';
        const symbol = data?.type === 'coins' ? '' : '$';
        toast({ 
          title: 'Purchase Complete!', 
          description: `${symbol}${data?.amount?.toLocaleString()} ${currencyName} have been added to your account!` 
        });
      }
      refreshForumUser();
      // Clear URL params
      window.history.replaceState({}, '', '/upgrades');
    } catch (err: any) {
      console.error('Failed to fulfill currency:', err);
      toast({ title: 'Error', description: err.message || 'Failed to award currency', variant: 'destructive' });
    }
    setFulfillingPurchase(false);
  };

  const checkSubscription = async () => {
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-notification', {
        body: { action: 'check-subscription' }
      });
      if (!error && data) {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
    setCheckingSubscription(false);
  };

  const handlePurchase = async (tierId: string) => {
    if (!user) return;
    setPurchasing(tierId);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-notification', {
        body: { action: 'create-checkout', tier: tierId }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to start checkout', variant: 'destructive' });
    }
    setPurchasing(null);
  };

  const handleCurrencyPurchase = async (packId: string) => {
    if (!user) return;
    setPurchasing(packId);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-notification', {
        body: { action: 'create-currency-checkout', packId }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to start checkout', variant: 'destructive' });
    }
    setPurchasing(null);
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-notification', {
        body: { action: 'customer-portal' }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to open subscription management', variant: 'destructive' });
    }
    setManagingSubscription(false);
  };

  if (authLoading || checkingSubscription) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }

  if (!user || !forumUser) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Login Required</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-4">You must be logged in to view upgrades.</p>
          <Link to="/login"><Button>Login</Button></Link>
        </div>
      </div>
    );
  }

  const currentTier = subscription?.tier || forumUser.membership_tier;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--bc-text))] mb-3">
          Upgrade Your Experience
        </h1>
        <p className="text-[hsl(var(--bc-text-muted))] text-lg max-w-2xl mx-auto">
          Unlock exclusive perks, badges, and features with a BLOX City membership
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription?.subscribed && (
        <div className="bg-gradient-to-r from-[hsl(var(--bc-primary))]/10 to-[hsl(var(--bc-accent))]/10 border border-[hsl(var(--bc-primary))]/30 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">
                  Active {subscription.tier?.charAt(0).toUpperCase()}{subscription.tier?.slice(1)} Membership
                </h3>
                <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                  Renews on {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              variant="outline"
            >
              {managingSubscription ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Manage Subscription
            </Button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {tiers.map((tier) => {
          const isActive = currentTier === tier.id;
          return (
            <div 
              key={tier.id} 
              className={`relative bg-[hsl(var(--bc-bg-card))] border-2 rounded-2xl p-6 flex flex-col transition-all hover:shadow-xl ${
                isActive ? tier.borderColor + ' shadow-lg' : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))]/50'
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && !isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-[hsl(var(--bc-primary))] text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Active Badge */}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> YOUR PLAN
                  </span>
                </div>
              )}

              {/* Achievement Badge Image */}
              <div className="w-20 h-20 mx-auto mb-4">
                <img 
                  src={tier.achievementImage} 
                  alt={`${tier.name} Badge`} 
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>

              {/* Name & Price */}
              <h3 className={`text-2xl font-bold text-center ${tier.textColor} mb-1`}>{tier.name}</h3>
              
              {/* Daily Stipend Highlight */}
              <div className="text-center mb-3">
                <span className="text-sm text-[hsl(var(--bc-text-muted))]">
                  {tier.dailyCoins > 0 && <span className="text-yellow-500 font-medium">{tier.dailyCoins} Coins</span>}
                  {tier.dailyCash > 0 && <span className="text-green-500 font-medium">{tier.dailyCoins > 0 ? ' + ' : ''}${tier.dailyCash} Cash</span>}
                  <span className="text-[hsl(var(--bc-text-muted))]"> daily</span>
                </span>
              </div>
              
              <div className="text-center mb-5">
                <span className="text-3xl font-bold text-[hsl(var(--bc-text))]">£{tier.priceGBP}</span>
                <span className="text-[hsl(var(--bc-text-muted))]">/month</span>
              </div>

              {/* Benefits Grid */}
              <div className="space-y-2.5 flex-1 mb-6">
                {tier.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-[hsl(var(--bc-bg-light))]/50">
                    <span className="text-[hsl(var(--bc-text-muted))]">{benefit.label}</span>
                    <span className="font-medium text-[hsl(var(--bc-text))]">{benefit.value}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button 
                onClick={() => handlePurchase(tier.id)}
                disabled={isActive || !!purchasing}
                className={`w-full ${isActive ? '' : `bg-gradient-to-r ${tier.color} hover:opacity-90`}`}
                variant={isActive ? 'outline' : 'default'}
              >
                {purchasing === tier.id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : isActive ? (
                  'Current Plan'
                ) : (
                  `Subscribe to ${tier.name}`
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Currency Packs Section */}
      <div className="pt-8 border-t border-[hsl(var(--bc-border))]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">
            Buy Currency
          </h2>
          <p className="text-[hsl(var(--bc-text-muted))]">
            Purchase Coins and Cash to use in the marketplace
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Coins Packs */}
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              Coins
            </h3>
            <div className="space-y-3">
              {currencyPacks.filter(p => p.type === 'coins').map((pack) => (
                <div 
                  key={pack.id}
                  className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 flex items-center justify-between hover:border-yellow-500/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-[hsl(var(--bc-text))]">
                        {pack.amount.toLocaleString()} Coins
                        {pack.bonus > 0 && (
                          <span className="ml-2 text-green-500 text-sm">+{pack.bonus.toLocaleString()} Bonus!</span>
                        )}
                      </div>
                      <div className="text-sm text-[hsl(var(--bc-text-muted))]">
                        £{pack.priceGBP.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:opacity-90"
                    onClick={() => handleCurrencyPurchase(pack.id)}
                    disabled={!!purchasing}
                  >
                    {purchasing === pack.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Packs */}
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Cash
            </h3>
            <div className="space-y-3">
              {currencyPacks.filter(p => p.type === 'cash').map((pack) => (
                <div 
                  key={pack.id}
                  className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 flex items-center justify-between hover:border-green-500/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-[hsl(var(--bc-text))]">
                        ${pack.amount.toLocaleString()} Cash
                        {pack.bonus > 0 && (
                          <span className="ml-2 text-green-500 text-sm">+${pack.bonus.toLocaleString()} Bonus!</span>
                        )}
                      </div>
                      <div className="text-sm text-[hsl(var(--bc-text-muted))]">
                        £{pack.priceGBP.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-green-700 hover:opacity-90"
                    onClick={() => handleCurrencyPurchase(pack.id)}
                    disabled={!!purchasing}
                  >
                    {purchasing === pack.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[hsl(var(--bc-primary))] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[hsl(var(--bc-text-muted))]">
            <p className="font-medium text-[hsl(var(--bc-text))] mb-2">Payment Information</p>
            <ul className="space-y-1">
              <li>• All payments are processed securely via Stripe</li>
              <li>• Subscriptions renew automatically each month</li>
              <li>• Cancel anytime from your subscription management page</li>
              <li>• Membership benefits and currency are applied instantly after purchase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
// Inline Support component to avoid module persistence issues  
function Support() {
  const { user, forumUser, loading: authLoading } = useForumAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { if (forumUser) fetchTickets(); }, [forumUser]);
  useEffect(() => { if (selectedTicket) fetchMessages(); }, [selectedTicket]);

  const fetchTickets = async () => {
    if (!forumUser) return;
    setLoading(true);
    const { data } = await supabase.from('forum_support_tickets').select('*').eq('creator_id', forumUser.id).order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!selectedTicket) return;
    const { data } = await supabase.from('forum_ticket_messages').select('*').eq('ticket_id', selectedTicket.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleCreateTicket = async () => {
    if (!forumUser || !newSubject.trim() || !newDescription.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from('forum_support_tickets').insert({ creator_id: forumUser.id, subject: newSubject.trim(), status: 'open' }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { await supabase.from('forum_ticket_messages').insert({ ticket_id: data.id, sender_id: forumUser.id, content: newDescription.trim(), is_staff_reply: false }); toast({ title: 'Ticket Created' }); setShowCreate(false); setNewSubject(''); setNewDescription(''); fetchTickets(); }
    setCreating(false);
  };

  const handleSendMessage = async () => {
    if (!forumUser || !selectedTicket || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from('forum_ticket_messages').insert({ ticket_id: selectedTicket.id, sender_id: forumUser.id, content: newMessage.trim(), is_staff_reply: false });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { setNewMessage(''); fetchMessages(); }
    setSending(false);
  };

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!user || !forumUser) return <div className="max-w-2xl mx-auto p-6"><div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center"><AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" /><h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Login Required</h1><p className="text-[hsl(var(--bc-text-muted))] mb-4">You must be logged in to access support.</p><Link to="/login"><Button>Login</Button></Link></div></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Support Center</h1><p className="text-[hsl(var(--bc-text-muted))]">Get help from our team</p></div><Button onClick={() => setShowCreate(true)}>New Ticket</Button></div>
      
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Create Support Ticket</h2>
            <div><Label>Subject</Label><Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Brief description of your issue" maxLength={100} /></div>
            <div><Label>Description</Label><Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Provide details about your issue..." className="min-h-[120px]" maxLength={2000} /></div>
            <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreateTicket} disabled={creating || !newSubject.trim() || !newDescription.trim()}>{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}</Button></div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h2 className="font-semibold text-[hsl(var(--bc-text))] mb-3">Your Tickets</h2>
          {loading ? <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--bc-primary))]" /> : tickets.length === 0 ? <p className="text-[hsl(var(--bc-text-muted))] text-sm">No tickets yet</p> : tickets.map(t => (
            <button key={t.id} onClick={() => setSelectedTicket(t)} className={`w-full text-left p-3 rounded-lg border transition ${selectedTicket?.id === t.id ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10' : 'border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg-card))] hover:border-[hsl(var(--bc-primary))]/50'}`}>
              <p className="font-medium text-[hsl(var(--bc-text))] text-sm truncate">{t.subject}</p>
              <p className="text-xs text-[hsl(var(--bc-text-muted))]">{t.status}</p>
            </button>
          ))}
        </div>
        <div className="md:col-span-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 min-h-[400px] flex flex-col">
          {selectedTicket ? (
            <>
              <div className="border-b border-[hsl(var(--bc-border))] pb-3 mb-3"><h3 className="font-semibold text-[hsl(var(--bc-text))]">{selectedTicket.subject}</h3><p className="text-sm text-[hsl(var(--bc-text-muted))]">{selectedTicket.status}</p></div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">{messages.map(m => (
                <div key={m.id} className={`p-3 rounded-lg ${m.is_staff_reply ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-[hsl(var(--bc-bg-light))]'}`}>
                  <p className="text-xs text-[hsl(var(--bc-text-muted))] mb-1">{m.is_staff_reply ? 'Staff' : 'You'}</p>
                  <p className="text-[hsl(var(--bc-text))] text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}</div>
              {selectedTicket.status !== 'closed' && (
                <div className="flex gap-2"><Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1" rows={2} /><Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}</Button></div>
              )}
            </>
          ) : <div className="flex-1 flex items-center justify-center text-[hsl(var(--bc-text-muted))]">Select a ticket to view</div>}
        </div>
      </div>
    </div>
  );
}

// Inline SuspendedPage component  
function SuspendedPage() {
  const { forumUser, loading: authLoading, refreshForumUser } = useForumAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--bc-body-bg))' }}><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!forumUser?.is_suspended) { navigate('/'); return null; }

  const suspensionEndsAt = forumUser.suspension_ends_at ? new Date(forumUser.suspension_ends_at) : null;
  const isPermanent = !suspensionEndsAt;
  const isExpired = suspensionEndsAt && suspensionEndsAt < new Date();

  const handleReactivate = async () => {
    if (!agreed || !isExpired) return;
    setReactivating(true);
    const { error } = await supabase.from('forum_users').update({ is_suspended: false, suspension_reason: null, suspension_ends_at: null }).eq('id', forumUser.id);
    if (error) toast({ title: 'Reactivation Failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Account Reactivated', description: 'Welcome back!' }); await refreshForumUser(); navigate('/'); }
    setReactivating(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      <div className="w-full max-w-lg">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-10 h-10 text-red-500" /></div>
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Account Suspended</h1>
            <div className="mb-6">
              {isPermanent ? <span className="inline-block px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm font-medium">Permanent Ban</span>
               : isExpired ? <span className="inline-block px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">Suspension Expired</span>
               : <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-medium">Until {new Date(forumUser.suspension_ends_at!).toLocaleDateString()}</span>}
            </div>
            <div className="text-left mb-6 p-4 rounded-lg" style={{ background: 'hsl(var(--bc-input-bg))' }}>
              <h3 className="font-medium text-[hsl(var(--bc-text))] mb-2">Reason</h3>
              <p className="text-[hsl(var(--bc-text-muted))] text-sm">{forumUser.suspension_reason || 'No reason provided.'}</p>
            </div>
            {isExpired && !isPermanent && (
              <div className="border-t border-[hsl(var(--bc-border))] pt-6 mt-6">
                <label className="flex items-start gap-3 mb-4 text-left cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
                  <span className="text-sm text-[hsl(var(--bc-text-muted))]">I understand that future violations may result in a permanent ban.</span>
                </label>
                <Button onClick={handleReactivate} disabled={!agreed || reactivating} className="w-full">
                  {reactivating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reactivating...</> : <><CheckCircle className="w-4 h-4 mr-2" />Reactivate Account</>}
                </Button>
              </div>
            )}
            <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-6">Contact support if you believe this was a mistake.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      try {
        // Password reset links redirect back with a short-lived auth code in the URL.
        // We must exchange it for a session before calling updateUser().
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Failed to exchange code for session:', error);
          }
        }

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) setHasValidSession(true);
          setChecking(false);
        });
        subscription = data.subscription;

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) setHasValidSession(true);
        setChecking(false);
      } catch (e) {
        console.error('Reset password init failed:', e);
        setChecking(false);
      }
    };

    void init();

    return () => subscription?.unsubscribe();
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

// Inline MarketItem component to avoid module persistence issues
function MarketItem() {
  // Support both /item/:serialId/:slug and /market/item/:id formats
  const newFormat = window.location.pathname.match(/\/item\/(\d+)\/([^\/]+)/);
  const oldFormat = window.location.pathname.match(/\/market\/item\/([^\/]+)/);
  
  const serialIdParam = newFormat ? parseInt(newFormat[1]) : null;
  const uuidParam = oldFormat ? oldFormat[1] : null;
  
  const { forumUser } = useForumAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [resaleListings, setResaleListings] = useState<any[]>([]);
  const [ownsItem, setOwnsItem] = useState(false);
  const [ownedCopies, setOwnedCopies] = useState<any[]>([]); // Copies NOT for sale
  const [listedCopies, setListedCopies] = useState<any[]>([]); // Copies already listed for sale
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellPrice, setSellPrice] = useState('');
  const [selectedCopyId, setSelectedCopyId] = useState<string>('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'official' | 'reseller'>('official');
  const [selectedResellerId, setSelectedResellerId] = useState<string>('');
  const [bloxCityProfile, setBloxCityProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const CATEGORY_NAMES: Record<string, string> = {
    'hats': 'Hat',
    'faces': 'Face',
    'gear': 'Gadget',
    'shirts': 'Shirt',
    't-shirts': 'T-Shirt',
    'pants': 'Pants',
    'bundles': 'Bundle',
    'accessories': 'Accessory',
  };

  useEffect(() => {
    if (serialIdParam || uuidParam) {
      fetchItem();
    }
  }, [serialIdParam, uuidParam]);

  const fetchComments = async (itemUuid: string) => {
    if (!itemUuid) return;
    setCommentsLoading(true);
    const { data } = await supabase
      .from('marketplace_item_comments')
      .select('*, author:forum_user_id(id, serial_id, username, avatar_url, is_verified, membership_tier)')
      .eq('item_id', itemUuid)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50);
    setComments(data || []);
    setCommentsLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!forumUser) {
      toast({ title: 'Please log in to comment', variant: 'destructive' });
      return;
    }
    if (!comment.trim() || !item) {
      toast({ title: 'Please enter a comment', variant: 'destructive' });
      return;
    }
    setSubmittingComment(true);
    const { error } = await supabase
      .from('marketplace_item_comments')
      .insert({
        item_id: item.id,
        forum_user_id: forumUser.id,
        content: comment.trim()
      });
    if (error) {
      toast({ title: 'Failed to post comment', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Comment posted!' });
      setComment('');
      fetchComments(item.id);
    }
    setSubmittingComment(false);
  };

  const fetchItem = async () => {
    if (!serialIdParam && !uuidParam) return;
    setLoading(true);
    setOwnsItem(false);
    setOwnedCopies([]);
    setListedCopies([]);
    
    let query = supabase.from('marketplace_items').select('*');
    
    if (serialIdParam) {
      query = query.eq('serial_id', serialIdParam);
    } else if (uuidParam) {
      query = query.eq('id', uuidParam);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      console.error('Error fetching item:', error);
      setLoading(false);
      return;
    }
    
    setItem(data);
    
    // Redirect to canonical URL if using old format
    if (uuidParam && data?.serial_id) {
      const slug = data.name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
      navigate(`/item/${data.serial_id}/${slug}`, { replace: true });
    }
    
    // Fetch comments
    fetchComments(data.id);
    
    // Check if current user is admin
    if (forumUser) {
      const { data: adminCheck } = await supabase.rpc('is_admin_user', { _user_id: forumUser.user_id });
      setIsAdmin(!!adminCheck);
    }
    
    // Fetch BLOX City profile for creator display
    const { data: bcProfile } = await supabase
      .from('forum_users')
      .select('id, serial_id, username, avatar_url, is_verified')
      .eq('username', 'BLOX City')
      .maybeSingle();
    
    if (bcProfile) {
      // Check if BLOX City has gold checkmark
      const { data: goldCheck } = await supabase
        .from('forum_gold_checkmarks')
        .select('id')
        .eq('forum_user_id', bcProfile.id)
        .maybeSingle();
      setBloxCityProfile({ ...bcProfile, has_gold: !!goldCheck });
    }
    
    // Fetch resale listings for limited items
    if (data?.is_limited) {
      const { data: resales } = await supabase
        .from('user_inventory')
        .select('*, owner:forum_user_id(id, username, avatar_url, is_verified)')
        .eq('item_id', data.id)
        .eq('is_for_sale', true)
        .order('sale_price_coins', { ascending: true })
        .limit(10);
      setResaleListings(resales || []);
    }
    
    // Check if current user owns this item
    if (forumUser && data) {
      const { data: inventory } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('forum_user_id', forumUser.id)
        .eq('item_id', data.id);
      
      if (inventory && inventory.length > 0) {
        setOwnsItem(true);
        setOwnedCopies(inventory.filter(i => !i.is_for_sale));
        setListedCopies(inventory.filter(i => i.is_for_sale));
        // Default to first unlisted copy, or first listed if all are listed
        const firstUnlisted = inventory.find(i => !i.is_for_sale);
        setSelectedCopyId(firstUnlisted?.id || inventory[0].id);
      }
    }
    
    setLoading(false);
  };

  const handleSaveItem = async () => {
    if (!item || !isAdmin) return;
    setSaving(true);
    const { error } = await supabase
      .from('marketplace_items')
      .update({
        name: editForm.name,
        description: editForm.description,
        is_on_sale: editForm.is_on_sale,
        is_limited: editForm.is_limited,
        limited_stock: editForm.is_limited ? editForm.limited_stock : null,
        offsale_at: editForm.offsale_at || null,
        price_coins: parseInt(editForm.price_coins) || 0,
        price_cash: parseInt(editForm.price_cash) || 0,
        payment_type: editForm.payment_type,
      })
      .eq('id', item.id);
    
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Item updated!' });
      setShowEditModal(false);
      fetchItem();
    }
    setSaving(false);
  };

  const handlePurchase = async () => {
    if (!forumUser || !item) {
      toast({ title: 'Please log in to purchase', variant: 'destructive' });
      return;
    }
    setPurchasing(true);
    const { data, error } = await supabase.rpc('purchase_item', {
      p_item_id: item.id,
      p_use_coins: item.payment_type !== 'cash'
    });
    
    if (error) {
      toast({ title: 'Purchase failed', description: error.message, variant: 'destructive' });
    } else if (data && typeof data === 'object' && 'success' in data && data.success) {
      toast({ title: 'Purchase successful!', description: `You now own ${item.name}` });
      setShowPurchaseModal(false);
      fetchItem();
    } else {
      const errMsg = data && typeof data === 'object' && 'error' in data ? String(data.error) : 'Unknown error';
      toast({ title: 'Purchase failed', description: errMsg, variant: 'destructive' });
    }
    setPurchasing(false);
  };

  const handlePurchaseResale = async (inventoryId: string) => {
    if (!forumUser) {
      toast({ title: 'Please log in to purchase', variant: 'destructive' });
      return;
    }
    setPurchasing(true);
    const { data, error } = await supabase.rpc('purchase_resale_item', {
      p_inventory_id: inventoryId,
      p_use_coins: true
    });
    
    if (error) {
      toast({ title: 'Purchase failed', description: error.message, variant: 'destructive' });
    } else if (data && typeof data === 'object' && 'success' in data && data.success) {
      toast({ title: 'Purchase successful!' });
      setShowPurchaseModal(false);
      fetchItem();
    } else {
      const errMsg = data && typeof data === 'object' && 'error' in data ? String(data.error) : 'Unknown error';
      toast({ title: 'Purchase failed', description: errMsg, variant: 'destructive' });
    }
    setPurchasing(false);
  };

  const handleListForSale = async () => {
    if (!selectedCopyId || !sellPrice) {
      toast({ title: 'Please select a copy and enter a price', variant: 'destructive' });
      return;
    }
    const price = parseInt(sellPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: 'Invalid price', variant: 'destructive' });
      return;
    }
    
    const { error } = await supabase
      .from('user_inventory')
      .update({ is_for_sale: true, sale_price_coins: price })
      .eq('id', selectedCopyId);
    
    if (error) {
      toast({ title: 'Failed to list item', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Item listed for sale!' });
      setShowSellModal(false);
      setSellPrice('');
      fetchItem();
    }
  };

  const handleRemoveFromSale = async (inventoryId: string) => {
    const { error } = await supabase
      .from('user_inventory')
      .update({ is_for_sale: false, sale_price_coins: null, sale_price_cash: null })
      .eq('id', inventoryId);
    
    if (error) {
      toast({ title: 'Failed to remove listing', variant: 'destructive' });
    } else {
      toast({ title: 'Listing removed' });
      fetchItem();
    }
  };

  const formatNumber = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}K` : String(num);
  const formatPrice = (price: number) => price?.toLocaleString() || '0';
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-2">Item Not Found</h1>
          <Link to="/market" className="text-[hsl(var(--bc-primary))] hover:underline">← Back to Market</Link>
        </div>
      </div>
    );
  }

  const limitedStock = item?.limited_stock ?? null;
  const limitedSold = item?.limited_sold ?? 0;
  const isLimitedSoldOut = item.is_limited && limitedStock !== null && limitedSold >= limitedStock;
  const isLimitedOffSale = item.is_limited && (item.is_on_sale === false || (item.offsale_at && new Date(item.offsale_at).getTime() <= Date.now()));
  const canPurchaseOfficial = item.is_on_sale && !isLimitedSoldOut;
  const isOwnedNonLimited = ownsItem && !item.is_limited && item.category !== 'crates';
  const isLimitedResaleEligible = item.is_limited && (isLimitedSoldOut || isLimitedOffSale);

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))]">
      {/* Admin Edit Modal */}
      {showEditModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--bc-border))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Edit Item</h3>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--bc-bg))]">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div><Label>Name</Label><Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price (Coins)</Label><Input type="number" value={editForm.price_coins || 0} onChange={(e) => setEditForm({ ...editForm, price_coins: e.target.value })} className="mt-1" /></div>
                <div><Label>Price (Cash)</Label><Input type="number" value={editForm.price_cash || 0} onChange={(e) => setEditForm({ ...editForm, price_cash: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label>Payment Type</Label><select value={editForm.payment_type || 'coins'} onChange={(e) => setEditForm({ ...editForm, payment_type: e.target.value })} className="w-full mt-1 h-9 px-3 border border-[hsl(var(--bc-border))] rounded-lg bg-[hsl(var(--bc-bg))] text-[hsl(var(--bc-text))]"><option value="coins">Coins Only</option><option value="cash">Cash Only</option><option value="both">Both</option></select></div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.is_on_sale ?? true} onChange={(e) => setEditForm({ ...editForm, is_on_sale: e.target.checked })} /> On Sale</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.is_limited ?? false} onChange={(e) => setEditForm({ ...editForm, is_limited: e.target.checked })} /> Limited</label>
              </div>
              {editForm.is_limited && <div><Label>Stock Limit</Label><Input type="number" value={editForm.limited_stock || ''} onChange={(e) => setEditForm({ ...editForm, limited_stock: e.target.value })} className="mt-1" /></div>}
              <div><Label>Offsale At (optional)</Label><Input type="datetime-local" value={editForm.offsale_at ? new Date(editForm.offsale_at).toISOString().slice(0, 16) : ''} onChange={(e) => setEditForm({ ...editForm, offsale_at: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[hsl(var(--bc-border))]">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleSaveItem} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--bc-border))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Confirm Purchase</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--bc-bg))]">
                <span className="text-[hsl(var(--bc-text-muted))]">×</span>
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                Are you sure you want to buy <span className="font-semibold text-[hsl(var(--bc-text))]">{item.name}</span> for{' '}
                <span className="font-semibold">
                  {item.payment_type === 'cash' ? `$${formatPrice(item.price_cash)}` : `${formatPrice(item.price_coins)} Coins`}
                </span>?
              </p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[hsl(var(--bc-border))]">
              <Button onClick={handlePurchase} disabled={purchasing}>
                {purchasing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && item.is_limited && ownedCopies.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--bc-border))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Sell</h3>
              <button onClick={() => setShowSellModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--bc-bg))]">
                <span className="text-[hsl(var(--bc-text-muted))]">×</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">Which Copy</label>
                  <select
                    value={selectedCopyId}
                    onChange={(e) => setSelectedCopyId(e.target.value)}
                    className="w-full mt-1 h-9 px-3 text-sm border border-[hsl(var(--bc-border))] rounded-lg bg-[hsl(var(--bc-bg))] text-[hsl(var(--bc-text))]"
                  >
                    {ownedCopies.map(copy => (
                      <option key={copy.id} value={copy.id}>Copy #{copy.serial_number || '?'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">Price (Coins)</label>
                  <Input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="Price"
                    className="mt-1 h-9"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[hsl(var(--bc-border))]">
              <Button onClick={handleListForSale}>
                Sell
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Image & Stats */}
          <div className="lg:col-span-5 space-y-4">
            {/* Item Image Card */}
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
              <div className="relative p-4">
                {/* Badges */}
                <div className="absolute top-3 left-3 space-y-1 z-10">
                  {item.is_limited && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500 text-white text-xs font-semibold">
                        ⭐ Rare
                      </span>
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-white text-xs font-semibold ${isLimitedSoldOut ? 'bg-red-500' : 'bg-red-500'}`}>
                          {isLimitedSoldOut ? 'SOLD OUT' : `${item.limited_stock - (item.limited_sold || 0)} LEFT`}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Item thumbnail */}
                <div className="aspect-square bg-[hsl(var(--bc-bg))] rounded-lg flex items-center justify-center">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-contain" />
                  ) : (
                    <Gamepad2 className="w-32 h-32 text-[hsl(var(--bc-text-muted))]/30" />
                  )}
                </div>
              </div>

              {/* Owned banner */}
              {ownsItem && (
                <div className="flex items-center justify-center gap-2 bg-green-500 text-white text-sm font-semibold py-2">
                  🎉 Yahoo! You own this item.
                </div>
              )}
            </div>

            {/* Statistics Card */}
            <div>
              <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Statistics</h3>
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">Date Created</div>
                    <div className="font-semibold text-[hsl(var(--bc-text))]">{formatDate(item.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">Last Updated</div>
                    <div className="font-semibold text-[hsl(var(--bc-text))]">{formatDate(item.updated_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">Type</div>
                    <div className="font-semibold text-[hsl(var(--bc-text))]">{CATEGORY_NAMES[item.category] || item.category}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">Owners</div>
                    <div className="font-semibold text-[hsl(var(--bc-text))]">{formatNumber(item.owner_count || 0)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Private Sellers - only for sold out limiteds */}
            {item.is_limited && isLimitedSoldOut && (
              <div>
                <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Private Sellers</h3>
                <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
                  {resaleListings.length === 0 ? (
                    <p className="p-4 text-center text-[hsl(var(--bc-text-muted))]">No one is currently reselling this item.</p>
                  ) : (
                    <div className="divide-y divide-[hsl(var(--bc-border))]">
                      {resaleListings.map((listing) => (
                        <div key={listing.id} className="flex items-center gap-4 p-4">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-12 h-12 rounded-full bg-[hsl(var(--bc-bg))] flex items-center justify-center overflow-hidden">
                              {listing.owner?.avatar_url ? (
                                <img src={listing.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg font-bold text-[hsl(var(--bc-text-muted))]">
                                  {listing.owner?.username?.[0]?.toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-[hsl(var(--bc-text))]">{listing.owner?.username}</span>
                                {listing.owner?.is_verified && (
                                  <BadgeCheck className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                                Serial #{listing.serial_number || '?'}
                              </div>
                            </div>
                          </div>
                          {forumUser?.id !== listing.forum_user_id ? (
                            <Button
                              onClick={() => handlePurchaseResale(listing.id)}
                              disabled={purchasing}
                              className="text-sm"
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              {formatPrice(listing.sale_price_coins)}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleRemoveFromSale(listing.id)}
                              variant="destructive"
                              size="sm"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Info */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Info Card */}
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl font-semibold text-[hsl(var(--bc-text))]">{item.name}</h1>
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => { setEditForm({ ...item }); setShowEditModal(true); }}>
                    Edit Item
                  </Button>
                )}
              </div>

              {/* Creator */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">By</span>
                <Link
                  to={bloxCityProfile ? `/${bloxCityProfile.serial_id}/${bloxCityProfile.username}/profile` : '/market'}
                  className="flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]"
                >
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-bg))] flex items-center justify-center overflow-hidden">
                    {bloxCityProfile?.avatar_url ? (
                      <img src={bloxCityProfile.avatar_url} alt="BLOX City" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-[hsl(var(--bc-primary))]">BC</span>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    BLOX City
                    {bloxCityProfile?.has_gold && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    {bloxCityProfile?.is_verified && (
                      <BadgeCheck className="w-4 h-4 text-green-500" />
                    )}
                  </span>
                </Link>
              </div>

              {/* Already owned message */}
              {ownsItem && !item.is_limited && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-400 font-medium">✓ You already own this item</p>
                </div>
              )}

              {/* Purchase section */}
              {canPurchaseOfficial && (
                <>
                  <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-2">
                    Purchase For
                  </div>
                  <Button
                    onClick={() => setShowPurchaseModal(true)}
                    disabled={isOwnedNonLimited}
                    className="w-full mb-4"
                  >
                    {isOwnedNonLimited
                      ? 'Owned'
                      : item.price_coins === 0 && item.price_cash === 0
                        ? 'Take for Free'
                        : item.payment_type === 'cash'
                          ? <>Buy for <DollarSign className="w-4 h-4 mx-1" /> {formatPrice(item.price_cash)}</>
                          : <>Buy for <Coins className="w-4 h-4 mx-1" /> {formatPrice(item.price_coins)}</>
                    }
                  </Button>
                </>
              )}

              {/* Sell section for owned limiteds that are resale-eligible (sold out or offsale) */}
              {isLimitedResaleEligible && ownsItem && (
                <div className="space-y-3">
                  {/* Show list for sale button if user has unlisted copies */}
                  {ownedCopies.length > 0 && (
                    <>
                      {canPurchaseOfficial && <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-2">or</div>}
                      <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-2">
                        Sell Your Copy
                      </div>
                      <Button
                        onClick={() => setShowSellModal(true)}
                        variant="outline"
                        className="w-full border-[hsl(var(--bc-green))] text-[hsl(var(--bc-green))] hover:bg-[hsl(var(--bc-green))] hover:text-white"
                      >
                        List for Sale
                      </Button>
                    </>
                  )}
                  
                  {/* Show info about already listed copies */}
                  {listedCopies.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                      <p className="text-sm text-amber-400 font-medium mb-1">
                        {listedCopies.length === 1 
                          ? 'You have 1 copy listed for sale' 
                          : `You have ${listedCopies.length} copies listed for sale`}
                      </p>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                        Check Private Sellers below to manage your listing
                      </p>
                    </div>
                  )}
                  
                  {/* If all copies are listed, show a different message */}
                  {ownedCopies.length === 0 && listedCopies.length > 0 && (
                    <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                      All your copies are currently listed for sale
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Description</h3>
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
                <p className="text-sm text-[hsl(var(--bc-text))]">
                  {item.description || <span className="text-[hsl(var(--bc-text-muted))]">This item does not have a description.</span>}
                </p>
              </div>
            </div>

            {/* Comments section */}
            <div>
              <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Comments</h3>
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
                <div className="flex gap-3 mb-4">
                  <Input 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    placeholder={forumUser ? "Write a comment..." : "Log in to comment..."}
                    disabled={!forumUser}
                    className="bg-[hsl(var(--bc-bg))] border-[hsl(var(--bc-border))]" 
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                  />
                  <Button 
                    onClick={handleSubmitComment} 
                    disabled={submittingComment || !forumUser}
                  >
                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                  </Button>
                </div>
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--bc-primary))]" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-[hsl(var(--bc-text-muted))]">
                    No comments yet. Be the first!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Link to={`/${c.author?.serial_id}/${c.author?.username}/profile`} className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-bg))] flex items-center justify-center overflow-hidden">
                            {c.author?.avatar_url ? (
                              <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-[hsl(var(--bc-text-muted))]">
                                {c.author?.username?.[0]?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link 
                              to={`/${c.author?.serial_id}/${c.author?.username}/profile`}
                              className="font-semibold text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]"
                            >
                              {c.author?.username || 'Unknown'}
                            </Link>
                            {c.author?.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                              {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-[hsl(var(--bc-text))]">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline ForumLeaderboard component to avoid module resolution issues
function ForumLeaderboard() {
  const [users, setUsers] = useState<Array<{
    id: string;
    serial_id: number;
    username: string;
    avatar_url: string | null;
    post_count: number;
    thread_count: number;
    xp: number;
    level: number;
    membership_tier: string | null;
    avatar_effect: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'xp' | 'posts' | 'threads'>('xp');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      let orderColumn = 'xp';
      if (activeTab === 'posts') orderColumn = 'post_count';
      if (activeTab === 'threads') orderColumn = 'thread_count';
      
      const { data } = await supabase
        .from('forum_users')
        .select('id, serial_id, username, avatar_url, post_count, thread_count, xp, level, membership_tier, avatar_effect')
        .eq('is_suspended', false)
        .order(orderColumn, { ascending: false })
        .limit(50);
      
      if (data) setUsers(data);
      setLoading(false);
    };
    fetchLeaderboard();
  }, [activeTab]);

  const tabs = [
    { key: 'xp' as const, label: 'XP' },
    { key: 'posts' as const, label: 'Posts' },
    { key: 'threads' as const, label: 'Threads' },
  ];

  const getValue = (user: typeof users[0]) => {
    if (activeTab === 'posts') return user.post_count;
    if (activeTab === 'threads') return user.thread_count;
    return user.xp;
  };

  const getLabel = () => {
    if (activeTab === 'posts') return 'posts';
    if (activeTab === 'threads') return 'threads';
    return 'XP';
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-[hsl(var(--bc-accent))]';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-amber-600';
    return 'text-[hsl(var(--bc-text-muted))]';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[hsla(var(--bc-accent),0.1)] flex items-center justify-center">
          <Crown className="w-6 h-6 text-[hsl(var(--bc-accent))]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Leaderboard</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">Top players ranked by activity</p>
        </div>
      </div>
      <div className="bg-[hsl(var(--bc-bg-card))] rounded-xl border border-[hsl(var(--bc-border))] overflow-hidden">
        <div className="flex border-b border-[hsl(var(--bc-border))]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'text-[hsl(var(--bc-primary))] border-b-2 border-[hsl(var(--bc-primary))] bg-[hsla(var(--bc-primary),0.05)]'
                  : 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                  <div className="w-8 h-8 bg-[hsl(var(--bc-bg-light))] rounded" />
                  <div className="w-10 h-10 bg-[hsl(var(--bc-bg-light))] rounded-full" />
                  <div className="flex-1 h-5 bg-[hsl(var(--bc-bg-light))] rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user, index) => (
                <Link
                  key={user.id}
                  to={`/${user.serial_id}/${user.username}/profile`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition group"
                >
                  <div className="w-10 flex items-center justify-center">
                    <span className={`text-lg font-bold ${getRankColor(index)}`}>#{index + 1}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-bg-light))] flex items-center justify-center text-[hsl(var(--bc-text))] font-medium">
                    {user.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-primary))] transition">
                        {user.username}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))]">
                        Lv.{user.level}
                      </span>
                    </div>
                    {index < 3 && (
                      <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                        {index === 0 ? '🥇 1st Place' : index === 1 ? '🥈 2nd Place' : '🥉 3rd Place'}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[hsl(var(--bc-text))]">{getValue(user).toLocaleString()}</div>
                    <div className="text-xs text-[hsl(var(--bc-text-muted))]">{getLabel()}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline Notes component with Terms, Privacy, Updates, and Team tabs
function Notes() {
  const [activeTab, setActiveTab] = useState('terms');
  const [staff, setStaff] = useState<Array<{ id: string; serial_id: number; username: string; avatar_url: string | null; is_verified: boolean; membership_tier: string | null; avatar_effect: string | null; level: number; xp: number; role: 'admin' | 'moderator' }>>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('role', ['admin', 'moderator']);
      if (!roles || roles.length === 0) { setLoadingStaff(false); return; }
      const userIds = roles.map(r => r.user_id);
      const { data: forumUsers } = await supabase.from('forum_users').select('id, serial_id, user_id, username, avatar_url, is_verified, membership_tier, avatar_effect, level, xp').in('user_id', userIds);
      if (forumUsers) {
        const staffWithRoles = forumUsers.map(user => {
          const role = roles.find(r => r.user_id === user.user_id)?.role;
          return { ...user, role: role as 'admin' | 'moderator' };
        }).sort((a, b) => (a.role === 'admin' && b.role !== 'admin') ? -1 : (a.role !== 'admin' && b.role === 'admin') ? 1 : 0);
        setStaff(staffWithRoles);
      }
      setLoadingStaff(false);
    };
    fetchStaff();
  }, []);

  const UPDATES_LIST = [
    { text: 'New Sign Up Design', completed: true },
    { text: 'New Forum Design', completed: true },
    { text: 'New Dashboard', completed: true },
    { text: 'Sign up with Discord & Google', completed: false },
    { text: 'Revert Back To Original Sidebar & Topbar', completed: true },
    { text: 'Login with Discord & Google', completed: false },
    { text: '2FA', completed: true },
    { text: 'Redesign Spaces', completed: false },
    { text: 'Let Users Create & Play Games', completed: true },
    { text: 'Update Filter System', completed: true },
    { text: 'Add Coins As A Second Currency', completed: true },
    { text: 'Add Notification Bell Allowing Users To View Account Notifications', completed: true },
    { text: 'Add UGC Allowing Users To Create Their Own Hats, Faces & Gadgets', completed: false },
    { text: 'Redesign Forum Leaderboard', completed: true },
    { text: 'Settings Page Redesign', completed: true },
  ];

  return (
    <div className="space-y-6">
      <div className="bc-card">
        <div className="bc-card-header flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'hsla(var(--bc-primary), 0.1)' }}>
            <FileText className="w-6 h-6" style={{ color: 'hsl(var(--bc-primary))' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>Notes</h1>
            <p style={{ color: 'hsl(var(--bc-text-muted))' }}>Important information about BLOX City</p>
          </div>
        </div>
        <div className="bc-card-body">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start mb-6" style={{ background: 'hsl(var(--bc-input-bg))' }}>
              <TabsTrigger value="terms" className="flex items-center gap-2"><Shield className="w-4 h-4" />Terms</TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2"><Lock className="w-4 h-4" />Privacy</TabsTrigger>
              <TabsTrigger value="updates" className="flex items-center gap-2"><FileText className="w-4 h-4" />Updates</TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2"><Users className="w-4 h-4" />Team</TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="space-y-4">
              <div style={{ color: 'hsl(var(--bc-text))' }}>
                <p className="text-lg mb-4">Welcome to BLOX City! A user generated content platform enabling creativity with our users.</p>
                <p className="mb-4">By using BLOX City you agree that we reserve the rights to suspend your account at any given time for any reason. Please read through this page carefully.</p>
                <h3 className="text-lg font-semibold mt-6 mb-3">Account Security</h3>
                <p className="mb-2"><b>1</b>. Keep your password to yourself and do not share your account with anyone.</p>
                <p className="mb-2"><b>2</b>. Do not attempt to compromise anyone's account or illegally access accounts.</p>
                <h3 className="text-lg font-semibold mt-6 mb-3">Username Policy</h3>
                <p className="mb-2"><b>1</b>. Do not impersonate others with your username.</p>
                <p className="mb-2"><b>2</b>. No special characters to bypass filters.</p>
                <p className="mb-2"><b>3</b>. No personal information in usernames.</p>
                <p className="mb-2"><b>4</b>. No hateful or vulgar content in usernames.</p>
                <h3 className="text-lg font-semibold mt-6 mb-3">Discussion</h3>
                <p className="mb-2"><b>1</b>. Do not spam posts or replies.</p>
                <p className="mb-2"><b>2</b>. Post in the correct subforum.</p>
                <p className="mb-2"><b>3</b>. No drama or flame wars.</p>
                <h3 className="text-lg font-semibold mt-6 mb-3">Asset System</h3>
                <p className="mb-2"><b>1</b>. No copyrighted content.</p>
                <p className="mb-2"><b>2</b>. No pornography - permanent ban.</p>
                <p className="mb-2"><b>3</b>. No copying others' assets.</p>
                <h3 className="text-lg font-semibold mt-6 mb-3">Glitches & Bugs</h3>
                <p className="mb-2"><b>1</b>. Report bugs immediately - abusing them results in permanent removal.</p>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <div style={{ color: 'hsl(var(--bc-text))' }}>
                <p className="text-lg mb-4">BLOX City respects the privacy of our users. This policy explains how we collect, use, and disclose information.</p>
                <h3 className="text-lg font-semibold mt-6 mb-3">Stored Information</h3>
                <div className="p-4 rounded-lg mb-3" style={{ background: 'hsl(var(--bc-section-bg))', border: '1px solid hsl(var(--bc-section-border))' }}>
                  <div className="font-semibold mb-1">1. Username</div>
                  <p className="text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>Used for identification purposes only.</p>
                </div>
                <div className="p-4 rounded-lg mb-3" style={{ background: 'hsl(var(--bc-section-bg))', border: '1px solid hsl(var(--bc-section-border))' }}>
                  <div className="font-semibold mb-1">2. Password</div>
                  <p className="text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>Stored securely and cannot be retrieved by anyone including us.</p>
                </div>
                <div className="p-4 rounded-lg mb-3" style={{ background: 'hsl(var(--bc-section-bg))', border: '1px solid hsl(var(--bc-section-border))' }}>
                  <div className="font-semibold mb-1">3. IP Address</div>
                  <p className="text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>Collected & encrypted to prevent fraudulent accounts. Cannot be seen by staff.</p>
                </div>
                <h3 className="text-lg font-semibold mt-6 mb-3">Sharing Information</h3>
                <p>BLOX City does not share/sell user information. We cooperate with law enforcement when provided a court order.</p>
              </div>
            </TabsContent>

            <TabsContent value="updates" className="space-y-4">
              <p className="mb-4" style={{ color: 'hsl(var(--bc-text-muted))' }}>Updates we're working on. Items are checked off as they are completed:</p>
              <div className="space-y-2">
                {UPDATES_LIST.map((update, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'hsl(var(--bc-section-bg))', border: '1px solid hsl(var(--bc-section-border))' }}>
                    {update.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    <span style={{ color: 'hsl(var(--bc-text))' }}>{update.text}</span>
                    <span className={`ml-auto text-sm font-medium ${update.completed ? 'text-green-600' : 'text-red-600'}`}>{update.completed ? 'Completed' : 'Incomplete'}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              {loadingStaff ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--bc-primary))' }} /></div>
              ) : (
                <>
                  {/* System */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--bc-text))' }}><span className="w-2 h-2 rounded-full bg-blue-500" />System</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'hsl(var(--bc-section-bg))', border: '1px solid hsl(var(--bc-section-border))' }}>
                        <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-blue-500/30">
                          <img src="https://www.bloxcity.net/assets/IMG_2412_Original-1-CLfNpjOE.png" alt="BLOX City" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2"><span className="font-semibold" style={{ color: 'hsl(var(--bc-text))' }}>BLOX City</span><BadgeCheck className="w-4 h-4 text-blue-500" /><span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">System</span></div>
                          <p className="text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>Official System Account</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Admins */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--bc-text))' }}><span className="w-2 h-2 rounded-full bg-red-500" />Administrators</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {staff.filter(s => s.role === 'admin' && s.username.toLowerCase() !== 'blox city').map(member => (
                        <Link key={member.id} to={`/${member.serial_id}/${member.username}/profile`} className="flex items-center gap-4 p-4 rounded-xl transition group" style={{ background: 'hsl(var(--bc-section-bg))', border: '1px solid hsl(var(--bc-section-border))' }}>
                          <UserAvatar avatarUrl={member.avatar_url} username={member.username} size="lg" effect={member.avatar_effect} membershipTier={member.membership_tier as any} />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold" style={{ color: 'hsl(var(--bc-text))' }}>{member.username}</span>
                              {member.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Admin</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {member.membership_tier && <MembershipBadge tier={member.membership_tier as any} size="sm" />}
                              <UserLevelBadge level={member.level} xp={member.xp} size="sm" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  {/* Moderators */}
                  {staff.filter(s => s.role === 'moderator' && s.username.toLowerCase() !== 'blox city').length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--bc-text))' }}><span className="w-2 h-2 rounded-full bg-green-500" />Moderators</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {staff.filter(s => s.role === 'moderator' && s.username.toLowerCase() !== 'blox city').map(member => (
                          <Link key={member.id} to={`/${member.serial_id}/${member.username}/profile`} className="flex items-center gap-4 p-4 rounded-xl transition group" style={{ background: 'hsl(var(--bc-section-bg))', border: '1px solid hsl(var(--bc-section-border))' }}>
                            <UserAvatar avatarUrl={member.avatar_url} username={member.username} size="lg" effect={member.avatar_effect} membershipTier={member.membership_tier as any} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold" style={{ color: 'hsl(var(--bc-text))' }}>{member.username}</span>
                                {member.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Moderator</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {member.membership_tier && <MembershipBadge tier={member.membership_tier as any} size="sm" />}
                                <UserLevelBadge level={member.level} xp={member.xp} size="sm" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {staff.length === 0 && <p className="text-center py-8" style={{ color: 'hsl(var(--bc-text-muted))' }}>No staff members found.</p>}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Inline Roadmap component to avoid module persistence issues
function Roadmap() {
  const roadmapData = [
    { phase: "Phase 1", title: "Foundation", items: [
      { title: "User Authentication", description: "Secure login and registration", status: "completed" as const },
      { title: "Profile System", description: "Profiles, settings, customization", status: "completed" as const },
      { title: "Forum & Threads", description: "Community discussion boards", status: "completed" as const },
      { title: "Direct Messaging", description: "Private messaging", status: "completed" as const },
      { title: "Friends System", description: "Add and manage friends", status: "completed" as const },
    ]},
    { phase: "Phase 2", title: "Economy & Trading", items: [
      { title: "Virtual Currency", description: "Coin system", status: "completed" as const },
      { title: "Catalog", description: "Browse and buy items", status: "in-progress" as const },
      { title: "Trading", description: "Trade items with users", status: "in-progress" as const },
      { title: "Limited Items", description: "Rare items & resale", status: "planned" as const },
      { title: "Creator Marketplace", description: "Sell your creations", status: "planned" as const },
    ]},
    { phase: "Phase 3", title: "Games & Creation", items: [
      { title: "Game Library", description: "Browse and play games", status: "completed" as const },
      { title: "Character Customization", description: "Better avatar editor", status: "in-progress" as const },
      { title: "Creation Tools", description: "Build your own games", status: "planned" as const },
      { title: "Asset Library", description: "Shared assets", status: "planned" as const },
      { title: "Game Analytics", description: "Track performance", status: "planned" as const },
    ]},
    { phase: "Phase 4", title: "Platform Growth", items: [
      { title: "Groups & Clans", description: "Communities", status: "completed" as const },
      { title: "Events", description: "Competitions", status: "planned" as const },
      { title: "Mobile App", description: "Native mobile", status: "planned" as const },
      { title: "Creator Program", description: "Monetization", status: "planned" as const },
      { title: "API Access", description: "Developer API", status: "planned" as const },
    ]},
  ];

  const totalItems = roadmapData.reduce((acc, phase) => acc + phase.items.length, 0);
  const completedItems = roadmapData.reduce((acc, phase) => acc + phase.items.filter(i => i.status === "completed").length, 0);
  const inProgressItems = roadmapData.reduce((acc, phase) => acc + phase.items.filter(i => i.status === "in-progress").length, 0);
  const progress = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))]">
      <div className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] flex items-center gap-3">Development Roadmap</h1>
              <p className="text-[hsl(var(--bc-text-muted))] mt-2">What's coming next and what we're working on.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="none" className="text-[hsl(var(--bc-border))]" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={`${progress * 2.26} 226`} strokeLinecap="round" className="text-[hsl(var(--bc-primary))]" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold text-[hsl(var(--bc-text))]">{progress}%</span></div>
              </div>
              <div className="text-sm">
                <p className="text-[hsl(var(--bc-text))]"><span className="font-semibold">{completedItems}</span> completed</p>
                <p className="text-[hsl(var(--bc-text-muted))]"><span className="font-semibold">{inProgressItems}</span> in progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {roadmapData.map((phase, i) => {
            const phaseCompleted = phase.items.filter(item => item.status === "completed").length;
            return (
              <div key={i} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
                <div className="bg-[hsl(var(--bc-bg))]/50 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[hsl(var(--bc-text-muted))] uppercase tracking-wide">{phase.phase}</span>
                    <h2 className="text-xl font-bold text-[hsl(var(--bc-text))]">{phase.title}</h2>
                  </div>
                  <span className="text-sm text-[hsl(var(--bc-text-muted))]">{phaseCompleted}/{phase.items.length} complete</span>
                </div>
                <div className="divide-y divide-[hsl(var(--bc-border))]">
                  {phase.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between p-4 hover:bg-[hsl(var(--bc-bg))]/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${item.status === "completed" ? "bg-green-500" : item.status === "in-progress" ? "bg-blue-500" : "bg-gray-500"}`} />
                        <div>
                          <h3 className="font-medium text-[hsl(var(--bc-text))]">{item.title}</h3>
                          <p className="text-sm text-[hsl(var(--bc-text-muted))]">{item.description}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${item.status === "completed" ? "bg-green-500/10 text-green-500" : item.status === "in-progress" ? "bg-blue-500/10 text-blue-500" : "bg-gray-500/10 text-gray-400"}`}>
                        {item.status === "completed" ? "Completed" : item.status === "in-progress" ? "In Progress" : "Planned"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-12 text-center">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h3 className="font-semibold text-[hsl(var(--bc-text))]">Have a suggestion?</h3>
            <p className="text-[hsl(var(--bc-text-muted))] text-sm mt-1">Share your ideas in the community forums!</p>
          </div>
        </div>
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
            {/* Landing page for logged-out users (standalone, no ForumLayout) */}
            <Route path="/landing" element={<LandingPage />} />
            
            {/* Main Routes with ForumLayout */}
            <Route path="/" element={<ForumLayout />}>
              <Route index element={<HomeOrLanding />} />
              <Route path="forum" element={<ForumHome />} />
              <Route path="forum/leaderboard" element={<ForumLeaderboard />} />
              <Route path="category/:slug" element={<ForumCategory />} />
              <Route path="category/:slug/new" element={<ForumNewThread />} />
              <Route path="thread/:threadId" element={<ForumThread />} />
              
              {/* Settings routes with nested layout */}
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<ForumSettings />} />
                <Route path="privacy" element={<SettingsPrivacy />} />
                <Route path="security" element={<SettingsSecurity />} />
              </Route>
              <Route path=":serialId/:username/profile" element={<ForumUserProfile />} />
              <Route path="messages" element={<ForumMessages />} />
              <Route path="players" element={<ForumUsers />} />
              <Route path="groups" element={<Groups />} />
              <Route path="group/:slug" element={<GroupDetail />} />
              <Route path="group/:slug/settings" element={<GroupSettings />} />
              <Route path="staff" element={<ForumStaff />} />
              <Route path="updates" element={<Updates />} />
              <Route path="games" element={<Games />} />
              <Route path="game/:serialId/:slug" element={<GameView />} />
              <Route path="game/:id" element={<GameView />} />
              <Route path="market" element={<Market />} />
              <Route path="item/:serialId/:slug" element={<MarketItem />} />
              <Route path="market/item/:id" element={<MarketItem />} />
              <Route path="character" element={<Character />} />
              <Route path="trading" element={<Trading />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="login" element={<ForumLogin />} />
              <Route path="register" element={<ForumRegister />} />
              <Route path="forgot-password" element={<ForumForgotPassword />} />
              <Route path="reset-password" element={<ForumResetPassword />} />
              <Route path="faq" element={<ForumFAQ />} />
              <Route path="terms-of-service" element={<TermsOfService />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="notes" element={<Notes />} />
              <Route path="friends" element={<Friends />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="create" element={<Create />} />
              <Route path="request" element={<Request />} />
              <Route path="convert" element={<Convert />} />
              <Route path="upgrades" element={<Upgrades />} />
              <Route path="support" element={<Support />} />
              <Route path="money" element={<Convert />} />
              <Route path="accept-affiliate" element={<AcceptAffiliate />} />
              <Route path="g0dfrey" element={<GodfreyPanel />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="bugs" element={<Bugs />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<BlogPost />} />
            </Route>

            {/* Suspended page - outside ForumLayout */}
            <Route path="/suspended" element={<SuspendedPage />} />

            {/* Maintenance page - outside ForumLayout */}
            <Route path="/maintenance" element={<Maintenance />} />

            {/* Admin Route - outside ForumLayout */}
            <Route path="/admin" element={<Admin />} />
            
            {/* Error pages */}
            <Route path="/error/403" element={<Error403 />} />
            <Route path="/error/419" element={<Error419 />} />
            <Route path="/error/500" element={<Error500 />} />
            <Route path="/feature-disabled" element={<FeatureDisabled />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
