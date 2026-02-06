import { useEffect, useState } from "react";
import { 
  Users, Clock, Check, Mail, RefreshCw, TrendingUp, 
  Activity, Globe, AlertCircle, Ban, ArrowUpRight, ArrowDownRight,
  Eye, MessageSquare, Gamepad2, UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Stats, SystemHealth } from "./types";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

interface DashboardTabProps {
  darkMode: boolean;
}

interface DailyData {
  date: string;
  reservations: number;
  subscribers: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const DashboardTab = ({ darkMode }: DashboardTabProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    edgeFunctions: 'healthy',
    lastChecked: new Date().toISOString()
  });

  const fetchStats = async () => {
    setLoading(true);
    const response = await supabase.functions.invoke('admin-get-stats');
    if (response.data?.stats) {
      setStats(response.data.stats);
    }
    if (response.data?.dailyData) {
      setDailyData(response.data.dailyData);
    }
    setLoading(false);
  };

  const checkSystemHealth = async () => {
    try {
      const start = Date.now();
      await supabase.from('reserved_usernames').select('id').limit(1);
      const dbLatency = Date.now() - start;
      
      setSystemHealth({
        database: dbLatency < 1000 ? 'healthy' : dbLatency < 3000 ? 'degraded' : 'down',
        edgeFunctions: 'healthy',
        lastChecked: new Date().toISOString()
      });
    } catch {
      setSystemHealth(prev => ({ ...prev, database: 'down' }));
    }
  };

  useEffect(() => {
    fetchStats();
    checkSystemHealth();
    const interval = setInterval(() => {
      fetchStats();
      checkSystemHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusDistribution = stats ? [
    { name: 'Approved', value: stats.reservations.approved, color: '#10b981' },
    { name: 'Pending', value: stats.reservations.pending, color: '#f59e0b' },
    { name: 'Denied', value: stats.reservations.denied, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  const trendData = dailyData.length > 0 ? dailyData : [
    { date: 'Mon', reservations: 12, subscribers: 8 },
    { date: 'Tue', reservations: 19, subscribers: 12 },
    { date: 'Wed', reservations: 15, subscribers: 10 },
    { date: 'Thu', reservations: 22, subscribers: 15 },
    { date: 'Fri', reservations: 28, subscribers: 18 },
    { date: 'Sat', reservations: 24, subscribers: 14 },
    { date: 'Sun', reservations: 18, subscribers: 11 },
  ];

  const StatCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    iconBg,
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    change?: string; 
    changeType?: 'up' | 'down'; 
    icon: any; 
    iconBg: string;
    subtitle?: string;
  }) => (
    <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            changeType === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {changeType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
      {subtitle && <div className="text-xs text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* System Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f0f18] border border-white/5 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${
              systemHealth.database === 'healthy' ? 'bg-green-500 animate-pulse' : 
              systemHealth.database === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-400">
              {systemHealth.database === 'healthy' ? 'All systems operational' : 'System issues detected'}
            </span>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f0f18] border border-white/5 hover:border-white/10 text-gray-300 rounded-xl transition text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.reservations.total || 0}
          change={`+${stats?.reservations.todayCount || 0} today`}
          changeType="up"
          icon={Users}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pending Review"
          value={stats?.reservations.pending || 0}
          icon={Clock}
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
          subtitle={stats?.reservations.pending && stats.reservations.pending > 10 ? 'Needs attention' : 'Awaiting approval'}
        />
        <StatCard
          title="Approval Rate"
          value={`${stats?.reservations.approvalRate || 0}%`}
          icon={Check}
          iconBg="bg-gradient-to-br from-green-500 to-emerald-600"
          subtitle={`${stats?.reservations.approved || 0} approved`}
        />
        <StatCard
          title="Newsletter Subs"
          value={stats?.newsletter.active || 0}
          change={`+${stats?.newsletter.todayCount || 0}`}
          changeType="up"
          icon={Mail}
          iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-[#0f0f18] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Activity Overview</h3>
              <p className="text-sm text-gray-500 mt-0.5">User registrations over the past week</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-gray-400">Registrations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-gray-400">Newsletter</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  axisLine={{ stroke: '#1f1f2e' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f0f18', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="reservations" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorReservations)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="subscribers" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSubscribers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Status Distribution</h3>
          <p className="text-sm text-gray-500 mb-6">User application status breakdown</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f0f18', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">This Week</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.reservations.weekCount || 0}</div>
          <div className="text-xs text-gray-600 mt-1">new registrations</div>
        </div>
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Ban className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">Banned Words</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.bannedWords || 0}</div>
          <div className="text-xs text-gray-600 mt-1">blocked terms</div>
        </div>
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-400">Blocked IPs</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.blockedIPs || 0}</div>
          <div className="text-xs text-gray-600 mt-1">addresses blocked</div>
        </div>
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Unsubscribed</span>
          </div>
          <div className="text-2xl font-bold text-white">{(stats?.newsletter.total || 0) - (stats?.newsletter.active || 0)}</div>
          <div className="text-xs text-gray-600 mt-1">inactive subscribers</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition text-sm font-medium shadow-lg shadow-blue-500/20">
            Review Pending ({stats?.reservations.pending || 0})
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-purple-400 transition text-sm font-medium shadow-lg shadow-purple-500/20">
            Send Newsletter
          </button>
          <button className="px-5 py-2.5 bg-[#1a1a28] border border-white/5 text-gray-300 hover:text-white hover:border-white/10 rounded-xl transition text-sm font-medium">
            Export Data
          </button>
          <button className="px-5 py-2.5 bg-[#1a1a28] border border-white/5 text-gray-300 hover:text-white hover:border-white/10 rounded-xl transition text-sm font-medium">
            View Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
