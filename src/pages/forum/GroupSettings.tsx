import { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Settings, Loader2, Save, Users, Shield, 
  Trash2, Crown, Plus, X, AlertTriangle, UserCheck, Edit2, Camera, ImageIcon, Upload,
  Calendar, Handshake, Coins, Send, Check, XCircle
} from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TwoFactorVerify from '@/components/forum/TwoFactorVerify';

interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  cover_url: string | null;
  owner_id: string;
  is_verified: boolean;
  require_approval: boolean;
  last_name_change: string | null;
  coins_vault: number;
  is_private: boolean;
  vault_is_private: boolean;
}

interface GroupRole {
  id: string;
  name: string;
  color: string;
  rank: number;
  is_default: boolean;
  permissions: any;
}

interface GroupMember {
  id: string;
  forum_user_id: string;
  joined_at: string;
  role_id: string | null;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface JoinRequest {
  id: string;
  created_at: string;
  status: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface BlockedWord {
  id: string;
  word: string;
  created_at: string;
}

interface GroupEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

interface AllianceRequest {
  id: string;
  status: string;
  created_at: string;
  group_id: string;
  affiliate_group_id: string;
  affiliate_group?: {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
  };
  requesting_group?: {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
  };
}

export default function GroupSettings() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const forumUser = context?.forumUser;
  const isSiteAdmin = context?.isAdmin ?? false;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [roles, setRoles] = useState<GroupRole[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [vaultIsPrivate, setVaultIsPrivate] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [newBlockedWord, setNewBlockedWord] = useState('');

  // Role creation/editing
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<GroupRole | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#6b7280');
  const [newRoleRank, setNewRoleRank] = useState(1);
  const [newRolePermissions, setNewRolePermissions] = useState({
    can_post_wall: true,
    can_delete_posts: false,
    can_kick_members: false,
    can_manage_roles: false,
    can_manage_events: false,
    can_manage_settings: false,
  });
  const [creatingRole, setCreatingRole] = useState(false);

  // Member role assignment
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [assigningRole, setAssigningRole] = useState(false);

  // Ownership transfer
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<GroupMember | null>(null);
  const [show2FAVerify, setShow2FAVerify] = useState(false);
  const [has2FAEnabled, setHas2FAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'totp' | 'email'>('totp');
  const [transferring, setTransferring] = useState(false);
  const [pendingAction, setPendingAction] = useState<'ownership' | 'payout' | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Media upload state
  const iconInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Events state
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Alliance state
  const [alliances, setAlliances] = useState<AllianceRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<AllianceRequest[]>([]);
  const [allGroups, setAllGroups] = useState<{ id: string; name: string; slug: string; icon_url: string | null }[]>([]);
  const [selectedAllianceGroup, setSelectedAllianceGroup] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchGroup();
    }
  }, [slug]);

  useEffect(() => {
    if (forumUser) {
      check2FAStatus();
    }
  }, [forumUser]);

  const check2FAStatus = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_2fa_settings')
      .select('is_enabled, method')
      .eq('forum_user_id', forumUser.id)
      .single();
    setHas2FAEnabled(data?.is_enabled ?? false);
    if (data?.method === 'email' || data?.method === 'totp') {
      setTwoFAMethod(data.method);
    }
  };

  const fetchGroup = async () => {
    setLoading(true);

    // Fetch group
    const { data: groupData, error } = await supabase
      .from('forum_groups')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !groupData) {
      navigate('/groups');
      return;
    }

    setGroup(groupData);
    setName(groupData.name);
    setDescription(groupData.description || '');
    setRequireApproval(groupData.require_approval || false);
    setIsPrivate(groupData.is_private || false);
    setVaultIsPrivate(groupData.vault_is_private || false);

    // Check if user is owner
    if (forumUser) {
      setIsOwner(groupData.owner_id === forumUser.id);
    }
    setPermissionChecked(true);

    // Fetch roles
    const { data: rolesData } = await supabase
      .from('forum_group_roles')
      .select('*')
      .eq('group_id', groupData.id)
      .order('rank', { ascending: false });

    if (rolesData) {
      setRoles(rolesData);
    }

    // Fetch members
    const { data: membersData } = await supabase
      .from('forum_group_members')
      .select(`
        id, forum_user_id, joined_at, role_id,
        user:forum_user_id (id, username, avatar_url)
      `)
      .eq('group_id', groupData.id)
      .order('joined_at', { ascending: true });

    if (membersData) {
      setMembers(membersData as unknown as GroupMember[]);
    }

    // Fetch pending join requests
    const { data: requestsData } = await supabase
      .from('forum_group_join_requests')
      .select(`
        id,
        created_at,
        status,
        user:forum_user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('group_id', groupData.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requestsData) {
      setJoinRequests(requestsData as unknown as JoinRequest[]);
    }

    // Fetch blocked words
    const { data: wordsData } = await supabase
      .from('forum_group_blocked_words')
      .select('*')
      .eq('group_id', groupData.id)
      .order('created_at', { ascending: false });

    if (wordsData) {
      setBlockedWords(wordsData);
    }

    // Fetch group events
    const { data: eventsData } = await supabase
      .from('forum_group_events')
      .select('*')
      .eq('group_id', groupData.id)
      .order('created_at', { ascending: false });

    if (eventsData) {
      setEvents(eventsData as GroupEvent[]);
    }

    // Fetch alliances (accepted)
    const { data: allianceData } = await supabase
      .from('forum_group_affiliates')
      .select(`
        id, status, created_at, group_id, affiliate_group_id,
        affiliate_group:affiliate_group_id (id, name, slug, icon_url)
      `)
      .eq('group_id', groupData.id)
      .eq('status', 'accepted');

    if (allianceData) {
      setAlliances(allianceData as unknown as AllianceRequest[]);
    }

    // Fetch incoming alliance requests
    const { data: incomingData } = await supabase
      .from('forum_group_affiliates')
      .select(`
        id, status, created_at, group_id, affiliate_group_id,
        requesting_group:group_id (id, name, slug, icon_url)
      `)
      .eq('affiliate_group_id', groupData.id)
      .eq('status', 'pending');

    if (incomingData) {
      setIncomingRequests(incomingData as unknown as AllianceRequest[]);
    }

    // Fetch all groups for alliance selection (exclude own group and existing alliances)
    const { data: groupsData } = await supabase
      .from('forum_groups')
      .select('id, name, slug, icon_url')
      .neq('id', groupData.id)
      .eq('is_private', false)
      .order('name');

    if (groupsData) {
      setAllGroups(groupsData);
    }

    setLoading(false);
  };

  const canEdit = isOwner || isSiteAdmin;

  const handleSaveGeneral = async () => {
    if (!group || !canEdit) return;

    // Check name change cooldown (30 days)
    if (name !== group.name) {
      if (group.last_name_change) {
        const lastChange = new Date(group.last_name_change);
        const daysSince = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          toast.error(`You can change the group name again in ${Math.ceil(30 - daysSince)} days`);
          return;
        }
      }
    }

    setSaving(true);
    const updates: any = {
      description,
      require_approval: requireApproval,
      is_private: isPrivate,
      vault_is_private: vaultIsPrivate,
    };

    if (name !== group.name) {
      updates.name = name;
      updates.last_name_change = new Date().toISOString();
      // Update slug
      updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const { error } = await supabase
      .from('forum_groups')
      .update(updates)
      .eq('id', group.id);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved!');
      if (updates.slug && updates.slug !== slug) {
        navigate(`/group/${updates.slug}/settings`);
      } else {
        fetchGroup();
      }
    }
    setSaving(false);
  };

  const handleJoinRequest = async (requestId: string, accept: boolean) => {
    if (!group) return;

    const request = joinRequests.find(r => r.id === requestId);
    if (!request) return;

    if (accept) {
      // Add member
      const { error: memberError } = await supabase
        .from('forum_group_members')
        .insert({
          group_id: group.id,
          forum_user_id: request.user.id
        });

      if (memberError) {
        toast.error('Failed to add member');
        return;
      }
    }

    // Update request status
    const { error } = await supabase
      .from('forum_group_join_requests')
      .update({ 
        status: accept ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
        responded_by: forumUser?.id
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to update request');
    } else {
      toast.success(accept ? 'Member accepted!' : 'Request declined');
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleAddBlockedWord = async () => {
    if (!group || !newBlockedWord.trim()) return;

    const { error } = await supabase
      .from('forum_group_blocked_words')
      .insert({
        group_id: group.id,
        word: newBlockedWord.trim().toLowerCase(),
        added_by: forumUser?.id
      });

    if (error) {
      toast.error('Failed to add blocked word');
    } else {
      toast.success('Word blocked');
      setNewBlockedWord('');
      fetchGroup();
    }
  };

  const handleRemoveBlockedWord = async (wordId: string) => {
    const { error } = await supabase
      .from('forum_group_blocked_words')
      .delete()
      .eq('id', wordId);

    if (error) {
      toast.error('Failed to remove word');
    } else {
      setBlockedWords(prev => prev.filter(w => w.id !== wordId));
    }
  };

  const handleCreateRole = async () => {
    if (!group || !newRoleName.trim()) return;

    setCreatingRole(true);
    const { error } = await supabase
      .from('forum_group_roles')
      .insert({
        group_id: group.id,
        name: newRoleName.trim(),
        color: newRoleColor,
        rank: newRoleRank,
        permissions: newRolePermissions,
        is_default: false
      });

    if (error) {
      toast.error('Failed to create role');
    } else {
      toast.success('Role created!');
      resetRoleForm();
      fetchGroup();
    }
    setCreatingRole(false);
  };

  const handleUpdateRole = async () => {
    if (!group || !editingRole || !newRoleName.trim()) return;

    setCreatingRole(true);
    const { error } = await supabase
      .from('forum_group_roles')
      .update({
        name: newRoleName.trim(),
        color: newRoleColor,
        rank: newRoleRank,
        permissions: newRolePermissions,
      })
      .eq('id', editingRole.id);

    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success('Role updated!');
      resetRoleForm();
      fetchGroup();
    }
    setCreatingRole(false);
  };

  const resetRoleForm = () => {
    setShowRoleModal(false);
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleColor('#6b7280');
    setNewRoleRank(1);
    setNewRolePermissions({
      can_post_wall: true,
      can_delete_posts: false,
      can_kick_members: false,
      can_manage_roles: false,
      can_manage_events: false,
      can_manage_settings: false,
    });
  };

  const openEditRole = (role: GroupRole) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleColor(role.color);
    setNewRoleRank(role.rank);
    setNewRolePermissions({
      can_post_wall: role.permissions?.can_post_wall ?? true,
      can_delete_posts: role.permissions?.can_delete_posts ?? false,
      can_kick_members: role.permissions?.can_kick_members ?? false,
      can_manage_roles: role.permissions?.can_manage_roles ?? false,
      can_manage_events: role.permissions?.can_manage_events ?? false,
      can_manage_settings: role.permissions?.can_manage_settings ?? false,
    });
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Delete this role? Members will be moved to no role.')) return;

    const { error } = await supabase
      .from('forum_group_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      toast.error('Failed to delete role');
    } else {
      toast.success('Role deleted');
      fetchGroup();
    }
  };

  const handleAssignRole = async (roleId: string | null) => {
    if (!selectedMember || !group) return;

    setAssigningRole(true);
    const { error } = await supabase
      .from('forum_group_members')
      .update({ role_id: roleId })
      .eq('id', selectedMember.id);

    if (error) {
      toast.error('Failed to assign role');
    } else {
      toast.success('Role assigned!');
      setShowMemberModal(false);
      setSelectedMember(null);
      fetchGroup();
    }
    setAssigningRole(false);
  };

  const handleOwnershipTransfer = async () => {
    if (!selectedNewOwner || !group || !forumUser) return;

    if (!has2FAEnabled) {
      toast.error('You must enable 2FA to transfer ownership');
      return;
    }

    setPendingAction('ownership');
    setShow2FAVerify(true);
  };

  const handlePayoutRequest = async () => {
    const amount = parseInt(payoutAmount);
    if (!amount || amount < 1 || !group || amount > group.coins_vault) {
      toast.error('Invalid payout amount');
      return;
    }

    if (!has2FAEnabled) {
      toast.error('You must enable 2FA to payout coins');
      return;
    }

    setPendingAction('payout');
    setShow2FAVerify(true);
  };

  const handle2FAVerified = async () => {
    if (pendingAction === 'ownership') {
      await executeOwnershipTransfer();
    } else if (pendingAction === 'payout') {
      await executePayoutTransfer();
    }
    setShow2FAVerify(false);
    setPendingAction(null);
  };

  const executeOwnershipTransfer = async () => {
    if (!selectedNewOwner || !group) return;

    setTransferring(true);
    try {
      const { error } = await supabase
        .from('forum_groups')
        .update({ owner_id: selectedNewOwner.forum_user_id })
        .eq('id', group.id);

      if (error) {
        toast.error('Failed to transfer ownership');
      } else {
        await supabase
          .from('forum_group_audit_logs')
          .insert({
            group_id: group.id,
            actor_id: forumUser?.id,
            action: 'ownership_transfer',
            target_id: selectedNewOwner.forum_user_id,
            target_type: 'member',
            details: { new_owner_username: selectedNewOwner.user.username }
          });

        toast.success('Ownership transferred!');
        navigate(`/group/${slug}`);
      }
    } catch {
      toast.error('Failed to transfer ownership');
    }
    setTransferring(false);
    setShowOwnershipModal(false);
  };

  const executePayoutTransfer = async () => {
    if (!group || !forumUser) return;
    const amount = parseInt(payoutAmount);

    setTransferring(true);
    try {
      // Deduct from vault
      const { error: groupError } = await supabase
        .from('forum_groups')
        .update({ coins_vault: group.coins_vault - amount })
        .eq('id', group.id);

      if (groupError) throw groupError;

      // Add to owner's balance
      const { error: userError } = await supabase
        .from('forum_users')
        .update({ coins: forumUser.coins + amount })
        .eq('id', forumUser.id);

      if (userError) throw userError;

      await supabase
        .from('forum_group_audit_logs')
        .insert({
          group_id: group.id,
          actor_id: forumUser.id,
          action: 'vault_payout',
          target_type: 'vault',
          details: { amount }
        });

      toast.success(`Paid out ${amount} coins!`);
      setPayoutAmount('');
      setShowPayoutModal(false);
      fetchGroup();
    } catch {
      toast.error('Failed to payout coins');
    }
    setTransferring(false);
  };

  // Event handlers
  const handleCreateEvent = async () => {
    if (!group || !forumUser || !newEventTitle.trim()) return;

    setCreatingEvent(true);
    const { error } = await supabase
      .from('forum_group_events')
      .insert({
        group_id: group.id,
        created_by: forumUser.id,
        title: newEventTitle.trim(),
        description: newEventDescription.trim() || null,
        event_date: newEventDate || null,
        status: 'pending'
      });

    if (error) {
      toast.error('Failed to create event');
    } else {
      toast.success('Event submitted for review!');
      setShowEventModal(false);
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventDate('');
      fetchGroup();
    }
    setCreatingEvent(false);
  };

  // Alliance handlers
  const handleSendAllianceRequest = async () => {
    if (!group || !forumUser || !selectedAllianceGroup) return;

    setSendingRequest(true);
    const { error } = await supabase
      .from('forum_group_affiliates')
      .insert({
        group_id: group.id,
        affiliate_group_id: selectedAllianceGroup,
        requested_by: forumUser.id,
        status: 'pending'
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Alliance request already exists');
      } else {
        toast.error('Failed to send alliance request');
      }
    } else {
      toast.success('Alliance request sent!');
      setSelectedAllianceGroup('');
      fetchGroup();
    }
    setSendingRequest(false);
  };

  const handleAllianceResponse = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from('forum_group_affiliates')
      .update({ 
        status: accept ? 'accepted' : 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to respond to request');
    } else {
      toast.success(accept ? 'Alliance accepted!' : 'Alliance declined');
      fetchGroup();
    }
  };

  const handleRemoveAlliance = async (allianceId: string) => {
    if (!confirm('Remove this alliance?')) return;

    const { error } = await supabase
      .from('forum_group_affiliates')
      .delete()
      .eq('id', allianceId);

    if (error) {
      toast.error('Failed to remove alliance');
    } else {
      toast.success('Alliance removed');
      fetchGroup();
    }
  };

  const handleMediaUpload = async (file: File, type: 'icon' | 'cover') => {
    if (!group || !forumUser) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    if (type === 'icon') {
      setUploadingIcon(true);
    } else {
      setUploadingCover(true);
    }

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `group-${group.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `groups/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('forum-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('forum-avatars')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // Submit for review (moderation)
      const { error: requestError } = await supabase
        .from('forum_group_media_requests')
        .insert({
          group_id: group.id,
          media_type: type,
          image_url: imageUrl,
          status: 'pending'
        });

      if (requestError) throw requestError;

      toast.success(`${type === 'icon' ? 'Icon' : 'Cover'} submitted for review`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    }

    if (type === 'icon') {
      setUploadingIcon(false);
    } else {
      setUploadingCover(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !isOwner) return;

    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    if (!confirm('This will permanently delete all group data, members, posts, and events. Type "DELETE" to confirm.')) return;

    const { error } = await supabase
      .from('forum_groups')
      .delete()
      .eq('id', group.id);

    if (error) {
      toast.error('Failed to delete group');
    } else {
      toast.success('Group deleted');
      navigate('/groups');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-[hsl(var(--bc-text-muted))]">Group not found.</p>
        <Link to="/groups" className="text-[hsl(var(--bc-primary))] hover:underline mt-2 inline-block">
          Back to Groups
        </Link>
      </div>
    );
  }

  if (permissionChecked && !canEdit) {
    return (
      <div className="text-center py-20">
        <p className="text-[hsl(var(--bc-text-muted))]">You don't have permission to access this page.</p>
        <Link to={`/group/${slug}`} className="text-[hsl(var(--bc-primary))] hover:underline mt-2 inline-block">
          Back to Group
        </Link>
      </div>
    );
  }

  const getMemberRole = (roleId: string | null) => {
    if (!roleId) return null;
    return roles.find(r => r.id === roleId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/group/${slug}`}
          className="p-2 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition"
        >
          <ArrowLeft className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Group Settings</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">{group.name}</p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-1">
            <UserCheck className="w-4 h-4" />
            Requests ({joinRequests.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="alliances" className="flex items-center gap-1">
            <Handshake className="w-4 h-4" />
            Alliances
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Moderation
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="ownership" className="flex items-center gap-1">
              <Crown className="w-4 h-4" />
              Ownership
            </TabsTrigger>
          )}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Group Name
                <span className="text-xs text-[hsl(var(--bc-text-muted))] ml-2">(can change every 30 days)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
            </div>

            {/* Media Upload Section */}
            <div className="py-4 border-t border-[hsl(var(--bc-border))]">
              <h3 className="font-medium text-[hsl(var(--bc-text))] mb-4">Group Media</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Icon Upload */}
                <div className="space-y-2">
                  <label className="block text-sm text-[hsl(var(--bc-text-muted))]">
                    Group Icon
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {group.icon_url ? (
                        <img
                          src={group.icon_url}
                          alt="Group icon"
                          className="w-16 h-16 rounded-xl object-cover border border-[hsl(var(--bc-border))]"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] flex items-center justify-center">
                          <Camera className="w-6 h-6 text-[hsl(var(--bc-text-muted))]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMediaUpload(file, 'icon');
                        }}
                      />
                      <button
                        onClick={() => iconInputRef.current?.click()}
                        disabled={uploadingIcon}
                        className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-border))] transition text-sm"
                      >
                        {uploadingIcon ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload Icon
                      </button>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                        Recommended: 128x128px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cover Upload */}
                <div className="space-y-2">
                  <label className="block text-sm text-[hsl(var(--bc-text-muted))]">
                    Cover Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {group.cover_url ? (
                        <img
                          src={group.cover_url}
                          alt="Group cover"
                          className="w-24 h-16 rounded-lg object-cover border border-[hsl(var(--bc-border))]"
                        />
                      ) : (
                        <div className="w-24 h-16 rounded-lg bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-[hsl(var(--bc-text-muted))]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMediaUpload(file, 'cover');
                        }}
                      />
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-border))] transition text-sm"
                      >
                        {uploadingCover ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload Cover
                      </button>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                        Recommended: 1200x400px
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-3">
                All media uploads are reviewed by moderators before being displayed.
              </p>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[hsl(var(--bc-border))]">
              <div>
                <h3 className="font-medium text-[hsl(var(--bc-text))]">Manual Approval</h3>
                <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                  User requests must be accepted to join community
                </p>
              </div>
              <button
                onClick={() => setRequireApproval(!requireApproval)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  requireApproval ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-border))]'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    requireApproval ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[hsl(var(--bc-border))]">
              <div>
                <h3 className="font-medium text-[hsl(var(--bc-text))]">Private Group</h3>
                <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                  Only members can see group on profiles and search
                </p>
              </div>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isPrivate ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-border))]'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isPrivate ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[hsl(var(--bc-border))]">
              <div>
                <h3 className="font-medium text-[hsl(var(--bc-text))]">Private Vault</h3>
                <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                  Only owner can see the vault balance
                </p>
              </div>
              <button
                onClick={() => setVaultIsPrivate(!vaultIsPrivate)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  vaultIsPrivate ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-border))]'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    vaultIsPrivate ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Vault Deposit */}
            {isOwner && forumUser && (
              <div className="py-3 border-t border-[hsl(var(--bc-border))]">
                <h3 className="font-medium text-[hsl(var(--bc-text))] mb-2">Deposit to Vault</h3>
                <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-3">
                  Current vault: {group.coins_vault.toLocaleString()} coins • Your coins: {forumUser.coins.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount"
                    min="1"
                    max={forumUser.coins}
                    className="flex-1 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                  />
                  <button
                    onClick={async () => {
                      const amount = parseInt(depositAmount);
                      if (!amount || amount < 1 || amount > forumUser.coins) {
                        toast.error('Invalid amount');
                        return;
                      }
                      // Deduct from user
                      const { error: userError } = await supabase
                        .from('forum_users')
                        .update({ coins: forumUser.coins - amount })
                        .eq('id', forumUser.id);
                      if (userError) {
                        toast.error('Failed to deposit');
                        return;
                      }
                      // Add to vault
                      const { error: groupError } = await supabase
                        .from('forum_groups')
                        .update({ coins_vault: group.coins_vault + amount })
                        .eq('id', group.id);
                      if (groupError) {
                        toast.error('Failed to deposit');
                        return;
                      }
                      toast.success(`Deposited ${amount} coins to vault!`);
                      setDepositAmount('');
                      fetchGroup();
                    }}
                    disabled={!depositAmount || parseInt(depositAmount) < 1}
                    className="px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition"
                  >
                    Deposit
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          {/* Danger Zone */}
          {isOwner && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
              <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                Deleting your group is permanent and cannot be undone.
              </p>
              <button
                onClick={handleDeleteGroup}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            </div>
          )}
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Roles</h2>
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Create Role
              </button>
            </div>
            
            {roles.length === 0 ? (
              <p className="text-[hsl(var(--bc-text-muted))]">No roles yet. Create one to organize your members.</p>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="font-medium text-[hsl(var(--bc-text))]">{role.name}</span>
                      {role.is_default && (
                        <span className="text-xs bg-[hsl(var(--bc-primary))]/10 text-[hsl(var(--bc-primary))] px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[hsl(var(--bc-text-muted))]">Rank {role.rank}</span>
                      <button
                        onClick={() => openEditRole(role)}
                        className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!role.is_default && (
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-500 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">
              Manage Members ({members.length})
            </h2>
            
            <div className="space-y-2">
              {members.map((member) => {
                const memberRole = getMemberRole(member.role_id);
                const isGroupOwner = member.forum_user_id === group.owner_id;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {member.user.avatar_url ? (
                        <img src={member.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[hsl(var(--bc-text))] flex items-center gap-2">
                          {member.user.username}
                          {isGroupOwner && <Crown className="w-4 h-4 text-yellow-500" />}
                        </p>
                        {memberRole ? (
                          <p className="text-sm" style={{ color: memberRole.color }}>{memberRole.name}</p>
                        ) : (
                          <p className="text-sm text-[hsl(var(--bc-text-muted))]">No role</p>
                        )}
                      </div>
                    </div>
                    {!isGroupOwner && (
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowMemberModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-card))] transition"
                      >
                        <Edit2 className="w-4 h-4" />
                        Assign Role
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Join Requests */}
        <TabsContent value="requests" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Pending Requests</h2>
            
            {joinRequests.length === 0 ? (
              <p className="text-[hsl(var(--bc-text-muted))]">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {request.user.avatar_url ? (
                        <img src={request.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[hsl(var(--bc-text))]">{request.user.username}</p>
                        <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleJoinRequest(request.id, true)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleJoinRequest(request.id, false)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Events */}
        <TabsContent value="events" className="mt-6 space-y-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Events</h2>
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>
            
            {events.length === 0 ? (
              <p className="text-[hsl(var(--bc-text-muted))]">No events yet. Create one to engage your members!</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-[hsl(var(--bc-bg-light))] rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[hsl(var(--bc-text))]">{event.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          event.status === 'approved' 
                            ? 'bg-green-500/20 text-green-400'
                            : event.status === 'denied'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-1">{event.description}</p>
                      )}
                      {event.event_date && (
                        <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(event.event_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Alliances */}
        <TabsContent value="alliances" className="mt-6 space-y-6">
          {/* Send Alliance Request */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Send Alliance Request</h2>
            <div className="flex gap-2">
              <select
                value={selectedAllianceGroup}
                onChange={(e) => setSelectedAllianceGroup(e.target.value)}
                className="flex-1 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              >
                <option value="">Select a group...</option>
                {allGroups.filter(g => !alliances.some(a => a.affiliate_group_id === g.id)).map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                onClick={handleSendAllianceRequest}
                disabled={!selectedAllianceGroup || sendingRequest}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition"
              >
                {sendingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>

          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">
                Incoming Requests ({incomingRequests.length})
              </h2>
              <div className="space-y-3">
                {incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {request.requesting_group?.icon_url ? (
                        <img src={request.requesting_group.icon_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <span className="font-medium text-[hsl(var(--bc-text))]">
                        {request.requesting_group?.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAllianceResponse(request.id, true)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAllianceResponse(request.id, false)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Alliances */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Current Alliances</h2>
            {alliances.length === 0 ? (
              <p className="text-[hsl(var(--bc-text-muted))]">No alliances yet. Send a request to another group!</p>
            ) : (
              <div className="space-y-3">
                {alliances.map((alliance) => (
                  <div
                    key={alliance.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"
                  >
                    <Link
                      to={`/group/${alliance.affiliate_group?.slug}`}
                      className="flex items-center gap-3 hover:opacity-80 transition"
                    >
                      {alliance.affiliate_group?.icon_url ? (
                        <img src={alliance.affiliate_group.icon_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <span className="font-medium text-[hsl(var(--bc-text))]">
                        {alliance.affiliate_group?.name}
                      </span>
                    </Link>
                    <button
                      onClick={() => handleRemoveAlliance(alliance.id)}
                      className="text-red-500 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Moderation */}
        <TabsContent value="moderation" className="mt-6 space-y-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Blocked Words</h2>
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
              Users cannot post these words on the group wall.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newBlockedWord}
                onChange={(e) => setNewBlockedWord(e.target.value)}
                placeholder="Enter word to block..."
                className="flex-1 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
              <button
                onClick={handleAddBlockedWord}
                disabled={!newBlockedWord.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {blockedWords.length === 0 ? (
              <p className="text-[hsl(var(--bc-text-muted))]">No blocked words.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blockedWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg"
                  >
                    <span className="text-sm text-[hsl(var(--bc-text))]">{word.word}</span>
                    <button
                      onClick={() => handleRemoveBlockedWord(word.id)}
                      className="text-[hsl(var(--bc-text-muted))] hover:text-red-500 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Ownership Transfer */}
        {isOwner && (
          <TabsContent value="ownership" className="mt-6 space-y-6">
            {/* Vault Payout */}
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2">Vault Payout</h2>
              <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
                Withdraw coins from the group vault. This requires 2FA verification.
              </p>
              <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
                Current vault balance: <span className="font-semibold text-[hsl(var(--bc-text))]">{group.coins_vault.toLocaleString()} coins</span>
              </p>

              {!has2FAEnabled ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You must enable Two-Factor Authentication to payout coins.
                  </p>
                  <Link
                    to="/settings"
                    className="text-sm text-[hsl(var(--bc-primary))] hover:underline mt-2 inline-block"
                  >
                    Go to Settings → Security
                  </Link>
                </div>
              ) : group.coins_vault > 0 ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Amount"
                    min="1"
                    max={group.coins_vault}
                    className="flex-1 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                  />
                  <button
                    onClick={handlePayoutRequest}
                    disabled={!payoutAmount || parseInt(payoutAmount) < 1 || parseInt(payoutAmount) > group.coins_vault}
                    className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition"
                  >
                    <Coins className="w-4 h-4" />
                    Payout
                  </button>
                </div>
              ) : (
                <p className="text-[hsl(var(--bc-text-muted))]">Vault is empty.</p>
              )}
            </div>

            {/* Transfer Ownership */}
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2">Transfer Ownership</h2>
              <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
                Transfer group ownership to another member. This action requires 2FA verification.
              </p>

              {!has2FAEnabled ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You must enable Two-Factor Authentication before you can transfer ownership.
                  </p>
                  <Link
                    to="/settings"
                    className="text-sm text-[hsl(var(--bc-primary))] hover:underline mt-2 inline-block"
                  >
                    Go to Settings → Security
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => setShowOwnershipModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                >
                  <Crown className="w-4 h-4" />
                  Transfer Ownership
                </button>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-4">Create Event</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g., Group Meetup"
                  className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your event..."
                  className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Event Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                />
              </div>

              <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                Events are reviewed by moderators before being displayed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setNewEventTitle('');
                    setNewEventDescription('');
                    setNewEventDate('');
                  }}
                  className="flex-1 px-4 py-2 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={creatingEvent || !newEventTitle.trim()}
                  className="flex-1 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  {creatingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-4">
              {editingRole ? 'Edit Role' : 'Create Role'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value.slice(0, 30))}
                  placeholder="e.g., Moderator"
                  className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Rank (higher = more important)
                </label>
                <input
                  type="number"
                  value={newRoleRank}
                  onChange={(e) => setNewRoleRank(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-3">
                  Permissions
                </label>
                <div className="space-y-3 bg-[hsl(var(--bc-bg-light))] rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRolePermissions.can_post_wall}
                      onChange={(e) => setNewRolePermissions(prev => ({ ...prev, can_post_wall: e.target.checked }))}
                      className="w-4 h-4 rounded border-[hsl(var(--bc-border))] text-[hsl(var(--bc-primary))] focus:ring-[hsl(var(--bc-primary))]"
                    />
                    <div>
                      <span className="text-[hsl(var(--bc-text))]">Post on wall</span>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))]">Can post messages on the group wall</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRolePermissions.can_delete_posts}
                      onChange={(e) => setNewRolePermissions(prev => ({ ...prev, can_delete_posts: e.target.checked }))}
                      className="w-4 h-4 rounded border-[hsl(var(--bc-border))] text-[hsl(var(--bc-primary))] focus:ring-[hsl(var(--bc-primary))]"
                    />
                    <div>
                      <span className="text-[hsl(var(--bc-text))]">Delete posts</span>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))]">Can delete wall posts from other members</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRolePermissions.can_kick_members}
                      onChange={(e) => setNewRolePermissions(prev => ({ ...prev, can_kick_members: e.target.checked }))}
                      className="w-4 h-4 rounded border-[hsl(var(--bc-border))] text-[hsl(var(--bc-primary))] focus:ring-[hsl(var(--bc-primary))]"
                    />
                    <div>
                      <span className="text-[hsl(var(--bc-text))]">Kick members</span>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))]">Can remove members from the group</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRolePermissions.can_manage_roles}
                      onChange={(e) => setNewRolePermissions(prev => ({ ...prev, can_manage_roles: e.target.checked }))}
                      className="w-4 h-4 rounded border-[hsl(var(--bc-border))] text-[hsl(var(--bc-primary))] focus:ring-[hsl(var(--bc-primary))]"
                    />
                    <div>
                      <span className="text-[hsl(var(--bc-text))]">Manage roles</span>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))]">Can assign roles to members</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRolePermissions.can_manage_events}
                      onChange={(e) => setNewRolePermissions(prev => ({ ...prev, can_manage_events: e.target.checked }))}
                      className="w-4 h-4 rounded border-[hsl(var(--bc-border))] text-[hsl(var(--bc-primary))] focus:ring-[hsl(var(--bc-primary))]"
                    />
                    <div>
                      <span className="text-[hsl(var(--bc-text))]">Manage events</span>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))]">Can create and manage group events</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRolePermissions.can_manage_settings}
                      onChange={(e) => setNewRolePermissions(prev => ({ ...prev, can_manage_settings: e.target.checked }))}
                      className="w-4 h-4 rounded border-[hsl(var(--bc-border))] text-[hsl(var(--bc-primary))] focus:ring-[hsl(var(--bc-primary))]"
                    />
                    <div>
                      <span className="text-[hsl(var(--bc-text))]">Manage settings</span>
                      <p className="text-xs text-[hsl(var(--bc-text-muted))]">Can modify group settings</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetRoleForm}
                  className="flex-1 px-4 py-2 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  disabled={creatingRole || !newRoleName.trim()}
                  className="flex-1 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  {creatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : editingRole ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingRole ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-4">
              Assign Role to {selectedMember.user.username}
            </h2>
            
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleAssignRole(null)}
                disabled={assigningRole}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${
                  !selectedMember.role_id 
                    ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10' 
                    : 'border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gray-400" />
                <span className="text-[hsl(var(--bc-text))]">No Role</span>
              </button>
              
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleAssignRole(role.id)}
                  disabled={assigningRole}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${
                    selectedMember.role_id === role.id 
                      ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10' 
                      : 'border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))]'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }} />
                  <span className="text-[hsl(var(--bc-text))]">{role.name}</span>
                  {role.is_default && (
                    <span className="text-xs text-[hsl(var(--bc-text-muted))]">(Default)</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowMemberModal(false);
                setSelectedMember(null);
              }}
              className="w-full px-4 py-2 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showOwnershipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-4">Transfer Ownership</h2>
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
              Select a member to transfer ownership to. This cannot be undone.
            </p>
            
            <div className="space-y-2 mb-4">
              {members.filter(m => m.forum_user_id !== group.owner_id).map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedNewOwner(member)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${
                    selectedNewOwner?.id === member.id 
                      ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10' 
                      : 'border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))]'
                  }`}
                >
                  {member.user.avatar_url ? (
                    <img src={member.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="text-[hsl(var(--bc-text))]">{member.user.username}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOwnershipModal(false);
                  setSelectedNewOwner(null);
                }}
                className="flex-1 px-4 py-2 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOwnershipTransfer}
                disabled={!selectedNewOwner || transferring}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Verification Modal */}
      {show2FAVerify && forumUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <TwoFactorVerify
              email={context?.user?.email || ''}
              method={twoFAMethod}
              onVerified={handle2FAVerified}
              onCancel={() => {
                setShow2FAVerify(false);
                setPendingAction(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
