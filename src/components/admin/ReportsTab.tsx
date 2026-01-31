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

    // Get the forum user id
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
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded-full">Pending</span>;
      case 'actioned':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">Actioned</span>;
      case 'dismissed':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">Dismissed</span>;
      case 'reviewed':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">Reviewed</span>;
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Reports
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl`}>
          <Flag className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            {filter === 'pending' ? 'No pending reports' : 'No reports found'}
          </p>
        </div>
      ) : (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {reports.map(report => (
              <div key={report.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {getTypeIcon(report.reported_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {report.reported_type.charAt(0).toUpperCase() + report.reported_type.slice(1)} Report
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      <strong>Reason:</strong> {report.reason}
                    </p>
                    
                    {report.details && (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        <strong>Details:</strong> {report.details}
                      </p>
                    )}
                    
                    <div className={`flex items-center gap-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      <span>Reported by: {report.reporter?.username || 'Unknown'}</span>
                      <span>{formatDate(report.created_at)}</span>
                      {getViewLink(report.reported_type, report.reported_id) && (
                        <Link 
                          to={getViewLink(report.reported_type, report.reported_id)!}
                          target="_blank"
                          className="flex items-center gap-1 text-blue-500 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Link>
                      )}
                    </div>

                    {report.action_taken && (
                      <p className={`text-sm mt-2 p-2 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        <strong>Action taken:</strong> {report.action_taken}
                      </p>
                    )}
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(report.id, 'actioned', 'Content reviewed and action taken')}
                        disabled={processing === report.id}
                        className="p-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded-lg transition"
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
                        className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg transition"
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
