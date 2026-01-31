import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';

interface GroupMembership {
  id: string;
  group: {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
    is_verified: boolean;
    member_count: number;
    is_private: boolean;
  };
  role: {
    name: string;
    color: string;
  } | null;
}

interface UserGroupsProps {
  forumUserId: string;
  compact?: boolean;
}

export default function UserGroups({ forumUserId, compact = false }: UserGroupsProps) {
  const [groups, setGroups] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, [forumUserId]);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('forum_group_members')
      .select(`
        id,
        group:group_id (
          id, name, slug, icon_url, is_verified, member_count, is_private
        ),
        role:role_id (
          name, color
        )
      `)
      .eq('forum_user_id', forumUserId)
      .order('joined_at', { ascending: false });

    if (data) {
      // Filter out private groups for non-members
      setGroups(data.filter((m: any) => m.group && !m.group.is_private) as unknown as GroupMembership[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-12 rounded-lg bg-[hsl(var(--bc-bg-light))]" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return compact ? null : (
      <div className="text-sm text-[hsl(var(--bc-text-muted))]">Not a member of any groups</div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {groups.slice(0, 4).map(membership => (
          <Link
            key={membership.id}
            to={`/group/${membership.group.slug}`}
            className="flex items-center gap-1.5 px-2 py-1 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] rounded-full text-xs transition"
          >
            {membership.group.icon_url ? (
              <img src={membership.group.icon_url} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                <Users className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            <span className="text-[hsl(var(--bc-text))]">{membership.group.name}</span>
            {membership.group.is_verified && <VerifiedBadge size="sm" />}
          </Link>
        ))}
        {groups.length > 4 && (
          <span className="px-2 py-1 text-xs text-[hsl(var(--bc-text-muted))]">
            +{groups.length - 4} more
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
        <Users className="w-4 h-4" />
        Groups ({groups.length})
      </h3>
      <div className="space-y-2">
        {groups.map(membership => (
          <Link
            key={membership.id}
            to={`/group/${membership.group.slug}`}
            className="flex items-center gap-3 p-3 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] rounded-lg transition"
          >
            {membership.group.icon_url ? (
              <img src={membership.group.icon_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[hsl(var(--bc-text))] truncate">{membership.group.name}</span>
                {membership.group.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-[hsl(var(--bc-text-muted))]">
                <span>{membership.group.member_count} members</span>
                {membership.role && (
                  <>
                    <span>•</span>
                    <span style={{ color: membership.role.color }}>{membership.role.name}</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
