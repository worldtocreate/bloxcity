// v3
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, Link, useNavigate, Outlet, useOutletContext } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, BadgeCheck, Crown, Shield, Mail, AlertTriangle, Coins, DollarSign, ArrowRightLeft, Info, User, Lock as LockIcon, Gamepad2 } from "lucide-react";
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

// Forum imports (now main pages)
import ForumLayout from "./components/forum/ForumLayout";
// SettingsLayout is inlined below due to module resolution issues
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
// TermsOfService, PrivacyPolicy, GameDetail inlined below
import ForumStaff from "./pages/forum/ForumStaff";
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
// GameView, SettingsPrivacy, SettingsSecurity are inlined below
// Upgrades, Support, TermsOfService, PrivacyPolicy, GameDetail are inlined below

// Need useParams for GameDetail
function useGameParams() {
  const params = window.location.pathname.match(/\/game\/([^\/]+)/);
  return { gameId: params ? params[1] : undefined };
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
          {isEditing ? (<div className="space-y-4"><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Game Title" /><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" /><div className="flex gap-2"><Button onClick={handleSaveEdit}>Save</Button><Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button></div></div>) : (<><div className="flex items-start justify-between"><div><h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">{game.title}</h1><Link to={`/user/${game.creator?.username}`} className="text-[hsl(var(--bc-primary))] hover:underline text-sm">by {game.creator?.username}</Link></div>{canEdit && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>}</div>{game.description && <p className="text-[hsl(var(--bc-text-muted))]">{game.description}</p>}</>)}
          <div className="flex items-center gap-6 text-sm text-[hsl(var(--bc-text-muted))]"><span>{game.play_count || 0} plays</span><span>{game.favorite_count || 0} favorites</span></div>
          <div className="flex gap-3 pt-4 border-t border-[hsl(var(--bc-border))]"><Button className="flex-1">Play Now</Button><Button variant="outline" onClick={toggleFavorite} className={isFavorited ? "text-red-500" : ""}>♥</Button></div>
        </div>
      </div>
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Comments ({comments.length})</h2>
        {forumUser ? (<div className="flex gap-3 mb-6"><Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()} /><Button onClick={handleSubmitComment} disabled={submittingComment || !newComment.trim()}>{submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}</Button></div>) : <p className="text-[hsl(var(--bc-text-muted))] mb-6"><Link to="/login" className="text-[hsl(var(--bc-primary))] hover:underline">Login</Link> to comment</p>}
        <div className="space-y-4">{comments.length === 0 ? <p className="text-center text-[hsl(var(--bc-text-muted))] py-8">No comments yet</p> : comments.map((c) => (<div key={c.id} className="flex gap-3 p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"><img src={c.author?.avatar_url || "/placeholder.svg"} alt="" className="w-8 h-8 rounded-full" /><div className="flex-1"><div className="flex items-center justify-between"><Link to={`/user/${c.author?.username}`} className="font-medium text-[hsl(var(--bc-text))]">{c.author?.username}</Link>{(forumUser?.id === c.author_id || isAdmin) && <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 text-sm">Delete</button>}</div><p className="text-[hsl(var(--bc-text-muted))] text-sm">{c.content}</p></div></div>))}</div>
      </div>
    </div>
  );
}

// Inline GameView component (game detail page with servers and comments)
function GameView() {
  const params = window.location.pathname.match(/\/game\/([^\/]+)/);
  const gameId = params ? params[1] : undefined;
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

  useEffect(() => { if (gameId) { fetchGame(); fetchComments(); fetchServers(); } }, [gameId]);
  useEffect(() => { if (forumUser && gameId) { checkFavorite(); checkAdmin(); } }, [forumUser, gameId]);

  const checkAdmin = async () => { if (!forumUser) return; const { data } = await supabase.rpc("has_role", { _user_id: forumUser.user_id, _role: "admin" }); setIsAdmin(!!data); };
  const fetchGame = async () => { if (!gameId) return; const { data } = await supabase.from("forum_games").select("*, creator:forum_users!forum_games_creator_id_fkey (id, username, avatar_url)").eq("id", gameId).single(); setGame(data); if (data) setEditForm({ title: data.title, description: data.description || "", category: data.category }); setLoading(false); };
  const fetchComments = async () => { if (!gameId) return; const { data } = await supabase.from("forum_game_comments").select("*, author:forum_users!forum_game_comments_author_id_fkey (id, username, avatar_url)").eq("game_id", gameId).eq("is_deleted", false).order("created_at", { ascending: false }); setComments(data || []); };
  const fetchServers = async () => { if (!gameId) return; const { data } = await supabase.from("forum_game_servers").select("*").eq("game_id", gameId).eq("is_active", true).order("created_at", { ascending: false }); setServers(data || []); };
  const checkFavorite = async () => { if (!forumUser || !gameId) return; const { data } = await supabase.from("forum_game_favorites").select("id").eq("game_id", gameId).eq("forum_user_id", forumUser.id).single(); setIsFavorited(!!data); };
  const toggleFavorite = async () => { if (!forumUser || !gameId) { toast({ title: "Please login to favorite", variant: "destructive" }); return; } if (isFavorited) { await supabase.from("forum_game_favorites").delete().eq("game_id", gameId).eq("forum_user_id", forumUser.id); setIsFavorited(false); } else { await supabase.from("forum_game_favorites").insert({ game_id: gameId, forum_user_id: forumUser.id }); setIsFavorited(true); } };
  const handleSaveEdit = async () => { if (!game) return; const { error } = await supabase.from("forum_games").update({ title: editForm.title, description: editForm.description || null, category: editForm.category }).eq("id", game.id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Game updated" }); setIsEditing(false); fetchGame(); } };
  const handleSubmitComment = async () => { if (!forumUser || !gameId || !newComment.trim()) return; setSubmittingComment(true); await supabase.from("forum_game_comments").insert({ game_id: gameId, author_id: forumUser.id, content: newComment.trim() }); setNewComment(""); fetchComments(); setSubmittingComment(false); };
  const handleDeleteComment = async (commentId: string) => { await supabase.from("forum_game_comments").update({ is_deleted: true, deleted_by: forumUser?.id, deleted_at: new Date().toISOString() }).eq("id", commentId); fetchComments(); };
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !game) return;
    setUploadingThumbnail(true);
    const ext = file.name.split('.').pop();
    const path = `game-thumbnails/${game.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('forum-uploads').upload(path, file, { upsert: true });
    if (uploadError) { toast({ title: "Upload failed", variant: "destructive" }); setUploadingThumbnail(false); return; }
    const { data: urlData } = supabase.storage.from('forum-uploads').getPublicUrl(path);
    await supabase.from("forum_games").update({ thumbnail_url: urlData.publicUrl, thumbnail_status: 'pending' }).eq("id", game.id);
    toast({ title: "Thumbnail uploaded", description: "Pending review" });
    fetchGame();
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
                  <Link to={`/user/${game.creator?.username}`} className="text-[hsl(var(--bc-primary))] hover:underline text-sm">by {game.creator?.username}</Link>
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
                        <Link to={`/user/${c.author?.username}`} className="font-medium text-[hsl(var(--bc-text))]">{c.author?.username}</Link>
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

// Inline SettingsLayout component (settings pages with sidebar)
function SettingsLayout() {
  const location = window.location.pathname;
  // Preserve the parent <Route element> context (ForumLayout) so settings pages
  // can keep using useOutletContext() without rendering blank.
  const outletContext = useOutletContext<any>();
  
  const settingsNavItems = [
    { title: 'Account', url: '/settings', icon: User, exact: true },
    { title: 'Privacy', url: '/settings/privacy', icon: LockIcon },
    { title: 'Security', url: '/settings/security', icon: Shield },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location === path;
    return location === path;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 sticky top-20">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Settings</h2>
            <nav className="space-y-1">
              {settingsNavItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.url, item.exact)
                      ? 'bg-[hsl(var(--bc-primary))] text-white'
                      : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content - rendered via Outlet */}
        <div className="flex-1 min-w-0">
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
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

// Inline Upgrades component to avoid module persistence issues
function Upgrades() {
  const { user, forumUser, loading: authLoading, refreshForumUser } = useForumAuth();
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const tiers = [
    { id: 'bronze', name: 'Bronze', price: 500, color: 'text-orange-400', bg: 'bg-orange-500/20', features: ['Bronze badge on profile', 'Access to Bronze-only forums', 'Custom profile colors'] },
    { id: 'silver', name: 'Silver', price: 1500, color: 'text-gray-300', bg: 'bg-gray-400/20', features: ['Silver badge on profile', 'All Bronze perks', 'Priority support', 'Exclusive avatar effects'] },
    { id: 'platinum', name: 'Platinum', price: 5000, color: 'text-cyan-300', bg: 'bg-cyan-400/20', features: ['Platinum badge on profile', 'All Silver perks', 'VIP access to events', 'Custom username colors', 'Ad-free experience'] }
  ];

  const handlePurchase = async (tier: typeof tiers[0]) => {
    if (!forumUser) return;
    if (forumUser.coins < tier.price) { toast({ title: 'Insufficient Coins', description: `You need ${tier.price - forumUser.coins} more coins.`, variant: 'destructive' }); return; }
    if (forumUser.membership_tier === tier.id) { toast({ title: 'Already Owned', description: `You already have ${tier.name} membership.`, variant: 'destructive' }); return; }
    setPurchasing(tier.id);
    const { error } = await supabase.from('forum_users').update({ coins: forumUser.coins - tier.price, membership_tier: tier.id }).eq('id', forumUser.id);
    if (error) { toast({ title: 'Purchase Failed', description: error.message, variant: 'destructive' }); }
    else { await supabase.from('forum_membership_redemptions').insert({ forum_user_id: forumUser.id, tier: tier.id, coins_spent: tier.price }); toast({ title: 'Purchase Successful!', description: `You are now a ${tier.name} member!` }); refreshForumUser(); }
    setPurchasing(null);
  };

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (!user || !forumUser) return <div className="max-w-2xl mx-auto p-6"><div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center"><AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" /><h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-2">Login Required</h1><p className="text-[hsl(var(--bc-text-muted))] mb-4">You must be logged in to view upgrades.</p><Link to="/login"><Button>Login</Button></Link></div></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8"><h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Upgrade Your Membership</h1><p className="text-[hsl(var(--bc-text-muted))]">Unlock exclusive perks and features</p><p className="text-lg font-medium text-[hsl(var(--bc-text))] mt-4"><Coins className="w-5 h-5 inline text-yellow-500 mr-1" />{forumUser.coins.toLocaleString()} coins available</p></div>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map(tier => {
          const isOwned = forumUser.membership_tier === tier.id;
          const canAfford = forumUser.coins >= tier.price;
          return (
            <div key={tier.id} className={`bg-[hsl(var(--bc-bg-card))] border ${isOwned ? 'border-green-500' : 'border-[hsl(var(--bc-border))]'} rounded-xl p-6 flex flex-col`}>
              <div className={`w-16 h-16 ${tier.bg} rounded-full flex items-center justify-center mx-auto mb-4`}><Crown className={`w-8 h-8 ${tier.color}`} /></div>
              <h3 className={`text-xl font-bold text-center ${tier.color} mb-1`}>{tier.name}</h3>
              <p className="text-2xl font-bold text-center text-[hsl(var(--bc-text))] mb-4">{tier.price.toLocaleString()} <span className="text-sm text-[hsl(var(--bc-text-muted))]">coins</span></p>
              <ul className="space-y-2 flex-1 mb-6">{tier.features.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm text-[hsl(var(--bc-text-muted))]"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{f}</li>)}</ul>
              <Button onClick={() => handlePurchase(tier)} disabled={isOwned || !canAfford || !!purchasing} className="w-full" variant={isOwned ? 'outline' : 'default'}>
                {purchasing === tier.id ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : isOwned ? 'Current Plan' : !canAfford ? 'Not Enough Coins' : `Purchase ${tier.name}`}
              </Button>
            </div>
          );
        })}
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
              
              {/* Settings routes with nested layout */}
              <Route path="settings" element={<SettingsLayout />}>
                <Route index element={<ForumSettings />} />
                <Route path="privacy" element={<SettingsPrivacy />} />
                <Route path="security" element={<SettingsSecurity />} />
              </Route>
              <Route path="user/:username" element={<ForumUserProfile />} />
              <Route path="messages" element={<ForumMessages />} />
              <Route path="players" element={<ForumUsers />} />
              <Route path="groups" element={<Groups />} />
              <Route path="group/:slug" element={<GroupDetail />} />
              <Route path="group/:slug/settings" element={<GroupSettings />} />
              <Route path="staff" element={<ForumStaff />} />
              <Route path="updates" element={<Updates />} />
              <Route path="games" element={<Games />} />
              <Route path="game/:id" element={<GameView />} />
              <Route path="market" element={<Market />} />
              <Route path="character" element={<Character />} />
              <Route path="trading" element={<Trading />} />
              <Route path="login" element={<ForumLogin />} />
              <Route path="register" element={<ForumRegister />} />
              <Route path="forgot-password" element={<ForumForgotPassword />} />
              <Route path="reset-password" element={<ForumResetPassword />} />
              <Route path="faq" element={<ForumFAQ />} />
              <Route path="terms-of-service" element={<TermsOfService />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="friends" element={<Friends />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="create" element={<Create />} />
              <Route path="request" element={<Request />} />
              <Route path="convert" element={<Convert />} />
              <Route path="upgrades" element={<Upgrades />} />
              <Route path="support" element={<Support />} />
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
