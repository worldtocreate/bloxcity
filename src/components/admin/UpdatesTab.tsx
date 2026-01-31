import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Megaphone, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SiteUpdate {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

interface UpdatesTabProps {
  darkMode: boolean;
}

const categories = [
  { value: 'feature', label: 'New Feature' },
  { value: 'bugfix', label: 'Bug Fix' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'security', label: 'Security' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'launch', label: 'Launch' },
  { value: 'community', label: 'Community' },
  { value: 'general', label: 'General' },
];

export default function UpdatesTab({ darkMode }: UpdatesTabProps) {
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SiteUpdate | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from('site_updates')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUpdates(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('general');
    setIsPublished(true);
    setEditingUpdate(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (update: SiteUpdate) => {
    setEditingUpdate(update);
    setTitle(update.title);
    setContent(update.content);
    setCategory(update.category);
    setIsPublished(update.is_published);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);

    if (editingUpdate) {
      const { error } = await supabase
        .from('site_updates')
        .update({
          title: title.trim(),
          content: content.trim(),
          category,
          is_published: isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUpdate.id);

      if (error) {
        toast.error('Failed to update');
      } else {
        toast.success('Update saved!');
        setShowModal(false);
        resetForm();
        fetchUpdates();
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('site_updates')
        .insert({
          title: title.trim(),
          content: content.trim(),
          category,
          is_published: isPublished,
          created_by: user?.id
        });

      if (error) {
        toast.error('Failed to create update');
      } else {
        toast.success('Update created!');
        setShowModal(false);
        resetForm();
        fetchUpdates();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this update?')) return;

    const { error } = await supabase
      .from('site_updates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Update deleted');
      fetchUpdates();
    }
  };

  const togglePublish = async (update: SiteUpdate) => {
    const { error } = await supabase
      .from('site_updates')
      .update({ is_published: !update.is_published })
      .eq('id', update.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(update.is_published ? 'Unpublished' : 'Published');
      fetchUpdates();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Site Updates
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage updates shown on the /updates page
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/updates"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            View Page
          </a>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Update
          </button>
        </div>
      </div>

      {/* Updates List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className={`w-8 h-8 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
      ) : updates.length === 0 ? (
        <div className={`text-center py-12 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <Megaphone className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No updates yet</h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Create your first site update to share with users
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map(update => (
            <div
              key={update.id}
              className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {update.title}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                      update.is_published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {update.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {update.category}
                    </span>
                  </div>
                  <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {update.content}
                  </p>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDate(update.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(update)}
                    className={`p-2 rounded-lg transition ${
                      darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title={update.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {update.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEditModal(update)}
                    className={`p-2 rounded-lg transition ${
                      darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(update.id)}
                    className={`p-2 rounded-lg transition text-red-500 ${
                      darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingUpdate ? 'Edit Update' : 'New Update'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Update title..."
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your update content..."
                  rows={8}
                  className={`w-full px-4 py-3 rounded-lg border resize-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="published" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Publish immediately
                </label>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingUpdate ? 'Save Changes' : 'Create Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}