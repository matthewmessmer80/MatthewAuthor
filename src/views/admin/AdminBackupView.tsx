import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  backupService,
  SiteBackupPayload,
  SiteBackupSummary,
  RestoreProgress,
} from '../../services/backupService';
import {
  Download,
  Upload,
  Shield,
  ShieldAlert,
  Database,
  CheckCircle2,
  FileText,
  BookOpen,
  Layers,
  MessageSquare,
  Mail,
  Users,
  Compass,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  Loader2,
  X,
} from 'lucide-react';

export const AdminBackupView: React.FC = () => {
  const { user, profile, role, isAuthor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [summary, setSummary] = useState<SiteBackupSummary | null>(null);
  const [cachedPayload, setCachedPayload] = useState<SiteBackupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore states
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<any | null>(null);
  const [collectionsSummary, setCollectionsSummary] = useState<Record<string, number> | null>(null);
  const [totalRecordsToRestore, setTotalRecordsToRestore] = useState<number>(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchSummary = async () => {
    if (!isAuthor) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await backupService.generateCompleteBackup(role, user?.email || undefined);
      setCachedPayload(payload);
      setSummary(payload.metadata.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to inspect site data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [isAuthor, role, user?.email]);

  const handleDownloadFullBackup = async () => {
    if (!isAuthor) {
      setError('Only someone with an Author account can export a backup of the site.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await backupService.exportFullBackupJSON(role, user?.email || undefined);
      setDownloadSuccess('Complete site backup successfully exported and downloaded as backup-[timestamp].json.');
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating site backup.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const { parsed, totalRecords, collectionsSummary: summaryMap } =
        await backupService.parseBackupFile(file);
      setRestoreFile(file);
      setParsedBackup(parsed);
      setTotalRecordsToRestore(totalRecords);
      setCollectionsSummary(summaryMap);
      setIsConfirmModalOpen(true);
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to parse JSON backup file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmRestore = async () => {
    if (!parsedBackup) return;

    setIsConfirmModalOpen(false);
    setIsRestoring(true);
    setRestoreError(null);
    setRestoreProgress(null);

    try {
      const res = await backupService.restoreFromBackup(parsedBackup, {
        userRole: role,
        userEmail: user?.email || undefined,
        onProgress: (p) => setRestoreProgress(p),
      });

      setRestoreSuccess(
        `Restoration complete! Successfully restored ${res.totalRestored} records across ${
          Object.keys(res.collectionsSummary).length
        } collections.`
      );
      setTimeout(() => setRestoreSuccess(null), 8000);
      await fetchSummary();
    } catch (err: any) {
      console.error('Database restore error:', err);
      setRestoreError(err.message || 'Error occurred during database restore.');
    } finally {
      setIsRestoring(false);
      setRestoreProgress(null);
      setRestoreFile(null);
      setParsedBackup(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelRestore = () => {
    setIsConfirmModalOpen(false);
    setRestoreFile(null);
    setParsedBackup(null);
    setCollectionsSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportSubscribersCSV = () => {
    if (!cachedPayload?.data.subscribers) return;
    backupService.exportSubscribersCSV(cachedPayload.data.subscribers);
  };

  const handleExportBooksCSV = () => {
    if (!cachedPayload?.data.books) return;
    backupService.exportBooksCSV(cachedPayload.data.books);
  };

  // Security Gate: Non-authors are blocked
  if (!isAuthor) {
    return (
      <div className="p-8 bg-[#141014] border border-rose-900/50 rounded-2xl max-w-2xl mx-auto text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-cinzel font-bold text-[#f5efeb]">
          Author Authorization Required
        </h2>
        <p className="text-xs text-[#a8a396] leading-relaxed">
          Access to generate and download comprehensive database snapshots is strictly reserved for the <strong>Author</strong> account. Editors and Readers do not have export authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
              Site Backup & Data Preservation
            </h2>
            <span className="px-2 py-0.5 bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 rounded text-[10px] font-cinzel font-bold uppercase tracking-wider">
              Author Only
            </span>
          </div>
          <p className="text-xs text-[#8e887a] mt-1">
            Generate and download a complete archive of all website content, books, series, discussions, subscribers, and settings.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          disabled={loading}
          className="px-3 py-1.5 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-xs font-cinzel text-[#dcd7cb] rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {restoreSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{restoreSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/70 border border-rose-700/60 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {restoreError && (
        <div className="p-4 bg-rose-950/70 border border-rose-700/60 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{restoreError}</span>
          </div>
          <button
            onClick={() => setRestoreError(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Action Card: Export Backup */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-[#12141e] to-[#0c0d12] border border-[#2b2e40] rounded-2xl shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-[#c5a059]">
              <Database className="w-5 h-5" />
              <span className="text-xs font-cinzel font-bold tracking-widest uppercase">
                Emergency & Redundancy Archive
              </span>
            </div>
            <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
              Complete Author Site Snapshot (.json)
            </h3>
            <p className="text-xs text-[#a8a396] leading-relaxed">
              Queries and aggregates all primary collections (books, chapters, posts, messages, user profiles/metadata, and moderation logs) into a structured JSON payload: <code>backup-[timestamp].json</code>.
            </p>
          </div>

          <button
            onClick={handleDownloadFullBackup}
            disabled={loading}
            className="px-6 py-3.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#c5a059]/20 flex items-center justify-center gap-2.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0c0d12]" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{loading ? 'Compiling Snapshot...' : 'Export Full Backup (JSON)'}</span>
          </button>
        </div>

        {/* Quick summary strip */}
        {summary && (
          <div className="pt-4 border-t border-[#1f2231] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-2.5 bg-[#0a0b10] border border-[#1f2231] rounded-lg">
              <span className="text-[#8e887a] block text-[10px] font-cinzel uppercase">Books</span>
              <strong className="text-base font-cinzel text-[#f5efeb]">{summary.booksCount}</strong>
            </div>
            <div className="p-2.5 bg-[#0a0b10] border border-[#1f2231] rounded-lg">
              <span className="text-[#8e887a] block text-[10px] font-cinzel uppercase">Series</span>
              <strong className="text-base font-cinzel text-[#f5efeb]">{summary.seriesCount}</strong>
            </div>
            <div className="p-2.5 bg-[#0a0b10] border border-[#1f2231] rounded-lg">
              <span className="text-[#8e887a] block text-[10px] font-cinzel uppercase">Subscribers</span>
              <strong className="text-base font-cinzel text-[#f5efeb]">{summary.subscribersCount}</strong>
            </div>
            <div className="p-2.5 bg-[#0a0b10] border border-[#1f2231] rounded-lg">
              <span className="text-[#8e887a] block text-[10px] font-cinzel uppercase">Comments</span>
              <strong className="text-base font-cinzel text-[#f5efeb]">{summary.commentsCount}</strong>
            </div>
            <div className="p-2.5 bg-[#0a0b10] border border-[#1f2231] rounded-lg">
              <span className="text-[#8e887a] block text-[10px] font-cinzel uppercase">Messages</span>
              <strong className="text-base font-cinzel text-[#f5efeb]">{summary.messagesCount}</strong>
            </div>
            <div className="p-2.5 bg-[#0a0b10] border border-[#1f2231] rounded-lg">
              <span className="text-[#8e887a] block text-[10px] font-cinzel uppercase">Audit Logs</span>
              <strong className="text-base font-cinzel text-[#f5efeb]">{summary.auditLogsCount}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Restore Action Card */}
      <div className="p-6 sm:p-8 bg-[#11131c] border border-[#2b2e40] rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-sky-400">
              <Upload className="w-5 h-5" />
              <span className="text-xs font-cinzel font-bold tracking-widest uppercase">
                Admin Restore & Database Synchronization
              </span>
            </div>
            <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
              Restore Database from Backup (.json)
            </h3>
            <p className="text-xs text-[#a8a396] leading-relaxed">
              Upload a previously exported JSON backup file to restore records into their respective Firestore collections using safe batched writes. Requires confirmation before overwriting or updating existing records.
            </p>
          </div>

          <div>
            <label
              className={`px-6 py-3.5 bg-[#1b1e2c] hover:bg-[#25283c] border border-[#373a4e] text-[#f5efeb] font-cinzel font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 shrink-0 cursor-pointer ${
                isRestoring ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#c5a059]" />
              ) : (
                <Upload className="w-4 h-4 text-[#c5a059]" />
              )}
              <span>{isRestoring ? 'Restoring Database...' : 'Upload & Restore from Backup'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                disabled={isRestoring}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Real-time Restore Progress Bar */}
        {isRestoring && restoreProgress && (
          <div className="p-4 bg-[#0a0b10] border border-[#c5a059]/40 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-cinzel">
              <span className="text-[#f5efeb] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c5a059]" />
                Restoring {restoreProgress.processed} / {restoreProgress.total} records...
              </span>
              <span className="text-[#c5a059] font-mono font-bold">
                {restoreProgress.percent}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#171924] rounded-full overflow-hidden border border-[#2b2e40]">
              <div
                className="h-full bg-gradient-to-r from-[#c5a059] to-emerald-400 transition-all duration-150"
                style={{ width: `${restoreProgress.percent}%` }}
              />
            </div>
            <div className="text-[11px] text-[#8e887a] flex items-center justify-between">
              <span>Current collection: <strong className="text-[#dcd7cb] font-mono">{restoreProgress.collectionName}</strong></span>
              <span>Batched write in progress...</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#11131c] border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-cinzel font-bold text-lg text-[#f5efeb]">
                  Confirm Database Restore
                </h4>
                <p className="text-xs text-amber-200/90 leading-relaxed font-semibold">
                  Restoring from a backup will overwrite or update existing records. Are you sure you want to proceed?
                </p>
              </div>
            </div>

            {/* Breakdown of items in backup file */}
            <div className="p-4 bg-[#0a0b10] border border-[#2b2e40] rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between text-[#8e887a] pb-2 border-b border-[#1f2231]">
                <span>Selected file:</span>
                <span className="text-[#f5efeb] font-mono font-semibold">{restoreFile?.name}</span>
              </div>
              <div className="flex items-center justify-between text-[#8e887a] pb-2 border-b border-[#1f2231]">
                <span>Total records to restore:</span>
                <span className="text-[#c5a059] font-mono font-bold text-sm">{totalRecordsToRestore}</span>
              </div>

              {collectionsSummary && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] uppercase font-cinzel text-[#6e685a] block">
                    Collections detected:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(collectionsSummary).map(([col, cnt]) => (
                      <div key={col} className="flex items-center justify-between p-1.5 bg-[#141622] rounded px-2">
                        <span className="text-[#8e887a] font-mono">{col}:</span>
                        <strong className="text-[#f5efeb] font-mono">{cnt}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelRestore}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] border border-[#2b2e40] text-xs font-cinzel text-[#8e887a] hover:text-[#f5efeb] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Confirm & Restore Records</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown of What Is Included in the Backup */}
      <div className="space-y-4">
        <h3 className="text-sm font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#c5a059]" />
          <span>Collections & Data Included In Snapshot</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Books */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#c5a059]" />
                Books & Bibliographies
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.booksCount} records` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Full book metadata, excerpts, ISBNs, wood-engraved notes, publication states, and vendor links.
            </p>
          </div>

          {/* Series */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c5a059]" />
                Series & Chronologies
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.seriesCount} records` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Breathwoven Cycle, Abyssal Current, book ordering sequences, and series descriptions.
            </p>
          </div>

          {/* Stories */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#c5a059]" />
                Canon Short Stories
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.storiesCount} records` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Standalone and universe short stories, excerpts, and reading times.
            </p>
          </div>

          {/* Characters & Lore */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#c5a059]" />
                Characters & Lore
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${(summary.charactersCount || 0) + (summary.loreCount || 0)} records` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Dramatis personae, canon biographies, worldbuilding encyclopedia, locations, and magic systems.
            </p>
          </div>

          {/* Gallery */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#c5a059]" />
                Gallery & Woodcraft
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.galleryCount || 0} records` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Workshop laser engravings, book cover art, visual artifacts, and metadata descriptions.
            </p>
          </div>

          {/* News */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#c5a059]" />
                News & Dispatches
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.newsCount} records` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Public news dispatches, release schedules, cover reveal posts, and author announcements.
            </p>
          </div>

          {/* Newsletter */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#c5a059]" />
                Newsletter & Subscribers
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.subscribersCount} subscribers` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Subscriber email roster, signup timestamps, source tags, and campaign configurations.
            </p>
          </div>

          {/* Comments & Moderation */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c5a059]" />
                Discussions & Reports
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.commentsCount} comments` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Reader comments, replies, moderation flags (Approved/Pending/Removed), and report reason logs.
            </p>
          </div>

          {/* Messages */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#c5a059]" />
                Reader Inquiries
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.messagesCount} inquiries` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              All contact form messages received through /contact with timestamps, subjects, and replies.
            </p>
          </div>

          {/* Users */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c5a059]" />
                User Account Registry
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.usersCount} users` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Reader, Editor, and Author account profiles, usernames, and role records (passwords remain encrypted in Firebase Auth).
            </p>
          </div>

          {/* Audit Logs */}
          <div className="p-4 bg-[#11131c] border border-[#232635] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c5a059]" />
                Audit Trail & History
              </span>
              <span className="px-2 py-0.5 bg-[#171924] rounded text-[11px] font-mono text-[#c5a059]">
                {summary ? `${summary.auditLogsCount} logs` : '...'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e887a] leading-relaxed">
              Author and Editor modification history, cover uploads, and moderation actions.
            </p>
          </div>
        </div>
      </div>

      {/* Targeted CSV Export Tools */}
      <div className="p-6 bg-[#11131c] border border-[#232635] rounded-2xl space-y-4">
        <h3 className="text-sm font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#c5a059]" />
          <span>Export Specific Datasets (Spreadsheet Format)</span>
        </h3>
        <p className="text-xs text-[#8e887a]">
          Export specific subsets of data into CSV format for external processing in Excel, Google Sheets, or email campaign platforms.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportSubscribersCSV}
            disabled={!cachedPayload}
            className="px-4 py-2 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-xs font-cinzel text-[#dcd7cb] rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Export Subscribers (.CSV)</span>
          </button>

          <button
            onClick={handleExportBooksCSV}
            disabled={!cachedPayload}
            className="px-4 py-2 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-xs font-cinzel text-[#dcd7cb] rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Export Book Catalog (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Security & Preservation Guidelines */}
      <div className="p-5 bg-[#0a0b10] border border-[#1f2231] rounded-xl text-xs text-[#8e887a] space-y-2">
        <div className="flex items-center gap-2 font-cinzel font-semibold text-[#dcd7cb]">
          <Lock className="w-4 h-4 text-[#c5a059]" />
          <span>Author Preservation Guidelines</span>
        </div>
        <p className="leading-relaxed">
          The exported file represents a point-in-time snapshot of the entire author website and its associated Firestore database collections. Store the downloaded JSON file on an encrypted local drive or personal cold storage. Because it contains customer correspondence and subscriber emails, keep the archive confidential.
        </p>
      </div>
    </div>
  );
};
