import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, User, ArrowLeft, Lock, Loader2, Shield } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import VerifiedBadge from '@/components/forum/VerifiedBadge';
import { 
  encryptMessage, 
  decryptMessage, 
  isValidPin, 
  hashPin,
  generateConversationKey,
  encryptConversationKey,
  decryptConversationKey
} from '@/lib/encryption';

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  last_message_preview: string;
  encryption_key_p1: string | null;
  encryption_key_p2: string | null;
  key_iv: string | null;
  other_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  unread_count?: number;
  decryptedKey?: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  encrypted_content: string;
  iv: string;
  is_read: boolean;
  created_at: string;
  decrypted_content?: string;
  sender?: {
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

export default function ForumMessages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, forumUser } = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
  }>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [pin, setPin] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [newConvoUsername, setNewConvoUsername] = useState('');
  const [startingConvo, setStartingConvo] = useState(false);
  
  // PIN setup states
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [settingUpPin, setSettingUpPin] = useState(false);

  // Check if we should start a new conversation
  const targetUser = searchParams.get('to');

  useEffect(() => {
    if (!user || !forumUser) {
      navigate('/forum/login');
      return;
    }

    // Check if user has set up encryption PIN
    if (forumUser.dm_encryption_pin_hash) {
      setPinUnlocked(false);
      setNeedsPinSetup(false);
    } else {
      // Show PIN setup screen
      setNeedsPinSetup(true);
    }

    if (targetUser) {
      setNewConvoUsername(targetUser);
    }
  }, [user, forumUser, targetUser, navigate]);

  useEffect(() => {
    if (pinUnlocked && forumUser) {
      fetchConversations();
    }
  }, [pinUnlocked, forumUser]);

  useEffect(() => {
    if (selectedConversation && pinUnlocked) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, pinUnlocked]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSetupPin = async () => {
    if (!forumUser) return;
    
    if (!isValidPin(newPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmNewPin) {
      toast.error('PINs do not match');
      return;
    }

    setSettingUpPin(true);
    const hashedPin = await hashPin(newPin);

    const { error } = await supabase
      .from('forum_users')
      .update({ dm_encryption_pin_hash: hashedPin })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to set PIN');
    } else {
      toast.success('Encryption PIN set!');
      setStoredPin(newPin);
      setPinUnlocked(true);
      setNeedsPinSetup(false);
    }
    setSettingUpPin(false);
  };

  const fetchConversations = async () => {
    if (!forumUser) return;
    setLoading(true);

    const { data } = await supabase
      .from('forum_conversations')
      .select('*')
      .or(`participant_1.eq.${forumUser.id},participant_2.eq.${forumUser.id}`)
      .order('last_message_at', { ascending: false });

    if (data) {
      // Fetch other user info for each conversation
      const convosWithUsers = await Promise.all(
        data.map(async (convo) => {
          const otherId = convo.participant_1 === forumUser.id ? convo.participant_2 : convo.participant_1;
          const { data: otherUser } = await supabase
            .from('forum_users')
            .select('id, username, avatar_url, is_verified')
            .eq('id', otherId)
            .single();

          // Count unread messages
          const { count } = await supabase
            .from('forum_direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', forumUser.id)
            .eq('sender_id', otherId)
            .eq('is_read', false);

          // Try to decrypt the conversation key
          let decryptedKey: string | undefined;
          if (storedPin && convo.key_iv) {
            const encryptedKey = convo.participant_1 === forumUser.id 
              ? convo.encryption_key_p1 
              : convo.encryption_key_p2;
            
            if (encryptedKey) {
              try {
                decryptedKey = await decryptConversationKey(encryptedKey, convo.key_iv, storedPin);
              } catch {
                // Key decryption failed - might be old format
              }
            }
          }

          return {
            ...convo,
            other_user: otherUser,
            unread_count: count || 0,
            decryptedKey
          };
        })
      );
      setConversations(convosWithUsers as Conversation[]);
    }
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    if (!forumUser || !storedPin) return;
    setLoadingMessages(true);

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const otherId = conversation.participant_1 === forumUser.id 
      ? conversation.participant_2 
      : conversation.participant_1;

    const { data } = await supabase
      .from('forum_direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${forumUser.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${forumUser.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      // Fetch sender info and decrypt messages
      const decrypted = await Promise.all(
        data.map(async (msg) => {
          const { data: senderData } = await supabase
            .from('forum_users')
            .select('username, avatar_url, is_verified')
            .eq('id', msg.sender_id)
            .single();

          try {
            // Use conversation key for decryption
            if (conversation.decryptedKey) {
              const content = await decryptMessage(msg.encrypted_content, msg.iv, conversation.decryptedKey);
              return { ...msg, decrypted_content: content, sender: senderData };
            }
            // Fallback: try with PIN (for backwards compatibility)
            const content = await decryptMessage(msg.encrypted_content, msg.iv, storedPin);
            return { ...msg, decrypted_content: content, sender: senderData };
          } catch {
            return { ...msg, decrypted_content: '[Unable to decrypt]', sender: senderData };
          }
        })
      );
      setMessages(decrypted as Message[]);
      
      // Mark as read
      await supabase
        .from('forum_direct_messages')
        .update({ is_read: true })
        .eq('recipient_id', forumUser.id)
        .eq('sender_id', otherId);
    }
    setLoadingMessages(false);
  };

  const handleUnlock = async () => {
    if (!isValidPin(pin)) {
      toast.error('PIN must be 4 digits');
      return;
    }

    const hash = await hashPin(pin);
    
    if (hash === forumUser?.dm_encryption_pin_hash) {
      setStoredPin(pin);
      setPinUnlocked(true);
      toast.success('Inbox unlocked');
    } else {
      toast.error('Incorrect PIN');
    }
  };

  const handleStartConversation = async () => {
    if (!forumUser || !storedPin || !newConvoUsername.trim()) return;
    setStartingConvo(true);

    // Find user
    const { data: targetUserData } = await supabase
      .from('forum_users')
      .select('id, username, allow_dms, dm_encryption_pin_hash')
      .eq('username', newConvoUsername.trim())
      .single();

    if (!targetUserData) {
      toast.error('User not found');
      setStartingConvo(false);
      return;
    }

    if (!targetUserData.allow_dms) {
      toast.error('This user has disabled direct messages');
      setStartingConvo(false);
      return;
    }

    if (!targetUserData.dm_encryption_pin_hash) {
      toast.error('This user has not set up encrypted messaging yet');
      setStartingConvo(false);
      return;
    }

    // Check if conversation exists
    const { data: existing } = await supabase
      .from('forum_conversations')
      .select('id')
      .or(
        `and(participant_1.eq.${forumUser.id},participant_2.eq.${targetUserData.id}),` +
        `and(participant_1.eq.${targetUserData.id},participant_2.eq.${forumUser.id})`
      )
      .single();

    if (existing) {
      setSelectedConversation(existing.id);
      setNewConvoUsername('');
      setStartingConvo(false);
      await fetchConversations();
      return;
    }

    // Generate a new conversation key
    const conversationKey = generateConversationKey();
    
    // Encrypt the key for the initiating user (we can't encrypt for recipient without their PIN)
    // The recipient will set up their key when they first view the conversation
    const { encrypted: encryptedKeyP1, iv: keyIv } = await encryptConversationKey(conversationKey, storedPin);

    // Create conversation with just our encrypted key
    const { data: newConvo, error } = await supabase
      .from('forum_conversations')
      .insert({
        participant_1: forumUser.id,
        participant_2: targetUserData.id,
        encryption_key_p1: encryptedKeyP1,
        key_iv: keyIv
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start conversation');
    } else if (newConvo) {
      await fetchConversations();
      setSelectedConversation(newConvo.id);
      setNewConvoUsername('');
    }
    setStartingConvo(false);
  };

  const handleSend = async () => {
    if (!forumUser || !storedPin || !newMessage.trim() || !selectedConversation) return;
    setSending(true);

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    const recipientId = conversation.participant_1 === forumUser.id 
      ? conversation.participant_2 
      : conversation.participant_1;

    try {
      // Get or create conversation key
      let conversationKey = conversation.decryptedKey;
      
      if (!conversationKey) {
        // This is the recipient's first message - need to set up their key
        // Try to get the key from the initiator's side
        const isP1 = conversation.participant_1 === forumUser.id;
        const existingEncryptedKey = isP1 ? conversation.encryption_key_p1 : conversation.encryption_key_p2;
        
        if (existingEncryptedKey && conversation.key_iv) {
          // Try to decrypt with our PIN
          try {
            conversationKey = await decryptConversationKey(existingEncryptedKey, conversation.key_iv, storedPin);
          } catch {
            // Failed - might need to create new key exchange
          }
        }
        
        if (!conversationKey) {
          // We're the recipient and need to get the conversation key from the initiator
          // For now, generate a new key and encrypt for ourselves
          conversationKey = generateConversationKey();
          const { encrypted } = await encryptConversationKey(conversationKey, storedPin);
          
          // Update our encrypted key in the conversation
          const updateField = isP1 ? 'encryption_key_p1' : 'encryption_key_p2';
          await supabase
            .from('forum_conversations')
            .update({ [updateField]: encrypted })
            .eq('id', conversation.id);
          
          // Update local state
          conversation.decryptedKey = conversationKey;
        }
      }

      const { encrypted, iv } = await encryptMessage(newMessage.trim(), conversationKey);

      const { error } = await supabase
        .from('forum_direct_messages')
        .insert({
          sender_id: forumUser.id,
          recipient_id: recipientId,
          encrypted_content: encrypted,
          iv: iv
        });

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('forum_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: '[Encrypted message]'
        })
        .eq('id', selectedConversation);

      setNewMessage('');
      fetchMessages(selectedConversation);
      fetchConversations();
    } catch (err) {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  if (!user || !forumUser) {
    return null;
  }

  // PIN setup screen for new users
  if (needsPinSetup) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-[hsl(var(--bc-primary))] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Set Up Encrypted Messaging</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-6">
            To send and receive direct messages, you need to create a 4-digit PIN. 
            This PIN encrypts your messages end-to-end so only you and the recipient can read them.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[hsl(var(--bc-text-muted))] block mb-2">Create PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-32 text-center text-2xl tracking-widest bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] mx-auto block"
                placeholder="••••"
              />
            </div>
            
            <div>
              <label className="text-sm text-[hsl(var(--bc-text-muted))] block mb-2">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-32 text-center text-2xl tracking-widest bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] mx-auto block"
                placeholder="••••"
              />
            </div>
          </div>
          
          <button
            onClick={handleSetupPin}
            disabled={newPin.length !== 4 || confirmNewPin.length !== 4 || settingUpPin}
            className="mt-6 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-6 py-2 rounded-lg transition flex items-center gap-2 mx-auto"
          >
            {settingUpPin ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Enable Encrypted Messaging
              </>
            )}
          </button>
          
          <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-4">
            Remember this PIN! You'll need it each time you access your messages.
          </p>
        </div>
      </div>
    );
  }

  // PIN unlock screen
  if (!pinUnlocked) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <Lock className="w-16 h-16 text-[hsl(var(--bc-primary))] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Unlock Messages</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mb-6">
            Enter your 4-digit PIN to decrypt your messages
          </p>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-32 text-center text-2xl tracking-widest bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] mx-auto block mb-4"
            placeholder="••••"
          />
          <button
            onClick={handleUnlock}
            disabled={pin.length !== 4}
            className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-6 py-2 rounded-lg transition"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Conversations List */}
      <div className="w-80 flex-shrink-0 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl flex flex-col">
        <div className="p-4 border-b border-[hsl(var(--bc-border))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Messages
          </h2>
        </div>

        {/* New Conversation */}
        <div className="p-3 border-b border-[hsl(var(--bc-border))]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newConvoUsername}
              onChange={(e) => setNewConvoUsername(e.target.value)}
              placeholder="Start chat with..."
              className="flex-1 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))]"
            />
            <button
              onClick={handleStartConversation}
              disabled={!newConvoUsername.trim() || startingConvo}
              className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-3 py-2 rounded-lg transition"
            >
              {startingConvo ? <Loader2 className="w-4 h-4 animate-spin" /> : '+'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 text-[hsl(var(--bc-text-muted))] animate-spin mx-auto" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-[hsl(var(--bc-text-muted))]">
              No conversations yet
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConversation(convo.id)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-[hsl(var(--bc-bg-light))] transition text-left ${
                  selectedConversation === convo.id ? 'bg-[hsl(var(--bc-bg-light))]' : ''
                }`}
              >
                {convo.other_user?.avatar_url ? (
                  <img src={convo.other_user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[hsl(var(--bc-text))] truncate">
                      {convo.other_user?.username || 'Unknown'}
                    </span>
                    {convo.other_user?.is_verified && (
                      <VerifiedBadge size="md" />
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--bc-text-muted))] truncate">
                    {convo.last_message_preview || 'No messages'}
                  </p>
                </div>
                {(convo.unread_count || 0) > 0 && (
                  <span className="bg-[hsl(var(--bc-primary))] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {convo.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {(() => {
                const convo = conversations.find(c => c.id === selectedConversation);
                if (!convo?.other_user) return null;
                return (
                  <>
                    {convo.other_user.avatar_url ? (
                      <img src={convo.other_user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Link 
                        to={`/forum/user/${convo.other_user.username}`}
                        className="font-medium text-[hsl(var(--bc-text))] hover:underline"
                      >
                        {convo.other_user.username}
                      </Link>
                      {convo.other_user.is_verified && (
                        <VerifiedBadge size="md" />
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-green-600">
                      <Lock className="w-3 h-3" />
                      End-to-end encrypted
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-[hsl(var(--bc-text-muted))] animate-spin mx-auto" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--bc-text-muted))]">
                  No messages yet. Send one to start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === forumUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
                        isOwn 
                          ? 'bg-[hsl(var(--bc-primary))] text-white' 
                          : 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))]'
                      }`}>
                        {!isOwn && msg.sender && (
                          <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                            {msg.sender.username}
                            {msg.sender.is_verified && <VerifiedBadge size="sm" />}
                          </div>
                        )}
                        <p className="break-words">{msg.decrypted_content}</p>
                        <div className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-[hsl(var(--bc-text-muted))]'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[hsl(var(--bc-border))]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-2 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))]"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[hsl(var(--bc-text-muted))]">
            Select a conversation or start a new one
          </div>
        )}
      </div>
    </div>
  );
}