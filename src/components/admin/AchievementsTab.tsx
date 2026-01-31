import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Award, Plus, Search, Trash2, UserPlus, X, Loader2, Star, MessageSquare, CheckCircle, Heart, Trophy, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  rarity: string;
  created_at: string;
}

interface UserAchievement {
  id: string;
  awarded_at: string;
  forum_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface AchievementsTabProps {
  darkMode: boolean;
}

const iconOptions = [
  { value: 'star', label: 'Star', icon: Star },
  { value: 'message-square', label: 'Message', icon: MessageSquare },
  { value: 'check-circle', label: 'Check', icon: CheckCircle },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'trophy', label: 'Trophy', icon: Trophy },
  { value: 'crown', label: 'Crown', icon: Crown },
];

const rarityColors: Record<string, string> = {
  'common': 'bg-gray-100 text-gray-800',
  'rare': 'bg-blue-100 text-blue-800',
  'epic': 'bg-purple-100 text-purple-800',
  'legendary': 'bg-amber-100 text-amber-800',
};

export default function AchievementsTab({ darkMode }: AchievementsTabProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [awardedUsers, setAwardedUsers] = useState<UserAchievement[]>([]);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('star');
  const [newColor, setNewColor] = useState('#FFD700');
  const [newRarity, setNewRarity] = useState('common');
  const [creating, setCreating] = useState(false);

  // Award form state
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    const { data } = await supabase
      .from('forum_achievements')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setAchievements(data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Name is required');
      return;
    }

    setCreating(true);
    const { error } = await supabase
      .from('forum_achievements')
      .insert({
        name: newName.trim(),
        description: newDescription.trim() || null,
        icon: newIcon,
        color: newColor,
        rarity: newRarity
      });

    if (error) {
      toast.error('Failed to create achievement');
    } else {
      toast.success('Achievement created!');
      setShowCreateModal(false);
      setNewName('');
      setNewDescription('');
      setNewIcon('star');
      setNewColor('#FFD700');
      setNewRarity('common');
      fetchAchievements();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this achievement? This will remove it from all users.')) return;

    const { error } = await supabase
      .from('forum_achievements')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete achievement');
    } else {
      toast.success('Achievement deleted');
      fetchAchievements();
    }
  };

  const handleOpenAward = async (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowAwardModal(true);
    
    // Fetch users who have this achievement
    const { data } = await supabase
      .from('forum_user_achievements')
      .select(`
        id, awarded_at,
        forum_user:forum_user_id (id, username, avatar_url)
      `)
      .eq('achievement_id', achievement.id)
      .order('awarded_at', { ascending: false });

    if (data) {
      setAwardedUsers(data as unknown as UserAchievement[]);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from('forum_users')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(10);

    if (data) {
      // Filter out users who already have this achievement
      const awardedIds = new Set(awardedUsers.map(u => u.forum_user.id));
      setSearchResults(data.filter(u => !awardedIds.has(u.id)));
    }
    setSearching(false);
  };

  const handleAwardToUser = async (userId: string) => {
    if (!selectedAchievement) return;

    setAwarding(true);
    const { error } = await supabase
      .from('forum_user_achievements')
      .insert({
        forum_user_id: userId,
        achievement_id: selectedAchievement.id
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('User already has this achievement');
      } else {
        toast.error('Failed to award achievement');
      }
    } else {
      toast.success('Achievement awarded!');
      handleOpenAward(selectedAchievement); // Refresh the list
      setUserSearch('');
      setSearchResults([]);
    }
    setAwarding(false);
  };

  const handleRevokeAchievement = async (userAchievementId: string) => {
    if (!confirm('Revoke this achievement from the user?')) return;

    const { error } = await supabase
      .from('forum_user_achievements')
      .delete()
      .eq('id', userAchievementId);

    if (error) {
      toast.error('Failed to revoke achievement');
    } else {
      toast.success('Achievement revoked');
      if (selectedAchievement) {
        handleOpenAward(selectedAchievement);
      }
    }
  };

  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`w-8 h-8 ${mutedClass} animate-spin`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${textClass}`}>Achievements</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Create Achievement
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map(achievement => {
          const IconComponent = iconOptions.find(i => i.value === achievement.icon)?.icon || Award;
          return (
            <div key={achievement.id} className={`${cardClass} border rounded-xl p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${achievement.color}20` }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: achievement.color }} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${textClass}`}>{achievement.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rarityColors[achievement.rarity]}`}>
                      {achievement.rarity}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(achievement.id)}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {achievement.description && (
                <p className={`text-sm ${mutedClass} mb-3`}>{achievement.description}</p>
              )}
              <button
                onClick={() => handleOpenAward(achievement)}
                className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
              >
                <UserPlus className="w-4 h-4" />
                Award to User
              </button>
            </div>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <div className={`text-center py-12 ${mutedClass}`}>
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No achievements created yet</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} border rounded-xl p-6 max-w-md w-full`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textClass}`}>Create Achievement</h3>
              <button onClick={() => setShowCreateModal(false)} className={mutedClass}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                  placeholder="Achievement name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-1`}>Icon</label>
                  <select
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                  >
                    {iconOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-1`}>Color</label>
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>Rarity</label>
                <select
                  value={newRarity}
                  onChange={(e) => setNewRarity(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Achievement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award Modal */}
      {showAwardModal && selectedAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textClass}`}>
                Award: {selectedAchievement.name}
              </h3>
              <button onClick={() => { setShowAwardModal(false); setUserSearch(''); setSearchResults([]); }} className={mutedClass}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search users */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${textClass} mb-1`}>Search User</label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedClass}`} />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${inputClass}`}
                  placeholder="Search by username..."
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className={`mt-2 border rounded-lg ${cardClass} max-h-40 overflow-y-auto`}>
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAwardToUser(user.id)}
                      disabled={awarding}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-opacity-50 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium">{user.username[0].toUpperCase()}</span>
                        </div>
                      )}
                      <span className={textClass}>{user.username}</span>
                      <Plus className="w-4 h-4 ml-auto text-green-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Awarded users */}
            <div>
              <h4 className={`text-sm font-medium ${textClass} mb-2`}>
                Users with this achievement ({awardedUsers.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {awardedUsers.map(ua => (
                  <div key={ua.id} className={`flex items-center gap-3 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {ua.forum_user.avatar_url ? (
                      <img src={ua.forum_user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium">{ua.forum_user.username[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <span className={textClass}>{ua.forum_user.username}</span>
                      <p className={`text-xs ${mutedClass}`}>
                        Awarded {new Date(ua.awarded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeAchievement(ua.id)}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="Revoke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {awardedUsers.length === 0 && (
                  <p className={`text-sm ${mutedClass} text-center py-4`}>No users have this achievement yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
