import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';
import { ReaderMessage } from '../../types';
import {
  Mail,
  CheckCircle,
  Archive,
  Trash2,
  AlertTriangle,
  Reply,
  Clock,
  Sparkles,
  Search,
  RefreshCw,
  Send,
} from 'lucide-react';

export const AdminMessagesView: React.FC = () => {
  const { profile, user, role } = useAuth();
  const [messages, setMessages] = useState<ReaderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ReaderMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'replied' | 'archived'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const moderatorName = profile?.displayName || user?.displayName || `${role} Staff`;

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await messageService.getMessages();
      setMessages(data);
      if (selectedMessage) {
        const updated = data.find((m) => m.id === selectedMessage.id);
        if (updated) setSelectedMessage(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSelect = async (msg: ReaderMessage) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      await messageService.markAsRead(msg.id);
      await loadMessages();
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    await messageService.replyToMessage(selectedMessage.id, replyText.trim(), moderatorName);
    setReplyText('');
    setToast('Reply notes recorded & marked as replied.');
    await loadMessages();
    setTimeout(() => setToast(null), 3000);
  };

  const handleArchive = async (msgId: string) => {
    await messageService.archiveMessage(msgId);
    setToast('Message moved to archive (can be retrieved from Archived tab).');
    await loadMessages();
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteConfirm = async (msgId: string) => {
    setIsDeleting(true);
    try {
      await messageService.deleteMessage(msgId);
      setToast('Message permanently deleted from database.');
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(null);
      }
      setDeleteConfirmId(null);
      await loadMessages();
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filter === 'all') return m.status !== 'archived';
    return m.status === filter;
  });

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212334] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Correspondence
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-blue-500/10 border border-blue-500/30 text-blue-300">
              Editor & Author
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Reader Messages & Inquiries
          </h2>
          <p className="text-xs sm:text-sm text-[#8f897c] mt-1">
            View and respond to inquiries from readers, book clubs, media representatives, and commission requests.
          </p>
        </div>

        <button
          onClick={loadMessages}
          className="px-4 py-2 bg-[#171926] hover:bg-[#222536] border border-[#2e3146] text-[#c5a059] text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'unread', 'replied', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 text-xs font-cinzel rounded-lg transition-colors capitalize cursor-pointer ${
              filter === f
                ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                : 'bg-[#151725] text-[#a8a396] hover:bg-[#1d2030] border border-[#282a3d]'
            }`}
          >
            {f === 'unread' ? `Unread (${unreadCount})` : f}
          </button>
        ))}
      </div>

      {/* Two Column Layout: Inbox List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Message List */}
        <div className="lg:col-span-5 bg-[#11131c] border border-[#232635] rounded-2xl p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-16 text-xs font-cinzel text-[#7d786d]">
              No messages found in this view.
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  selectedMessage?.id === msg.id
                    ? 'bg-[#181a28] border-[#c5a059] shadow-md shadow-[#c5a059]/10'
                    : msg.status === 'unread'
                    ? 'bg-[#161825] border-blue-500/40'
                    : 'bg-[#131520] border-[#222536] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-cinzel font-bold text-[#f5efeb] truncate">
                    {msg.name}
                  </span>
                  <span className="text-[10px] text-[#706c60]">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs text-[#c5a059] font-medium truncate">
                  {msg.subject}
                </div>

                <p className="text-[11px] text-[#8f897c] line-clamp-2 leading-relaxed">
                  {msg.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="uppercase font-cinzel tracking-wider px-1.5 py-0.5 rounded bg-[#1e2132] text-[#a8a396]">
                    {msg.inquiryType}
                  </span>
                  {msg.status === 'unread' && (
                    <span className="text-blue-400 font-cinzel font-bold">● New</span>
                  )}
                  {msg.status === 'replied' && (
                    <span className="text-emerald-400 font-cinzel">✓ Replied</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Message Detail & Response */}
        <div className="lg:col-span-7 bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-8 space-y-6">
          {selectedMessage ? (
            <>
              <div className="flex items-start justify-between border-b border-[#212334] pb-4">
                <div>
                  <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
                    {selectedMessage.subject}
                  </h3>
                  <div className="text-xs text-[#8f897c] mt-1 space-x-2">
                    <span className="text-[#c5a059] font-cinzel font-medium">
                      From: {selectedMessage.name}
                    </span>
                    <span>·</span>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="hover:underline text-[#a8a396]"
                    >
                      {selectedMessage.email}
                    </a>
                    <span>·</span>
                    <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleArchive(selectedMessage.id)}
                    title="Archive message (non-destructive, recoverable)"
                    className="p-2 bg-[#161825] hover:bg-[#202334] border border-[#2b2e40] text-[#8f897c] hover:text-[#f5efeb] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-cinzel"
                  >
                    <Archive className="w-4 h-4 text-[#8f897c]" />
                    <span className="hidden sm:inline">Archive</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(selectedMessage.id)}
                    title="Permanently delete message from database"
                    className="p-2 bg-[#211618] hover:bg-[#2e1c1f] border border-rose-500/30 text-rose-300 hover:text-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-cinzel"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* Permanent Deletion Confirmation Banner */}
              {deleteConfirmId === selectedMessage.id && (
                <div className="p-4 bg-rose-950/50 border border-rose-500/60 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-cinzel font-bold text-rose-200">
                        Permanently Delete Reader Message?
                      </p>
                      <p className="text-[11px] text-rose-300/80 leading-relaxed">
                        This action is irreversible and permanently removes this inquiry from Firestore. If you wish to keep it for records, use <strong>Archive</strong> instead.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 bg-[#171926] hover:bg-[#222536] border border-[#2b2e40] text-[#a8a396] text-xs font-cinzel rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(selectedMessage.id)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-md shadow-rose-900/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="bg-[#141624] border border-[#242738] rounded-xl p-5 text-sm text-[#d6d0c4] leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              {/* Previous Reply Notes */}
              {selectedMessage.replyNotes && (
                <div className="p-4 bg-[#14201a] border border-emerald-500/30 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-emerald-300 font-cinzel">
                    <span className="font-bold">Response Note Logged:</span>
                    <span>by {selectedMessage.repliedBy || 'Author Team'}</span>
                  </div>
                  <p className="text-[#c9c4b7]">{selectedMessage.replyNotes}</p>
                </div>
              )}

              {/* Reply Section */}
              <div className="space-y-3 pt-4 border-t border-[#212334]">
                <label className="text-xs font-cinzel text-[#dcd7cb] block">
                  Author / Editor Response Note
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Write your internal resolution note or response record for ${selectedMessage.name}...`}
                  rows={3}
                  className="w-full bg-[#151724] border border-[#2b2e42] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#e8e2d9] resize-none"
                />
                <div className="flex items-center justify-between">
                  <a
                    href="https://mail.google.com/mail/?view=cm&to=breathwovenproductions@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-cinzel text-[#c5a059] hover:underline flex items-center gap-1.5 cursor-pointer"
                    title="Open Gmail for breathwovenproductions@gmail.com in a new tab"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open Email Client</span>
                  </a>

                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Save Response & Mark Replied</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-xs font-cinzel text-[#7d786d] space-y-2">
              <Mail className="w-8 h-8 text-[#4a473f] mx-auto" />
              <p>Select a message from the list to view reader correspondence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
