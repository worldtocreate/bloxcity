import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Megaphone, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SiteUpdate { id: string; title: string; content: string; category: string; is_published: boolean; created_at: string; }
const categories = [{ value: 'feature', label: 'New Feature' }, { value: 'bugfix', label: 'Bug Fix' }, { value: 'improvement', label: 'Improvement' }, { value: 'security', label: 'Security' }, { value: 'announcement', label: 'Announcement' }, { value: 'launch', label: 'Launch' }, { value: 'community', label: 'Community' }, { value: 'general', label: 'General' }];

export default function UpdatesTab() {
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SiteUpdate | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => { fetchUpdates(); }, []);

  const fetchUpdates = async () => { const { data } = await supabase.from('site_updates').select('*').order('created_at', { ascending: false }); if (data) setUpdates(data); setLoading(false); };
  const resetForm = () => { setTitle(''); setContent(''); setCategory('general'); setIsPublished(true); setEditingUpdate(null); };
  const openCreateModal = () => { resetForm(); setShowModal(true); };
  const openEditModal = (update: SiteUpdate) => { setEditingUpdate(update); setTitle(update.title); setContent(update.content); setCategory(update.category); setIsPublished(update.is_published); setShowModal(true); };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return; }
    setSaving(true);
    if (editingUpdate) { const { error } = await supabase.from('site_updates').update({ title: title.trim(), content: content.trim(), category, is_published: isPublished, updated_at: new Date().toISOString() }).eq('id', editingUpdate.id); if (error) toast.error('Failed to update'); else { toast.success('Update saved!'); setShowModal(false); resetForm(); fetchUpdates(); } }
    else { const { data: { user } } = await supabase.auth.getUser(); const { error } = await supabase.from('site_updates').insert({ title: title.trim(), content: content.trim(), category, is_published: isPublished, created_by: user?.id }); if (error) toast.error('Failed to create update'); else { toast.success('Update created!'); setShowModal(false); resetForm(); fetchUpdates(); } }
    setSaving(false);
  };

  const handleDelete = async (id: string) => { if (!confirm('Are you sure you want to delete this update?')) return; const { error } = await supabase.from('site_updates').delete().eq('id', id); if (error) toast.error('Failed to delete'); else { toast.success('Update deleted'); fetchUpdates(); } };
  const togglePublish = async (update: SiteUpdate) => { const { error } = await supabase.from('site_updates').update({ is_published: !update.is_published }).eq('id', update.id); if (error) toast.error('Failed to update'); else { toast.success(update.is_published ? 'Unpublished' : 'Published'); fetchUpdates(); } };
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-white">Site Updates</h2><p className="text-sm text-gray-400">Manage updates shown on the /updates page</p></div><div className="flex gap-3"><a href="/updates" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10"><ExternalLink className="w-4 h-4" />View Page</a><button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition"><Plus className="w-4 h-4" />New Update</button></div></div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div> : updates.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-[#12121a]"><Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-600" /><h3 className="font-medium text-gray-300">No updates yet</h3><p className="text-sm mt-1 text-gray-500">Create your first site update to share with users</p></div>
      ) : (
        <div className="space-y-4">
          {updates.map(update => (
            <div key={update.id} className="rounded-xl p-5 bg-[#12121a] border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2"><h3 className="font-semibold truncate text-white">{update.title}</h3><span className={`px-2 py-0.5 text-xs rounded-full capitalize ${update.is_published ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}>{update.is_published ? 'Published' : 'Draft'}</span><span className="px-2 py-0.5 text-xs rounded-full capitalize bg-white/5 text-gray-400">{update.category}</span></div>
                  <p className="text-sm line-clamp-2 text-gray-400">{update.content}</p>
                  <p className="text-xs mt-2 text-gray-500">{formatDate(update.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePublish(update)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400" title={update.is_published ? 'Unpublish' : 'Publish'}>{update.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  <button onClick={() => openEditModal(update)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(update.id)} className="p-2 rounded-lg hover:bg-red-900/30 text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-[#12121a] max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10"><h3 className="text-lg font-semibold text-white">{editingUpdate ? 'Edit Update' : 'New Update'}</h3></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-2 text-gray-300">Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Update title..." className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500" /></div>
              <div><label className="block text-sm font-medium mb-2 text-gray-300">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white">{categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-2 text-gray-300">Content</label><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your update content..." rows={8} className="w-full px-4 py-3 rounded-lg border border-white/10 resize-none bg-white/5 text-white placeholder-gray-500" /></div>
              <div className="flex items-center gap-3"><input type="checkbox" id="published" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-4 h-4 rounded border-gray-600" /><label htmlFor="published" className="text-sm text-gray-300">Publish immediately</label></div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3"><button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white">Cancel</button><button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingUpdate ? 'Save Changes' : 'Create Update'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
