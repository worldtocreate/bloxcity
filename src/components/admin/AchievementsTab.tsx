import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Award, Plus, Search, Trash2, UserPlus, X, Loader2, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  color: string;
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
  const [newColor, setNewColor] = useState('#FFD700');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAchievements(data as Achievement[]);
    }
    setLoading(false);
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setUploading(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `achievement_${Date.now()}.${fileExt}`;
    const filePath = `achievements/${fileName}`;

    const { error } = await supabase.storage
      .from('forum-avatars')
      .upload(filePath, imageFile);

    if (error) {
      toast.error('Failed to upload image');
      setUploading(false);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('forum-avatars')
      .getPublicUrl(filePath);

    setUploading(false);
    return urlData.publicUrl;
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Name is required');
      return;
    }

    setCreating(true);
    
    // Upload image if selected
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage();
    }

    const { error } = await supabase
      .from('forum_achievements')
      .insert({
        name: newName.trim(),
        description: newDescription.trim() || null,
        image_url: imageUrl,
        color: newColor
      });

    if (error) {
      toast.error('Failed to create achievement');
    } else {
      toast.success('Achievement created!');
      setShowCreateModal(false);
      resetCreateForm();
      fetchAchievements();
    }
    setCreating(false);
  };

  const resetCreateForm = () => {
    setNewName('');
    setNewDescription('');
    setNewColor('#FFD700');
    setImageFile(null);
    setImagePreview(null);
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
      handleOpenAward(selectedAchievement);
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
        {achievements.map(achievement => (
          <div key={achievement.id} className={`${cardClass} border rounded-xl p-4`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {achievement.image_url ? (
                  <img 
                    src={achievement.image_url} 
                    alt={achievement.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${achievement.color}20` }}
                  >
                    <Award className="w-5 h-5" style={{ color: achievement.color }} />
                  </div>
                )}
                <div>
                  <h3 className={`font-semibold ${textClass}`}>{achievement.name}</h3>
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
        ))}
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
              <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className={mutedClass}>
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

              {/* Image Upload */}
              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>Badge Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative w-20 h-20">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-20 h-20 rounded-lg object-cover border-2 border-dashed border-blue-400"
                    />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-4 border-2 border-dashed rounded-lg flex flex-col items-center gap-2 hover:bg-opacity-50 transition ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <Upload className={`w-6 h-6 ${mutedClass}`} />
                    <span className={`text-sm ${mutedClass}`}>Click to upload image</span>
                    <span className={`text-xs ${mutedClass}`}>Max 2MB</span>
                  </button>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>Fallback Color</label>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
                <p className={`text-xs ${mutedClass} mt-1`}>Used if no image is uploaded</p>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating || uploading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {(creating || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? 'Uploading...' : 'Create Achievement'}
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