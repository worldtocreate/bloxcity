import { useState, useEffect } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { ForumUser } from '@/hooks/useForumAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRightLeft, Loader2, Wrench, Search, Check, X, Clock,
  User, Box, ChevronRight, Send, Plus, Minus
} from 'lucide-react';

// Inline maintenance check
function usePageMaintenance(pageKey: string) {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const check = async () => {
      try {
        const { data, error } = await supabase.from('admin_settings').select('value').eq('key', 'page_maintenance').single();
        if (error) setIsUnderMaintenance(false);
        else if (data?.value) setIsUnderMaintenance((data.value as Record<string, boolean>)[pageKey] === true);
      } catch { setIsUnderMaintenance(false); }
      finally { setLoading(false); }
    };
    check();
  }, [pageKey]);
  return { isUnderMaintenance, loading };
}

function PageMaintenance({ pageName }: { pageName: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-3">{pageName} Under Maintenance</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-6">We are currently performing scheduled maintenance. Please check back soon!</p>
      </div>
    </div>
  );
}

type TradeItem = {
  id: string;
  inventory_id: string;
  item_id: string;
  serial_number: number | null;
  rap_at_trade: number | null;
  owner_id: string;
  item?: {
    name: string;
    thumbnail_url: string | null;
    rap: number | null;
  };
};

type Trade = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  sender_value: number | null;
  receiver_value: number | null;
  created_at: string;
  responded_at: string | null;
  sender?: { id: string; serial_id: number; username: string; avatar_url: string | null };
  receiver?: { id: string; serial_id: number; username: string; avatar_url: string | null };
  items?: TradeItem[];
};

type InventoryItem = {
  id: string;
  item_id: string;
  serial_number: number | null;
  is_for_sale: boolean;
  item: {
    id: string;
    name: string;
    thumbnail_url: string | null;
    is_limited: boolean;
    rap: number | null;
    limited_sold: number | null;
    limited_stock: number | null;
  };
};

export default function Trading() {
  const { isUnderMaintenance, loading: maintenanceLoading } = usePageMaintenance('trading');
  const context = useOutletContext<{ user: any; forumUser: ForumUser | null; isAdmin: boolean }>();
  const { forumUser, isAdmin } = context || {};
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'history'>('incoming');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [myItemsForTrade, setMyItemsForTrade] = useState<string[]>([]);
  const [myTradableItems, setMyTradableItems] = useState<InventoryItem[]>([]);
  
  // New trade modal
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sendingTrade, setSendingTrade] = useState(false);

  useEffect(() => {
    if (forumUser) {
      fetchTrades();
      fetchTradableItems();
      fetchFriends();
    }
  }, [forumUser, activeTab]);

  const fetchTrades = async () => {
    if (!forumUser) return;
    setLoading(true);
    
    let query = supabase
      .from('trades')
      .select(`
        *,
        sender:forum_users!trades_sender_id_fkey(id, serial_id, username, avatar_url),
        receiver:forum_users!trades_receiver_id_fkey(id, serial_id, username, avatar_url)
      `)
      .order('created_at', { ascending: false });
    
    if (activeTab === 'incoming') {
      query = query.eq('receiver_id', forumUser.id).eq('status', 'pending');
    } else if (activeTab === 'outgoing') {
      query = query.eq('sender_id', forumUser.id).eq('status', 'pending');
    } else {
      query = query.or(`sender_id.eq.${forumUser.id},receiver_id.eq.${forumUser.id}`)
        .neq('status', 'pending');
    }
    
    const { data } = await query;
    setTrades((data || []) as unknown as Trade[]);
    setLoading(false);
  };

  const fetchTradableItems = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('user_inventory')
      .select(`
        id, item_id, serial_number, is_for_sale,
        item:item_id(id, name, thumbnail_url, is_limited, rap, limited_sold, limited_stock)
      `)
      .eq('forum_user_id', forumUser.id)
      .eq('is_for_sale', false);
    
    // Filter to only sold-out limiteds
    const tradable = (data || []).filter((inv: any) => 
      inv.item?.is_limited && 
      inv.item?.limited_sold >= inv.item?.limited_stock
    );
    setMyTradableItems(tradable as InventoryItem[]);
  };

  const fetchFriends = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_friendships')
      .select(`
        id,
        user_1:user_1_id(id, serial_id, username, avatar_url),
        user_2:user_2_id(id, serial_id, username, avatar_url)
      `)
      .or(`user_1_id.eq.${forumUser.id},user_2_id.eq.${forumUser.id}`);
    
    const friendList = (data || []).map((f: any) => 
      f.user_1?.id === forumUser.id ? f.user_2 : f.user_1
    ).filter(Boolean);
    setFriends(friendList);
  };

  const fetchTradeItems = async (tradeId: string) => {
    const { data } = await supabase
      .from('trade_items')
      .select(`
        id, inventory_id, item_id, serial_number, rap_at_trade, owner_id,
        item:item_id(name, thumbnail_url, rap)
      `)
      .eq('trade_id', tradeId);
    return (data || []) as TradeItem[];
  };

  const openTradeDetail = async (trade: Trade) => {
    const items = await fetchTradeItems(trade.id);
    setSelectedTrade({ ...trade, items });
    setMyItemsForTrade([]);
    setShowTradeModal(true);
  };

  const handleAcceptTrade = async () => {
    if (!selectedTrade) return;
    setProcessing(selectedTrade.id);
    
    // Add receiver items if any selected
    if (myItemsForTrade.length > 0) {
      const { data: addResult, error: addError } = await supabase.rpc('add_receiver_items_to_trade', {
        p_trade_id: selectedTrade.id,
        p_receiver_items: myItemsForTrade
      });
      const addRes = addResult as { success?: boolean; error?: string } | null;
      if (addError || (addRes && !addRes.success)) {
        toast({ title: 'Error', description: addRes?.error || addError?.message, variant: 'destructive' });
        setProcessing(null);
        return;
      }
    }
    
    const { data, error } = await supabase.rpc('execute_trade', { p_trade_id: selectedTrade.id });
    const result = data as { success?: boolean; error?: string } | null;
    if (error || (result && !result.success)) {
      toast({ title: 'Trade Failed', description: result?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Trade Accepted!', description: 'Items have been exchanged.' });
      setShowTradeModal(false);
      fetchTrades();
      fetchTradableItems();
    }
    setProcessing(null);
  };

  const handleDeclineTrade = async () => {
    if (!selectedTrade) return;
    setProcessing(selectedTrade.id);
    const { data, error } = await supabase.rpc('decline_trade', { p_trade_id: selectedTrade.id });
    const result = data as { success?: boolean; error?: string } | null;
    if (error || (result && !result.success)) {
      toast({ title: 'Error', description: result?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Trade Declined' });
      setShowTradeModal(false);
      fetchTrades();
    }
    setProcessing(null);
  };

  const handleCancelTrade = async (tradeId: string) => {
    setProcessing(tradeId);
    const { data, error } = await supabase.rpc('cancel_trade', { p_trade_id: tradeId });
    const result = data as { success?: boolean; error?: string } | null;
    if (error || (result && !result.success)) {
      toast({ title: 'Error', description: result?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Trade Cancelled' });
      fetchTrades();
    }
    setProcessing(null);
  };

  const handleSendTrade = async () => {
    if (!selectedFriend || selectedItems.length === 0) {
      toast({ title: 'Select a friend and at least one item', variant: 'destructive' });
      return;
    }
    setSendingTrade(true);
    const { data, error } = await supabase.rpc('send_trade', {
      p_receiver_id: selectedFriend.id,
      p_sender_items: selectedItems,
      p_receiver_items: []
    });
    const result = data as { success?: boolean; error?: string; trade_id?: string } | null;
    if (error || (result && !result.success)) {
      toast({ title: 'Failed to send trade', description: result?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Trade Sent!', description: `Trade request sent to ${selectedFriend.username}` });
      setShowNewTradeModal(false);
      setSelectedFriend(null);
      setSelectedItems([]);
      fetchTrades();
    }
    setSendingTrade(false);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleMyTradeItem = (itemId: string) => {
    setMyItemsForTrade(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const filteredFriends = friends.filter(f => 
    f.username.toLowerCase().includes(friendSearch.toLowerCase())
  );

  if (maintenanceLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  }
  
  if (isUnderMaintenance && !isAdmin) {
    return <PageMaintenance pageName="Trading" />;
  }

  if (!forumUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center">
          <ArrowRightLeft className="w-16 h-16 text-[hsl(var(--bc-text-muted))] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-2">Login Required</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-4">Please log in to access trading.</p>
          <Link to="/login"><Button>Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))]">
      {/* Trade Detail Modal */}
      {showTradeModal && selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--bc-border))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Trade Details</h3>
              <button onClick={() => setShowTradeModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--bc-bg))]">×</button>
            </div>
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sender's Items */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link to={`/${selectedTrade.sender?.serial_id}/${selectedTrade.sender?.username}/profile`} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-bg))] overflow-hidden">
                        {selectedTrade.sender?.avatar_url ? (
                          <img src={selectedTrade.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">{selectedTrade.sender?.username?.[0]}</div>
                        )}
                      </div>
                      <span className="font-semibold text-[hsl(var(--bc-text))]">{selectedTrade.sender?.username}</span>
                    </Link>
                    <Badge variant="outline">Sender</Badge>
                  </div>
                  <div className="space-y-2">
                    {selectedTrade.items?.filter(i => i.owner_id === selectedTrade.sender_id).map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-[hsl(var(--bc-bg))] rounded-lg">
                        <div className="w-12 h-12 bg-[hsl(var(--bc-bg-card))] rounded flex items-center justify-center overflow-hidden">
                          {item.item?.thumbnail_url ? (
                            <img src={item.item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-6 h-6 text-[hsl(var(--bc-text-muted))]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-[hsl(var(--bc-text))]">{item.item?.name}</div>
                          <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                            Serial #{item.serial_number} • RAP: {item.rap_at_trade?.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedTrade.items?.filter(i => i.owner_id === selectedTrade.sender_id).length === 0 && (
                      <p className="text-sm text-[hsl(var(--bc-text-muted))] text-center py-4">No items offered</p>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-[hsl(var(--bc-text-muted))]">
                    Total Value: <span className="font-semibold text-[hsl(var(--bc-text))]">{selectedTrade.sender_value?.toLocaleString() || 0}</span>
                  </div>
                </div>

                {/* Receiver's Items */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link to={`/${selectedTrade.receiver?.serial_id}/${selectedTrade.receiver?.username}/profile`} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-bg))] overflow-hidden">
                        {selectedTrade.receiver?.avatar_url ? (
                          <img src={selectedTrade.receiver.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">{selectedTrade.receiver?.username?.[0]}</div>
                        )}
                      </div>
                      <span className="font-semibold text-[hsl(var(--bc-text))]">{selectedTrade.receiver?.username}</span>
                    </Link>
                    <Badge variant="outline">Receiver</Badge>
                  </div>
                  <div className="space-y-2">
                    {selectedTrade.items?.filter(i => i.owner_id === selectedTrade.receiver_id).map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-[hsl(var(--bc-bg))] rounded-lg">
                        <div className="w-12 h-12 bg-[hsl(var(--bc-bg-card))] rounded flex items-center justify-center overflow-hidden">
                          {item.item?.thumbnail_url ? (
                            <img src={item.item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-6 h-6 text-[hsl(var(--bc-text-muted))]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-[hsl(var(--bc-text))]">{item.item?.name}</div>
                          <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                            Serial #{item.serial_number} • RAP: {item.rap_at_trade?.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add items section for receiver (incoming trades) */}
                    {selectedTrade.status === 'pending' && selectedTrade.receiver_id === forumUser?.id && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Add your items (optional):</p>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {myTradableItems.map(inv => (
                            <button
                              key={inv.id}
                              onClick={() => toggleMyTradeItem(inv.id)}
                              className={`w-full flex items-center gap-3 p-2 rounded-lg border transition ${
                                myItemsForTrade.includes(inv.id)
                                  ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10'
                                  : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))]'
                              }`}
                            >
                              <div className="w-10 h-10 bg-[hsl(var(--bc-bg-card))] rounded overflow-hidden">
                                {inv.item?.thumbnail_url ? (
                                  <img src={inv.item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Box className="w-full h-full p-2 text-[hsl(var(--bc-text-muted))]" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-[hsl(var(--bc-text))]">{inv.item?.name}</div>
                                <div className="text-xs text-[hsl(var(--bc-text-muted))]">#{inv.serial_number}</div>
                              </div>
                              {myItemsForTrade.includes(inv.id) && <Check className="w-4 h-4 text-[hsl(var(--bc-primary))]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            {selectedTrade.status === 'pending' && selectedTrade.receiver_id === forumUser?.id && (
              <div className="flex justify-end gap-2 p-4 border-t border-[hsl(var(--bc-border))]">
                <Button variant="destructive" onClick={handleDeclineTrade} disabled={!!processing}>
                  {processing === selectedTrade.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                  Decline
                </Button>
                <Button onClick={handleAcceptTrade} disabled={!!processing}>
                  {processing === selectedTrade.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Accept Trade
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Trade Modal */}
      {showNewTradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--bc-border))]">
              <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">New Trade</h3>
              <button onClick={() => { setShowNewTradeModal(false); setSelectedFriend(null); setSelectedItems([]); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[hsl(var(--bc-bg))]">×</button>
            </div>
            <div className="p-4 space-y-4">
              {/* Select Friend */}
              <div>
                <label className="text-sm font-medium text-[hsl(var(--bc-text))] mb-2 block">Trade with:</label>
                {!selectedFriend ? (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
                      <Input
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        placeholder="Search friends..."
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredFriends.length === 0 ? (
                        <p className="text-sm text-[hsl(var(--bc-text-muted))] text-center py-4">No friends found. Add friends to trade!</p>
                      ) : (
                        filteredFriends.map(friend => (
                          <button
                            key={friend.id}
                            onClick={() => setSelectedFriend(friend)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--bc-bg))] transition"
                          >
                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-bg))] overflow-hidden">
                              {friend.avatar_url ? (
                                <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold">{friend.username?.[0]}</div>
                              )}
                            </div>
                            <span className="font-medium text-[hsl(var(--bc-text))]">{friend.username}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-[hsl(var(--bc-bg))] rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-bg-card))] overflow-hidden">
                      {selectedFriend.avatar_url ? (
                        <img src={selectedFriend.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold">{selectedFriend.username?.[0]}</div>
                      )}
                    </div>
                    <span className="flex-1 font-medium text-[hsl(var(--bc-text))]">{selectedFriend.username}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFriend(null)}>Change</Button>
                  </div>
                )}
              </div>

              {/* Select Items */}
              {selectedFriend && (
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--bc-text))] mb-2 block">
                    Your items to offer ({selectedItems.length} selected):
                  </label>
                  {myTradableItems.length === 0 ? (
                    <p className="text-sm text-[hsl(var(--bc-text-muted))] text-center py-4 bg-[hsl(var(--bc-bg))] rounded-lg">
                      No tradable items. Only sold-out limited items can be traded.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {myTradableItems.map(inv => (
                        <button
                          key={inv.id}
                          onClick={() => toggleItemSelection(inv.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition ${
                            selectedItems.includes(inv.id)
                              ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10'
                              : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))]'
                          }`}
                        >
                          <div className="w-12 h-12 bg-[hsl(var(--bc-bg))] rounded overflow-hidden">
                            {inv.item?.thumbnail_url ? (
                              <img src={inv.item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Box className="w-full h-full p-3 text-[hsl(var(--bc-text-muted))]" />
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="text-sm font-medium text-[hsl(var(--bc-text))] truncate">{inv.item?.name}</div>
                            <div className="text-xs text-[hsl(var(--bc-text-muted))]">#{inv.serial_number}</div>
                          </div>
                          {selectedItems.includes(inv.id) ? (
                            <Minus className="w-4 h-4 text-red-500" />
                          ) : (
                            <Plus className="w-4 h-4 text-green-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[hsl(var(--bc-border))]">
              <Button variant="outline" onClick={() => { setShowNewTradeModal(false); setSelectedFriend(null); setSelectedItems([]); }}>Cancel</Button>
              <Button onClick={handleSendTrade} disabled={sendingTrade || !selectedFriend || selectedItems.length === 0}>
                {sendingTrade ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Trade
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-primary-dark))] flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Trading</h1>
              <p className="text-[hsl(var(--bc-text-muted))]">Trade items with friends</p>
            </div>
          </div>
          <Button onClick={() => setShowNewTradeModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[hsl(var(--bc-border))] mb-6">
          {(['incoming', 'outgoing', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === tab
                  ? 'text-[hsl(var(--bc-primary))] border-[hsl(var(--bc-primary))]'
                  : 'text-[hsl(var(--bc-text-muted))] border-transparent hover:text-[hsl(var(--bc-text))]'
              }`}
            >
              {tab === 'incoming' && 'Incoming'}
              {tab === 'outgoing' && 'Outgoing'}
              {tab === 'history' && 'History'}
            </button>
          ))}
        </div>

        {/* Trade List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16">
            <ArrowRightLeft className="w-16 h-16 text-[hsl(var(--bc-text-muted))]/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[hsl(var(--bc-text))]">No trades</h3>
            <p className="text-[hsl(var(--bc-text-muted))]">
              {activeTab === 'incoming' && "You don't have any pending trade requests."}
              {activeTab === 'outgoing' && "You haven't sent any trades yet."}
              {activeTab === 'history' && "No completed or declined trades."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map(trade => {
              const otherUser = trade.sender_id === forumUser?.id ? trade.receiver : trade.sender;
              const isSender = trade.sender_id === forumUser?.id;
              
              return (
                <Card key={trade.id} className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Link to={`/${otherUser?.serial_id}/${otherUser?.username}/profile`} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[hsl(var(--bc-bg))] overflow-hidden">
                          {otherUser?.avatar_url ? (
                            <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[hsl(var(--bc-text-muted))]">
                              {otherUser?.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[hsl(var(--bc-text))]">{otherUser?.username}</span>
                          {trade.status === 'pending' && (
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {trade.status === 'completed' && (
                            <Badge variant="outline" className="text-green-500 border-green-500/50">
                              <Check className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {trade.status === 'declined' && (
                            <Badge variant="outline" className="text-red-500 border-red-500/50">
                              <X className="w-3 h-3 mr-1" />
                              Declined
                            </Badge>
                          )}
                          {trade.status === 'cancelled' && (
                            <Badge variant="outline" className="text-gray-500 border-gray-500/50">
                              Cancelled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                          {isSender ? 'You sent a trade request' : 'Sent you a trade request'}
                          {' • '}
                          {new Date(trade.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeTab === 'outgoing' && trade.status === 'pending' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancelTrade(trade.id)}
                            disabled={processing === trade.id}
                          >
                            {processing === trade.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openTradeDetail(trade)}
                        >
                          View
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
