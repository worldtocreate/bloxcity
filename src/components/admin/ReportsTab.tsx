import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flag, Eye, Check, X, Loader2, AlertTriangle, User, MessageSquare, FileText, ThumbsUp, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Report {
  id: string;
  reporter_id: string;
  reported_type: 'thread' | 'post' | 'status' | 'profile';
  reported_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
  reporter?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ReportsTabProps {
  darkMode: boolean;
}

export default function ReportsTab({ darkMode }: ReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);

    let query = supabase
      .from('forum_reports')
      .select(`
        *,
        reporter:reporter_id (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter === 'pending') {
      query = query.eq('status', 'pending');
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load reports');
    } else {
      setReports(data as unknown as Report[]);
    }

    setLoading(false);
  };

  const handleAction = async (reportId: string, action: 'actioned' | 'dismissed', actionTaken?: string) => {
    setProcessing(reportId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Not authenticated');
      setProcessing(null);
      return;
    }

    const { data: forumUser } = await supabase
      .from('forum_users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('forum_reports')
      .update({
        status: action,
        reviewed_by: forumUser?.id || null,
        reviewed_at: new Date().toISOString(),
        action_taken: actionTaken || null
      })
      .eq('id', reportId);

    if (error) {
      toast.error('Failed to update report');
    } else {
      toast.success(action === 'actioned' ? 'Report actioned' : 'Report dismissed');
      fetchReports();
    }

    setProcessing(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'thread': return <FileText className="w-4 h-4" />;
      case 'post': return <MessageSquare className="w-4 h-4" />;
      case 'status': return <ThumbsUp className="w-4 h-4" />;
      case 'profile': return <User className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full">Pending</span>;
      case 'actioned':
        return <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">Actioned</span>;
      case 'dismissed':
        return <span className="px-2.5 py-1 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full">Dismissed</span>;
      case 'reviewed':
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full">Reviewed</span>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getViewLink = (type: string, id: string) => {
    switch (type) {
      case 'thread': return `/thread/${id}`;
      case 'profile': return `/user/${id}`;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Review and manage user reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === 'pending'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#0f0f18] border border-white/5 text-gray-400 hover:text-white hover:border-white/10'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#0f0f18] border border-white/5 text-gray-400 hover:text-white hover:border-white/10'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 bg-[#0f0f18] border border-white/5 rounded-2xl">
          <Flag className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">
            {filter === 'pending' ? 'No pending reports' : 'No reports found'}
          </p>
        </div>
      ) : (
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {reports.map(report => (
              <div key={report.id} className="p-5 hover:bg-white/[0.02] transition">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 text-gray-400">
                    {getTypeIcon(report.reported_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white">
                        {report.reported_type.charAt(0).toUpperCase() + report.reported_type.slice(1)} Report
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">
                      <span className="text-gray-500">Reason:</span> {report.reason}
                    </p>
                    
                    {report.details && (
                      <p className="text-sm text-gray-400 mb-2">
                        <span className="text-gray-500">Details:</span> {report.details}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Reported by: <span className="text-gray-400">{report.reporter?.username || 'Unknown'}</span></span>
                      <span>{formatDate(report.created_at)}</span>
                      {getViewLink(report.reported_type, report.reported_id) && (
                        <Link 
                          to={getViewLink(report.reported_type, report.reported_id)!}
                          target="_blank"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Link>
                      )}
                    </div>

                    {report.action_taken && (
                      <div className="text-sm mt-3 p-3 rounded-xl bg-white/5 text-gray-300">
                        <span className="text-gray-500">Action taken:</span> {report.action_taken}
                      </div>
                    )}
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(report.id, 'actioned', 'Content reviewed and action taken')}
                        disabled={processing === report.id}
                        className="p-2.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl transition"
                        title="Take Action"
                      >
                        {processing === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'dismissed', 'No violation found')}
                        disabled={processing === report.id}
                        className="p-2.5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
