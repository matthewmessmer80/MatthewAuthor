import React, { useState } from 'react';
import { Shield, Save, CheckCircle2, Globe, Mail, BookOpen, Lock, Activity, Database, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FirebaseDiagnostic } from '../../components/admin/FirebaseDiagnostic';
import { backupService } from '../../services/backupService';

export const AdminSettingsView: React.FC = () => {
  const { user, role, isAuthor } = useAuth();
  const [authorName, setAuthorName] = useState('Matthew E. Messmer');
  const [siteTitle, setSiteTitle] = useState('Matthew E. Messmer | Author | Stories Woven Through Time');
  const [tagline, setTagline] = useState('Fantasy author crafting intricate worlds woven through honor, family, and metaphysical threads.');
  const [contactEmail, setContactEmail] = useState('contact@matthewemessmer.com');
  const [amazonAuthorUrl, setAmazonAuthorUrl] = useState('https://www.amazon.com/author/matthewemessmer');
  const [savedToast, setSavedToast] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleDownloadBackup = async () => {
    if (!isAuthor) return;
    setBackupLoading(true);
    try {
      const payload = await backupService.generateCompleteBackup(role, user?.email || undefined);
      backupService.triggerFileDownload(payload);
      setBackupSuccess('Site backup successfully generated and downloaded.');
      setTimeout(() => setBackupSuccess(null), 4000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to generate backup.';
      alert(msg);
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Global Site Settings & Authentication Diagnostics
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Configure site-wide branding, author profiles, and verify Firebase Authentication and database configuration.
          </p>
        </div>

        {savedToast && (
          <div className="px-3 py-1.5 bg-emerald-950/70 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Author / Administrator Firebase Diagnostic Area */}
      <section aria-labelledby="firebase-diagnostics-heading">
        <FirebaseDiagnostic />
      </section>

      {/* Site Backup & Data Preservation (Author Only) */}
      {isAuthor && (
        <section aria-labelledby="site-backup-heading" className="p-6 bg-[#11131c] border border-[#232635] rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 id="site-backup-heading" className="text-sm font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#c5a059]" />
                <span>Site Backup & Archive Download (Author Only)</span>
              </h3>
              <p className="text-xs text-[#8e887a]">
                Generate an immediate full backup of all books, series, stories, news, newsletter subscribers, comments, and settings "just in case".
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{backupLoading ? 'Generating...' : 'Download Site Backup (.json)'}</span>
            </button>
          </div>

          {backupSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{backupSuccess}</span>
            </div>
          )}
        </section>
      )}

      {/* Site Identity & Distribution Settings */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 bg-[#11131c] border border-[#232635] rounded-xl space-y-4">
          <h3 className="text-sm font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#c5a059]" />
            <span>Identity & Branding</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-cinzel text-[#d4cfc2]">Author Display Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-cinzel text-[#d4cfc2]">Primary Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-cinzel text-[#d4cfc2]">Global Site Meta Title</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-cinzel text-[#d4cfc2]">Author Philosophy Tagline</label>
              <textarea
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#11131c] border border-[#232635] rounded-xl space-y-4">
          <h3 className="text-sm font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#c5a059]" />
            <span>Retail & Distribution Links</span>
          </h3>

          <div className="space-y-1">
            <label className="block text-xs font-cinzel text-[#d4cfc2]">Amazon Author Central Page</label>
            <input
              type="url"
              value={amazonAuthorUrl}
              onChange={(e) => setAmazonAuthorUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5a059]/15"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Site Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
