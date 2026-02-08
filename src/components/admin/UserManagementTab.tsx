import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, RotateCcw, Lock, Unlock, Ban, Loader2, Search, AlertTriangle, Mail, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface PurgedUsername {
  id: string;
  username: string;
  purged_at: string;
  reason: string | null;
  reverted_at: string | null;
}

interface ForumUserItem {
  id: string;
  username: string;
  avatar_url: string | null;
  is_suspended: boolean;
  is_locked: boolean;
  created_at: string;
}

export default function UserManagementTab() {
  const [activeSection, setActiveSection] = useState<'purge' | 'accounts'>('purge');
  const [purgedUsernames, setPurgedUsernames] = useState<PurgedUsername[]>([]);
  const [forumUsers, setForumUsers] = useState<ForumUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<{ id: string; username: string } | null>(null);
  const [purgeReason, setPurgeReason] = useState('');
  const [purging, setPurging] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Account action modal
  const [showAccountModal, setShowAccountModal] = useState<{ user: ForumUserItem; action: 'suspend' | 'lock' | 'disable' } | null>(null);
  const [accountReason, setAccountReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('7');

  // Email editing modal
  const [showEmailModal, setShowEmailModal] = useState<ForumUserItem | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailUpdating, setEmailUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const fetchData = async () => {
    setLoading(true);
    if (activeSection === 'purge') {
      const { data } = await supabase
        .from('purged_usernames')
        .select('*')
        .order('purged_at', { ascending: false });
      setPurgedUsernames((data || []) as PurgedUsername[]);
    } else {
      const { data } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url, is_suspended, is_locked, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      setForumUsers((data || []) as ForumUserItem[]);
    }
    setLoading(false);
  };

  const handleSearchForumUser = async () => {
    if (!searchQuery.trim()) return;
    
    const { data, error } = await supabase
      .from('forum_users')
      .select('id, username')
      .ilike('username', searchQuery.trim())
      .single();

    if (error || !data) {
      toast.error('Forum user not found');
      return;
    }

    setSelectedReservation({ id: data.id, username: data.username });
  };

  const handlePurge = async () => {
    if (!selectedReservation) return;
    setPurging(true);

    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      // Insert into purged_usernames (for forum accounts, no reservation_id)
      const { error: purgeError } = await supabase
        .from('purged_usernames')
        .insert({
          username: selectedReservation.username,
          original_reservation_id: null,
          purged_by: currentUser?.id,
          reason: purgeReason || null
        });

      if (purgeError) throw purgeError;

      // Generate a random replacement username
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const purgedUsername = `purged_${randomSuffix}`;

      // Update the forum user's username to a purged placeholder
      const { error: updateError } = await supabase
        .from('forum_users')
        .update({ 
          username: purgedUsername,
          last_username_change_at: new Date().toISOString()
        })
        .eq('id', selectedReservation.id);

      if (updateError) throw updateError;

      toast.success(`Username "${selectedReservation.username}" purged and replaced with "${purgedUsername}"`);
      setSelectedReservation(null);
      setPurgeReason('');
      setSearchQuery('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to purge username');
    }
    setPurging(false);
  };

  const handleRevert = async (purged: PurgedUsername) => {
    setActionLoading(purged.id);
    
    const { error } = await supabase
      .from('purged_usernames')
      .update({
        reverted_at: new Date().toISOString(),
        reverted_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', purged.id);

    if (error) {
      toast.error('Failed to revert purge');
    } else {
      toast.success(`Revert recorded for "${purged.username}"`);
      fetchData();
    }
    setActionLoading(null);
  };

  const handleUpdateEmail = async () => {
    if (!showEmailModal || !newEmail.trim()) return;
    setEmailUpdating(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: { action: 'update_email', forumUserId: showEmailModal.id, newEmail: newEmail.trim() }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Email updated successfully');
      setShowEmailModal(null);
      setNewEmail('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update email');
    }
    setEmailUpdating(false);
  };

  const handleAccountAction = async () => {
    if (!showAccountModal) return;
    setActionLoading(showAccountModal.user.id);

    const { user, action } = showAccountModal;

    try {
      if (action === 'suspend') {
        let suspendUntil: string | null = null;
        if (suspendDuration !== 'permanent') {
          suspendUntil = new Date(Date.now() + parseInt(suspendDuration) * 24 * 60 * 60 * 1000).toISOString();
        }
        
        const { error } = await supabase
          .from('forum_users')
          .update({
            is_suspended: true,
            suspension_reason: accountReason,
            suspension_ends_at: suspendUntil
          })
          .eq('id', user.id);

        if (error) throw error;
        toast.success('User suspended');
      } else if (action === 'lock') {
        const { error } = await supabase
          .from('forum_users')
          .update({
            is_locked: !user.is_locked,
            locked_at: user.is_locked ? null : new Date().toISOString(),
            locked_reason: user.is_locked ? null : accountReason,
            locked_by: user.is_locked ? null : (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', user.id);

        if (error) throw error;
        toast.success(user.is_locked ? 'Account unlocked' : 'Account locked');
      } else if (action === 'disable') {
        const { error } = await supabase
          .from('forum_users')
          .update({
            is_suspended: false,
            suspension_reason: null,
            suspension_ends_at: null
          })
          .eq('id', user.id);

        if (error) throw error;
        toast.success('Suspension lifted');
      }

      setShowAccountModal(null);
      setAccountReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
    setActionLoading(null);
  };

  const filteredUsers = forumUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('purge')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeSection === 'purge'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Purge Usernames
        </button>
        <button
          onClick={() => setActiveSection('accounts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeSection === 'accounts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Account Management
        </button>
      </div>

      {activeSection === 'purge' ? (
        <div className="space-y-6">
          {/* Purge Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Purge a Forum Username</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Search for a forum account username to purge. This will replace their username with a random placeholder and record the purge.
            </p>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter forum username to purge..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleSearchForumUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Search
              </button>
            </div>

            {selectedReservation && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    Found: {selectedReservation.username}
                  </span>
                </div>
                <textarea
                  value={purgeReason}
                  onChange={(e) => setPurgeReason(e.target.value)}
                  placeholder="Reason for purging (optional)..."
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePurge}
                    disabled={purging}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg"
                  >
                    {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Purge Username
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReservation(null);
                      setPurgeReason('');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Purged List */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">Purged Usernames</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : purgedUsernames.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No purged usernames</div>
            ) : (
              <div className="divide-y">
                {purgedUsernames.map((purged) => (
                  <div key={purged.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{purged.username}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(purged.purged_at).toLocaleDateString()}
                      </span>
                      {purged.reason && (
                        <p className="text-sm text-gray-600">{purged.reason}</p>
                      )}
                      {purged.reverted_at && (
                        <span className="text-xs text-green-600">Reverted</span>
                      )}
                    </div>
                    {!purged.reverted_at && (
                      <button
                        onClick={() => handleRevert(purged)}
                        disabled={actionLoading === purged.id}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
                      >
                        {actionLoading === purged.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Revert
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                      )}
                      <div>
                        <span className="font-medium">{user.username}</span>
                        <div className="flex items-center gap-2 text-xs">
                          {user.is_suspended && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">Suspended</span>
                          )}
                          {user.is_locked && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Locked</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowEmailModal(user);
                          setNewEmail('');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                        title="Edit Email"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </button>
                      <button
                        onClick={() => setShowAccountModal({ user, action: 'lock' })}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${
                          user.is_locked
                            ? 'bg-green-100 hover:bg-green-200 text-green-700'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                        }`}
                      >
                        {user.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {user.is_locked ? 'Unlock' : 'Lock'}
                      </button>
                      {user.is_suspended ? (
                        <button
                          onClick={() => setShowAccountModal({ user, action: 'disable' })}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
                        >
                          <Unlock className="w-4 h-4" />
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAccountModal({ user, action: 'suspend' })}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                        >
                          <Ban className="w-4 h-4" />
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Action Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {showAccountModal.action === 'suspend' && 'Suspend Account'}
              {showAccountModal.action === 'lock' && (showAccountModal.user.is_locked ? 'Unlock Account' : 'Lock Account')}
              {showAccountModal.action === 'disable' && 'Remove Suspension'}
            </h3>
            <p className="text-gray-600">
              User: <strong>{showAccountModal.user.username}</strong>
            </p>

            {showAccountModal.action === 'suspend' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select
                    value={suspendDuration}
                    onChange={(e) => setSuspendDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="1">1 day</option>
                    <option value="7">1 week</option>
                    <option value="30">1 month</option>
                    <option value="90">3 months</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={accountReason}
                    onChange={(e) => setAccountReason(e.target.value)}
                    placeholder="Reason for suspension..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
              </>
            )}

            {showAccountModal.action === 'lock' && !showAccountModal.user.is_locked && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={accountReason}
                  onChange={(e) => setAccountReason(e.target.value)}
                  placeholder="Reason for locking..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowAccountModal(null);
                  setAccountReason('');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountAction}
                disabled={actionLoading === showAccountModal.user.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {actionLoading === showAccountModal.user.id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Edit Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">Edit User Email</h3>
            <p className="text-gray-600 dark:text-gray-400">
              User: <strong>{showEmailModal.username}</strong>
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newemail@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowEmailModal(null);
                  setNewEmail('');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEmail}
                disabled={emailUpdating || !newEmail.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {emailUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
