import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Ban, Clock, Search, RefreshCw, Check, X, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ForumUserData {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspension_ends_at: string | null;
  post_count: number;
  created_at: string;
}

interface ForumModTabProps {
  darkMode: boolean;
}

export default function ForumModTab({ darkMode }: ForumModTabProps) {
  const [forumUsers, setForumUsers] = useState<ForumUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [suspending, setSuspending] = useState(false);

  useEffect(() => {
    fetchForumUsers();
  }, []);

  const fetchForumUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('forum_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setForumUsers(data);
    }
    setLoading(false);
  };

  const handleSuspend = async (userId: string) => {
    setSuspending(true);

    const expiresAt = suspensionDays === 'permanent' 
      ? null 
      : new Date(Date.now() + parseInt(suspensionDays) * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('forum_users')
      .update({
        is_suspended: true,
        suspension_reason: suspensionReason || 'Violation of community guidelines',
        suspension_ends_at: expiresAt
      })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to suspend user');
    } else {
      toast.success('User suspended');
      fetchForumUsers();
      setShowSuspendModal(null);
      setSuspensionReason('');
      setSuspensionDays('7');
    }
    setSuspending(false);
  };

  const handleUnsuspend = async (userId: string) => {
    const { error } = await supabase
      .from('forum_users')
      .update({
        is_suspended: false,
        suspension_reason: null,
        suspension_ends_at: null
      })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to unsuspend user');
    } else {
      toast.success('User unsuspended');
      fetchForumUsers();
    }
  };

  const filteredUsers = forumUsers.filter(u => 
    search.trim() === '' || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${textClass}`}>Forum Moderation</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username..."
              className={`pl-9 pr-4 py-2 w-64 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${inputClass}`}
            />
          </div>
          <button
            onClick={fetchForumUsers}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`${cardClass} border rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className={`text-2xl font-bold ${textClass}`}>{forumUsers.length}</div>
              <div className={`text-sm ${mutedClass}`}>Total Users</div>
            </div>
          </div>
        </div>
        <div className={`${cardClass} border rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className={`text-2xl font-bold ${textClass}`}>
                {forumUsers.filter(u => u.is_suspended).length}
              </div>
              <div className={`text-sm ${mutedClass}`}>Suspended</div>
            </div>
          </div>
        </div>
        <div className={`${cardClass} border rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className={`text-2xl font-bold ${textClass}`}>
                {forumUsers.filter(u => !u.is_suspended).length}
              </div>
              <div className={`text-sm ${mutedClass}`}>Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <tr>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>User</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Status</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Posts</th>
                <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Joined</th>
                <th className={`text-right px-6 py-4 text-sm font-semibold ${mutedClass}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-12 text-center ${mutedClass}`}>
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-12 text-center ${mutedClass}`}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <span className={`font-medium ${textClass}`}>{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_suspended ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <Ban className="w-3 h-3" />
                            Suspended
                          </span>
                          {user.suspension_ends_at && (
                            <div className={`text-xs mt-1 ${mutedClass}`}>
                              Until: {new Date(user.suspension_ends_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${mutedClass}`}>{user.post_count}</td>
                    <td className={`px-6 py-4 text-sm ${mutedClass}`}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.is_suspended ? (
                        <button
                          onClick={() => handleUnsuspend(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition ml-auto"
                        >
                          <Check className="w-4 h-4" />
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowSuspendModal(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition ml-auto"
                        >
                          <Ban className="w-4 h-4" />
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClass} border rounded-2xl p-6 w-full max-w-md`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Suspend User</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>Reason</label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Reason for suspension..."
                  className={`w-full px-4 py-2 border rounded-lg resize-none ${inputClass}`}
                  rows={3}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>Duration</label>
                <select
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSuspendModal(null)}
                className={`px-4 py-2 ${mutedClass} hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(showSuspendModal)}
                disabled={suspending}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                <Ban className="w-4 h-4" />
                {suspending ? 'Suspending...' : 'Suspend User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
