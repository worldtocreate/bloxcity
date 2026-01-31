import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';
import UserAvatar from '@/components/forum/UserAvatar';
import VerifiedBadge from '@/components/forum/VerifiedBadge';
import MembershipBadge from '@/components/forum/MembershipBadge';
import UserLevelBadge from '@/components/forum/UserLevelBadge';

interface StaffMember {
  id: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  membership_tier: string | null;
  avatar_effect: string | null;
  level: number;
  xp: number;
  role: 'admin' | 'moderator';
}

export default function ForumStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Staff Team - BLOX City';
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    // Get all users with admin or moderator roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['admin', 'moderator']);

    if (!roles || roles.length === 0) {
      setLoading(false);
      return;
    }

    // Get forum user info for each staff member
    const userIds = roles.map(r => r.user_id);
    const { data: forumUsers } = await supabase
      .from('forum_users')
      .select('id, user_id, username, avatar_url, is_verified, membership_tier, avatar_effect, level, xp')
      .in('user_id', userIds);

    if (forumUsers) {
      const staffWithRoles = forumUsers.map(user => {
        const role = roles.find(r => r.user_id === user.user_id)?.role;
        return { ...user, role: role as 'admin' | 'moderator' };
      }).sort((a, b) => {
        // Sort admins first
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return 0;
      });
      setStaff(staffWithRoles);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg-light))]">
      {/* Header */}
      <header className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={bloxcityLogo} alt="BLOX City" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold text-[hsl(var(--bc-text))]">BLOX City</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forum
        </Link>

        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[hsl(var(--bc-border))] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[hsla(var(--bc-primary),0.1)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Staff Team</h1>
              <p className="text-[hsl(var(--bc-text-muted))]">Meet the people behind BLOX City</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
            </div>
          ) : (
            <div className="p-6">
              {/* System */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  System
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-xl">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-blue-500/30">
                      <img 
                        src="https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/forum-avatars/2bd1f84a-34e7-4ded-a57b-8c6350427649/1769863888597.jpg" 
                        alt="BLOX City"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[hsl(var(--bc-text))]">
                          BLOX City
                        </span>
                        <VerifiedBadge size="sm" />
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          System
                        </span>
                      </div>
                      <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-1">
                        Official System Account
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admins */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Administrators
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {staff.filter(s => s.role === 'admin' && s.username.toLowerCase() !== 'blox city').map(member => (
                    <Link
                      key={member.id}
                      to={`/user/${member.username}`}
                      className="flex items-center gap-4 p-4 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] border border-[hsl(var(--bc-border))] rounded-xl transition group"
                    >
                      <UserAvatar
                        avatarUrl={member.avatar_url}
                        username={member.username}
                        size="lg"
                        effect={member.avatar_effect}
                        membershipTier={member.membership_tier as any}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition">
                            {member.username}
                          </span>
                          {member.is_verified && <VerifiedBadge size="sm" />}
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Admin
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {member.membership_tier && (
                            <MembershipBadge tier={member.membership_tier as any} size="sm" />
                          )}
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
                  <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Moderators
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {staff.filter(s => s.role === 'moderator' && s.username.toLowerCase() !== 'blox city').map(member => (
                      <Link
                        key={member.id}
                        to={`/user/${member.username}`}
                        className="flex items-center gap-4 p-4 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] border border-[hsl(var(--bc-border))] rounded-xl transition group"
                      >
                        <UserAvatar
                          avatarUrl={member.avatar_url}
                          username={member.username}
                          size="lg"
                          effect={member.avatar_effect}
                          membershipTier={member.membership_tier as any}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition">
                              {member.username}
                            </span>
                            {member.is_verified && <VerifiedBadge size="sm" />}
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Moderator
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {member.membership_tier && (
                              <MembershipBadge tier={member.membership_tier as any} size="sm" />
                            )}
                            <UserLevelBadge level={member.level} xp={member.xp} size="sm" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {staff.length === 0 && (
                <p className="text-center text-[hsl(var(--bc-text-muted))] py-8">
                  No staff members found.
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[hsl(var(--bc-border))] py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[hsl(var(--bc-text-muted))] text-sm">
            © 2026 BLOX City, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
