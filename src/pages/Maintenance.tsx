 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Hammer, Loader2 } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 
 interface MaintenanceProps {
   message?: string;
 }
 
 export default function Maintenance({ message }: MaintenanceProps) {
   const navigate = useNavigate();
   const [inputPassword, setInputPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError('');
     
     const { data, error: rpcError } = await supabase.rpc('verify_maintenance_password', {
       p_password: inputPassword
     });
     
     if (rpcError) {
       console.error('Verification error:', rpcError);
       setError('Verification failed. Please try again.');
     } else if (data === true) {
       sessionStorage.setItem('maintenance_bypass', 'true');
       navigate('/');
       window.location.reload();
     } else {
       setError('Incorrect password');
     }
     
     setLoading(false);
   };
 
   return (
     <div className="min-h-screen bg-[hsl(var(--bc-bg-dark))] flex items-center justify-center p-4">
       <main className="max-w-[700px] w-full text-center">
         <Hammer className="w-20 h-20 mx-auto text-[hsl(var(--bc-text-muted))]" />
         
         <h1 className="text-4xl font-bold text-[hsl(var(--bc-text))] mt-4 mb-0">
           We'll be back soon!
         </h1>
         <p className="text-[hsl(var(--bc-text-muted))] mt-2 text-lg">
           {message || "We're performing some maintenance at the moment."}
         </p>
         
         <form onSubmit={handleSubmit} className="mt-6">
           <div className="flex flex-col sm:flex-row gap-2 items-stretch justify-center max-w-md mx-auto">
             <input
               type="password"
               value={inputPassword}
               onChange={(e) => {
                 setInputPassword(e.target.value);
                 setError('');
               }}
               placeholder="Developer Password"
               className="flex-1 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-2.5 text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:border-[hsl(var(--bc-primary))] text-sm"
               disabled={loading}
               required
             />
             <button
               type="submit"
               disabled={loading}
               className="bg-[hsl(var(--bc-success))] hover:opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2 min-w-[100px]"
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
               {loading ? 'Loading...' : 'Login'}
             </button>
           </div>
           {error && (
             <p className="text-[hsl(var(--bc-error))] text-sm mt-2 text-left max-w-md mx-auto">{error}</p>
           )}
         </form>
         
         <div className="flex justify-center gap-6 mt-8">
           <a
             href="https://x.com/bloxcity"
             target="_blank"
             rel="noopener noreferrer"
             className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
           >
             <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
               <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
             </svg>
           </a>
           <a
             href="https://discord.gg/bloxcity"
             target="_blank"
             rel="noopener noreferrer"
             className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
           >
             <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
               <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
             </svg>
           </a>
         </div>
       </main>
     </div>
   );
 }