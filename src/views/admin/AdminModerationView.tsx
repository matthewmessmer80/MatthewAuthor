import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { commentService } from '../../services/commentService';
import { BookComment, CommentReport, CommentStatus } from '../../types';
import {
  ShieldCheck,
  AlertTriangle,
  Flag,
  CheckCircle,
  EyeOff,
  Trash2,
  RotateCcw,
  Clock,
  MessageSquare,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';

export const AdminModerationView: React.FC = () => {
  const { profile, user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'reports' | 'all'>('pending');
  const [comments, setComments] = useState<BookComment[]>([]);
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const moderatorName = profile?.displayName || user?.displayName || `${role} Moderator`;

  const loadData = async () => {
    setLoading(true);
    try {
      const [comms, reps] = await Promise.all([
        commentService.getAllComments(),
        commentService.getAllReports(),
      ]);
      setComments(comms);
      setReports(reps);
    } catch (err) {
      console.warn('Failed to load moderation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (commentId: string, status: CommentStatus) => {
    const res = await commentService.updateCommentStatus(commentId, status, moderatorName);
    if (res.success) {
      setActionSuccess(`Comment updated to ${status}.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    const res = await commentService.resolveReport(reportId, action, moderatorName);
    if (res.success) {
      setActionSuccess(`Report marked as ${action.toLowerCase()}.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const pendingComments = comments.filter((c) => c.status === 'PENDING');
  const flaggedComments = comments.filter((c) => c.status === 'FLAGGED');
  const activeReports = reports.filter((r) => r.status === 'PENDING_REVIEW');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212334] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Community Health
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-blue-500/10 border border-blue-500/30 text-blue-300">
              Editor & Author
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Comment & Report Moderation
          </h2>
          <p className="text-xs sm:text-sm text-[#8f897c] mt-1">
            Review submitted reader thoughts, resolve flagged spam or offensive reports, and maintain reader discussion decorum.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-[#171926] hover:bg-[#222536] border border-[#2e3146] text-[#c5a059] text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#212334] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Comments ({pendingComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('flagged')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'flagged'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Flagged Comments ({flaggedComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Reader Reports ({activeReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
              : 'text-[#a8a396] hover:bg-[#161825]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>All Comments ({comments.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingComments.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-[#232635] rounded-2xl text-xs font-cinzel text-[#8f897c] space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm text-[#f5efeb]">Queue Clear</p>
              <p>No comments awaiting review.</p>
            </div>
          ) : (
            pendingComments.map((comm) => (
              <div
                key={comm.id}
                className="bg-[#12141e] border border-[#242738] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-cinzel font-bold text-[#c5a059]">
                      {comm.userName}
                    </span>
                    <span className="text-[11px] text-[#787367] ml-2">
                      on <em>{comm.bookTitle || comm.bookId}</em> · {new Date(comm.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    PENDING
                  </span>
                </div>

                <p className="text-xs text-[#d6d1c7] leading-relaxed bg-[#151724] p-3 rounded-lg border border-[#222536]">
                  "{comm.content}"
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e202f]">
                  <button
                    onClick={() => handleUpdateStatus(comm.id, 'HIDDEN')}
                    className="px-3 py-1.5 bg-[#171926] hover:bg-[#202334] text-[#a8a396] hover:text-[#f5efeb] text-xs font-cinzel rounded-md border border-[#2b2e40] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(comm.id, 'APPROVED')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-cinzel font-bold tracking-wider uppercase rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'flagged' && (
        <div className="space-y-4">
          {flaggedComments.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-[#232635] rounded-2xl text-xs font-cinzel text-[#8f897c] space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm text-[#f5efeb]">No Flagged Comments</p>
              <p>Discussion threads are clean of reported infractions.</p>
            </div>
          ) : (
            flaggedComments.map((comm) => (
              <div
                key={comm.id}
                className="bg-[#12141e] border border-rose-500/30 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-cinzel font-bold text-rose-400">
                      {comm.userName}
                    </span>
                    <span className="text-[11px] text-[#787367] ml-2">
                      on <em>{comm.bookTitle || comm.bookId}</em> · {new Date(comm.createdAt).toLocaleString()}
                    </span>
                    {comm.moderationNotes && (
                      <span className="block text-[11px] text-rose-300/80 mt-1 italic">
                        {comm.moderationNotes}
                      </span>
                    )}
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-cinzel bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    FLAGGED ({comm.reportCount || 1} Reports)
                  </span>
                </div>

                <p className="text-xs text-[#d6d1c7] leading-relaxed bg-[#151724] p-3 rounded-lg border border-[#222536]">
                  "{comm.content}"
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e202f]">
                  <button
                    onClick={() => handleUpdateStatus(comm.id, 'REMOVED')}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-cinzel rounded-md border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(comm.id, 'APPROVED')}
                    className="px-4 py-1.5 bg-[#171926] hover:bg-[#202334] text-emerald-400 border border-emerald-500/30 text-xs font-cinzel rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Dismiss Flags & Approve</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-16 bg-[#11131c] border border-[#232635] rounded-2xl text-xs font-cinzel text-[#8f897c]">
              No report logs recorded.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-[#12141e] border border-[#242738] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-cinzel font-bold text-rose-400">
                      Reason: {rep.reason}
                    </span>
                    <span className="text-[11px] text-[#8f897c] ml-2">
                      Reported by {rep.reporterEmail || 'Reader'} on {new Date(rep.createdAt).toLocaleString()}
                    </span>
                    {rep.details && (
                      <p className="text-[11px] text-[#a8a396] mt-1">
                        Note: {rep.details}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase ${
                      rep.status === 'PENDING_REVIEW'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <div className="bg-[#151724] p-3 rounded-lg border border-[#222536] text-xs text-[#c9c4b7]">
                  <span className="text-[10px] text-[#706b60] uppercase font-cinzel block mb-1">
                    Reported Comment Content:
                  </span>
                  "{rep.commentContent}"
                </div>

                {rep.status === 'PENDING_REVIEW' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e202f]">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'DISMISSED')}
                      className="px-3.5 py-1.5 bg-[#171926] hover:bg-[#202334] text-[#a8a396] text-xs font-cinzel rounded-md border border-[#2b2e40]"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => {
                        handleResolveReport(rep.id, 'RESOLVED');
                        handleUpdateStatus(rep.commentId, 'REMOVED');
                      }}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-md shadow-md"
                    >
                      Resolve & Remove Comment
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-[#11131c] border border-[#232635] rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-[#d6d0c4]">
              <thead className="bg-[#161825] border-b border-[#242738] text-[11px] font-cinzel text-[#8f897c] uppercase">
                <tr>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Book</th>
                  <th className="py-3 px-4">Content</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e202f]">
                {comments.map((comm) => (
                  <tr key={comm.id} className="hover:bg-[#151724]">
                    <td className="py-3 px-4 font-cinzel text-[#f5efeb] whitespace-nowrap">
                      {comm.userName}
                    </td>
                    <td className="py-3 px-4 text-[#c5a059] whitespace-nowrap">
                      {comm.bookTitle || comm.bookId}
                    </td>
                    <td className="py-3 px-4 text-[#a8a396] max-w-xs truncate">
                      "{comm.content}"
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-cinzel uppercase ${
                          comm.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : comm.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {comm.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <select
                        value={comm.status}
                        onChange={(e) => handleUpdateStatus(comm.id, e.target.value as CommentStatus)}
                        className="bg-[#181a28] border border-[#2b2e40] text-[11px] text-[#e8e2d9] rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="APPROVED">Approved</option>
                        <option value="PENDING">Pending</option>
                        <option value="FLAGGED">Flagged</option>
                        <option value="HIDDEN">Hidden</option>
                        <option value="REMOVED">Removed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
