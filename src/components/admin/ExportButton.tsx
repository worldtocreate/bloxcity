import { useState } from "react";
import { Download, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExportButtonProps {
  type: 'reservations' | 'subscribers' | 'logs';
  filter?: string;
  darkMode?: boolean;
}

const ExportButton = ({ type, filter, darkMode = false }: ExportButtonProps) => {
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    setExporting(true);
    setStatus('idle');
    
    try {
      const response = await supabase.functions.invoke('admin-export-data', {
        body: { type, filter }
      });
      
      if (response.data?.csv) {
        const blob = new Blob([response.data.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}${filter ? `-${filter}` : ''}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
    
    setExporting(false);
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition text-sm ${
        status === 'success' 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : status === 'error'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : darkMode 
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50`}
      title="Export to CSV"
    >
      {status === 'success' ? (
        <Check className="w-4 h-4" />
      ) : status === 'error' ? (
        <X className="w-4 h-4" />
      ) : (
        <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
      )}
      {exporting ? 'Exporting...' : status === 'success' ? 'Done!' : status === 'error' ? 'Failed' : 'Export'}
    </button>
  );
};

export default ExportButton;
