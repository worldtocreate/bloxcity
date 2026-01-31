import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Edit2, Save, Upload, Loader2, Shield, Ban, X } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';

interface BlockedUser {
  id: string;
  blocked_id: string;
  blocked_user: {
    username: string;
    avatar_url: string | null;
  };
}

export default function ForumSettings() {
  const navigate = useNavigate();
  const { user, forumUser, isAdmin, loading } = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
    loading?: boolean;
  }>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize signature when forumUser loads
  useEffect(() => {
    if (forumUser && !initialized) {
      setSignature(forumUser.signature || '');
      setInitialized(true);
    }
  }, [forumUser, initialized]);

  useEffect(() => {
    if (forumUser) fetchBlockedUsers();
  }, [forumUser]);

  const fetchBlockedUsers = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_blocked_users')
      .select('id, blocked_id, blocked_user:blocked_id (username, avatar_url)')
      .eq('blocker_id', forumUser.id);
    
    setBlockedUsers((data || []) as any);
    setLoadingBlocked(false);
  };

  const handleSaveSignature = async () => {
    if (!forumUser) return;
    setSaving(true);

    const { error } = await supabase
      .from('forum_users')
      .update({ signature: signature.trim() || null })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to save signature');
    } else {
      toast.success('Signature saved!');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !forumUser || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      const moderationResult = await supabase.functions.invoke('forum-moderate-avatar', {
        body: { imageBase64: base64 }
      });

      if (moderationResult.data?.inappropriate) {
        toast.error('This image is not appropriate for a profile picture. Please choose another.');
        setUploadingAvatar(false);
        return;
      }

      const filePath = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('forum-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error('Failed to upload avatar');
        setUploadingAvatar(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('forum-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('forum_users')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', forumUser.id);

      if (updateError) {
        toast.error('Failed to update profile');
      } else {
        toast.success('Avatar updated!');
        window.location.reload();
      }

      setUploadingAvatar(false);
    };

    reader.readAsDataURL(file);
  };

  const handleUnblock = async (blockedId: string) => {
    if (!forumUser) return;

    const { error } = await supabase
      .from('forum_blocked_users')
      .delete()
      .eq('blocker_id', forumUser.id)
      .eq('blocked_id', blockedId);

    if (error) {
      toast.error('Failed to unblock user');
    } else {
      toast.success('User unblocked');
      fetchBlockedUsers();
    }
  };

  // Redirect to login if not authenticated (loading is handled by ForumLayout)
  if (!user) {
    navigate('/forum/login');
    return null;
  }

  // Logged in, but no forum profile yet
  if (!forumUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Forum Settings</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mt-2">
            Your account is signed in, but you don’t have a forum profile yet.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/forum/register')}
              className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-4 py-2 rounded-lg transition font-medium"
            >
              Create forum profile
            </button>
            <button
              onClick={() => navigate('/forum')}
              className="px-4 py-2 rounded-lg border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
            >
              Back to forums
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Forum Settings</h1>

      {/* Profile Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </h2>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            {forumUser.avatar_url ? (
              <img
                src={forumUser.avatar_url}
                alt={forumUser.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="flex items-center gap-1 text-sm text-[hsl(var(--bc-primary))] hover:opacity-80 transition"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="mb-3">
              <label className="text-sm text-[hsl(var(--bc-text-muted))]">Username</label>
              <div className="text-[hsl(var(--bc-text))] font-medium flex items-center gap-2">
                {forumUser.username}
                {isAdmin && <Shield className="w-4 h-4 text-[hsl(var(--bc-accent))]" />}
              </div>
            </div>
            <div>
              <label className="text-sm text-[hsl(var(--bc-text-muted))]">Email</label>
              <div className="text-[hsl(var(--bc-text))]">{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5" />
          Signature
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-3">
          This will appear at the bottom of your posts.
        </p>
        <textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Enter your signature (max 200 characters)..."
          className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
          rows={3}
          maxLength={200}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[hsl(var(--bc-text-muted))]">{signature.length}/200</span>
          <button
            onClick={handleSaveSignature}
            disabled={saving}
            className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Signature'}
          </button>
        </div>
      </div>

      {/* Blocked Users Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Ban className="w-5 h-5" />
          Blocked Users
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-4">
          Blocked users' posts will be hidden from your view.
        </p>

        {loadingBlocked ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 text-[hsl(var(--bc-text-muted))] animate-spin mx-auto" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <p className="text-[hsl(var(--bc-text-muted))] text-center py-4">No blocked users</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((block) => (
              <div 
                key={block.id}
                className="flex items-center justify-between bg-[hsl(var(--bc-bg-light))] rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  {block.blocked_user?.avatar_url ? (
                    <img 
                      src={block.blocked_user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-text-muted))] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-[hsl(var(--bc-text))]">{block.blocked_user?.username}</span>
                </div>
                <button
                  onClick={() => handleUnblock(block.blocked_id)}
                  className="text-[hsl(var(--bc-secondary))] hover:opacity-80 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
