import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Save,
  CheckCircle2,
  Globe,
  Mail,
  BookOpen,
  Lock,
  Activity,
  Database,
  Download,
  Phone,
  MapPin,
  Link,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Copy,
  Check,
  HelpCircle,
  UserCheck,
  Server,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FirebaseDiagnostic } from '../../components/admin/FirebaseDiagnostic';
import { backupService } from '../../services/backupService';
import { siteSettingsService, SiteSettings } from '../../services/siteSettingsService';
import {
  gmailAuthService,
  ADMIN_GMAIL_ACCOUNT,
  DEVELOPER_ACCOUNT,
  GCP_PROJECT_ID,
  GCP_CONSENT_URL,
  GCP_AUDIENCE_URL,
} from '../../services/gmailAuthService';

export const AdminSettingsView: React.FC = () => {
  const { user, role, isAuthor } = useAuth();

  // Stored settings from Firestore / Service
  const [currentSettings, setCurrentSettings] = useState<SiteSettings>(() =>
    siteSettingsService.getSettings()
  );

  // Form input states
  const [authorName, setAuthorName] = useState(currentSettings.authorName);
  const [siteTitle, setSiteTitle] = useState(currentSettings.siteTitle);
  const [tagline, setTagline] = useState(currentSettings.tagline);
  const [contactEmail, setContactEmail] = useState(currentSettings.contactEmail);
  const [contactPhone, setContactPhone] = useState(currentSettings.contactPhone || '');
  const [contactAddress, setContactAddress] = useState(currentSettings.contactAddress || '');
  const [websiteUrl, setWebsiteUrl] = useState(currentSettings.websiteUrl || '');
  const [amazonAuthorUrl, setAmazonAuthorUrl] = useState(currentSettings.amazonAuthorUrl || '');

  // UI status states
  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  // Gmail OAuth Integration states
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailFeedback, setGmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTesterGuide, setShowTesterGuide] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  const [oauthDiagnostic, setOauthDiagnostic] = useState<{
    isTesterError: boolean;
    message: string;
    gcpConsoleUrl?: string;
    gcpAudienceUrl?: string;
  } | null>(null);

  const gmailStatus = currentSettings.gmailIntegration?.status || 'not_connected';
  const gmailConnectedAt = currentSettings.gmailIntegration?.connectedAt;

  const handleCopy = (text: string, type: 'email' | 'project') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedProjectId(true);
      setTimeout(() => setCopiedProjectId(false), 2000);
    }
  };

  const handleConnectGmail = async () => {
    if (!isAuthor) return;
    setGmailLoading(true);
    setGmailFeedback(null);
    setOauthDiagnostic(null);
    try {
      const res = await gmailAuthService.connectGmail(isAuthor, user?.email || undefined);
      if (res.success) {
        setGmailFeedback({ type: 'success', message: 'Successfully connected administrative Gmail via Google OAuth.' });
        setOauthDiagnostic(null);
        setTimeout(() => setGmailFeedback(null), 5000);
      } else {
        setGmailFeedback({ type: 'error', message: res.error || 'Failed to connect Gmail.' });
        if (res.isTesterError) {
          setOauthDiagnostic({
            isTesterError: true,
            message: res.error || '',
            gcpConsoleUrl: res.gcpConsoleUrl,
            gcpAudienceUrl: res.gcpAudienceUrl,
          });
          setShowTesterGuide(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Gmail.';
      setGmailFeedback({ type: 'error', message: msg });
    } finally {
      setGmailLoading(false);
    }
  };

  const handleReconnectGmail = async () => {
    return handleConnectGmail();
  };

  const handleMarkConnectedManually = async () => {
    if (!isAuthor) return;
    setGmailLoading(true);
    setGmailFeedback(null);
    try {
      const res = await gmailAuthService.markConnectedManually(isAuthor, user?.email || undefined);
      if (res.success) {
        setGmailFeedback({
          type: 'success',
          message: 'Administrative Gmail connection confirmed and active.',
        });
        setOauthDiagnostic(null);
        setTimeout(() => setGmailFeedback(null), 5000);
      } else {
        setGmailFeedback({ type: 'error', message: res.error || 'Failed to update connection status.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update connection status.';
      setGmailFeedback({ type: 'error', message: msg });
    } finally {
      setGmailLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!isAuthor) return;
    if (!window.confirm('Are you sure you want to disconnect administrative Gmail authorization?')) {
      return;
    }
    setGmailLoading(true);
    setGmailFeedback(null);
    setOauthDiagnostic(null);
    try {
      const res = await gmailAuthService.disconnectGmail(isAuthor, user?.email || undefined);
      if (res.success) {
        setGmailFeedback({ type: 'success', message: 'Administrative Gmail has been disconnected.' });
        setTimeout(() => setGmailFeedback(null), 5000);
      } else {
        setGmailFeedback({ type: 'error', message: res.error || 'Failed to disconnect Gmail.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disconnect Gmail.';
      setGmailFeedback({ type: 'error', message: msg });
    } finally {
      setGmailLoading(false);
    }
  };

  // Subscribe to real-time updates from siteSettingsService
  useEffect(() => {
    const unsubscribe = siteSettingsService.subscribe((settings) => {
      setCurrentSettings(settings);
    });
    return unsubscribe;
  }, []);

  // Update form inputs when currentSettings update from Firestore (if not dirty or on initial load)
  useEffect(() => {
    setAuthorName(currentSettings.authorName);
    setSiteTitle(currentSettings.siteTitle);
    setTagline(currentSettings.tagline);
    setContactEmail(currentSettings.contactEmail);
    setContactPhone(currentSettings.contactPhone || '');
    setContactAddress(currentSettings.contactAddress || '');
    setWebsiteUrl(currentSettings.websiteUrl || '');
    setAmazonAuthorUrl(currentSettings.amazonAuthorUrl || '');
  }, [currentSettings]);

  // Track unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return (
      authorName !== currentSettings.authorName ||
      siteTitle !== currentSettings.siteTitle ||
      tagline !== currentSettings.tagline ||
      contactEmail !== currentSettings.contactEmail ||
      contactPhone !== (currentSettings.contactPhone || '') ||
      contactAddress !== (currentSettings.contactAddress || '') ||
      websiteUrl !== (currentSettings.websiteUrl || '') ||
      amazonAuthorUrl !== (currentSettings.amazonAuthorUrl || '')
    );
  }, [
    authorName,
    siteTitle,
    tagline,
    contactEmail,
    contactPhone,
    contactAddress,
    websiteUrl,
    amazonAuthorUrl,
    currentSettings,
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSavedToast(null);

    if (!isAuthor) {
      setErrorMessage('Permission denied: Only users with the Author role can modify site settings.');
      return;
    }

    if (!contactEmail.trim()) {
      setErrorMessage('Primary contact email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      setErrorMessage('Please enter a valid primary contact email address.');
      return;
    }

    setIsSaving(true);

    try {
      const updates: Partial<SiteSettings> = {
        authorName: authorName.trim(),
        siteTitle: siteTitle.trim(),
        tagline: tagline.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        contactAddress: contactAddress.trim(),
        websiteUrl: websiteUrl.trim(),
        amazonAuthorUrl: amazonAuthorUrl.trim(),
      };

      const result = await siteSettingsService.saveSettings(
        updates,
        isAuthor,
        user?.email || undefined
      );

      if (result.success && result.data) {
        setCurrentSettings(result.data);
        setSavedToast('Contact information and site settings saved successfully.');
        setTimeout(() => setSavedToast(null), 4000);
      } else {
        setErrorMessage(result.error || 'Unable to save contact information. Please try again.');
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error('[AdminSettingsView] Unexpected save error:', errObj);
      setErrorMessage(errObj.message || 'Unable to save contact information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    if (!isAuthor) return;
    setBackupLoading(true);
    try {
      await backupService.exportFullBackupJSON(role, user?.email || undefined);
      setBackupSuccess('Site backup successfully generated and downloaded as backup-[timestamp].json.');
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
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Configuration
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Author Management
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Global Site Settings & Contact Information
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Configure live contact channels, branding metadata, and author links persisted directly to Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="px-2.5 py-1 bg-amber-950/50 border border-amber-500/40 rounded text-[11px] font-cinzel text-amber-300 flex items-center gap-1.5 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Unsaved changes</span>
            </div>
          )}

          {savedToast && (
            <div className="px-3 py-1.5 bg-emerald-950/70 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{savedToast}</span>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Author / Administrator Firebase Diagnostic Area */}
      <section aria-labelledby="firebase-diagnostics-heading">
        <FirebaseDiagnostic />
      </section>

      {/* Site Backup & Data Preservation (Author Only) */}
      {isAuthor && (
        <section
          aria-labelledby="site-backup-heading"
          className="p-6 bg-[#11131c] border border-[#232635] rounded-xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3
                id="site-backup-heading"
                className="text-sm font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2"
              >
                <Database className="w-4 h-4 text-[#c5a059]" />
                <span>Site Backup & Archive Download (Author Only)</span>
              </h3>
              <p className="text-xs text-[#8e887a]">
                Generate an immediate full backup of all books, series, stories, news, newsletter subscribers, comments, and settings.
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

      {/* Administrative Gmail Configuration (Author Only) */}
      {isAuthor && (
        <section
          aria-labelledby="gmail-integration-heading"
          className="p-6 bg-[#11131c] border border-[#232635] rounded-xl space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f2231] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
                  Google Workspace
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Author Only
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  Testing Mode
                </span>
              </div>
              <h3
                id="gmail-integration-heading"
                className="text-base font-cinzel font-bold text-[#f5efeb] flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-[#c5a059]" />
                <span>Administrative Gmail & Google Cloud OAuth</span>
              </h3>
              <p className="text-xs text-[#8e887a]">
                Configure secure Google OAuth authorization for website administrative email and author correspondence.
              </p>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span
                className={`px-3 py-1 rounded-full text-xs font-cinzel font-semibold flex items-center gap-1.5 border ${
                  gmailStatus === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : gmailStatus === 'needs_renewal'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-[#181a27] text-[#8e887a] border-[#2b2e40]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    gmailStatus === 'connected'
                      ? 'bg-emerald-400'
                      : gmailStatus === 'needs_renewal'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-zinc-500'
                  }`}
                />
                <span>
                  {gmailStatus === 'connected'
                    ? 'Connected & Authorized'
                    : gmailStatus === 'needs_renewal'
                    ? 'Needs Renewal'
                    : 'Not Connected'}
                </span>
              </span>
            </div>
          </div>

          {/* Two-Account Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Developer / Project Owner Account */}
            <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-[#c5a059] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>Google AI Studio & Cloud Owner</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#181a27] text-zinc-400 border border-[#2b2e40]">
                  GCP Developer
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#f5efeb] font-semibold break-all">
                  {DEVELOPER_ACCOUNT}
                </div>
                <div className="text-[11px] text-[#8e887a]">
                  Project ID: <span className="font-mono text-[#a8a396]">{GCP_PROJECT_ID}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#6b665c] leading-relaxed">
                Manages Google AI Studio, Firebase Auth, and Google Cloud services. Project ownership remains strictly with this account.
              </p>
            </div>

            {/* Administrative Gmail Account */}
            <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-cinzel font-bold text-[#c5a059] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Administrative Gmail Account</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Target Mailbox
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#f5efeb] font-semibold flex items-center justify-between">
                  <span className="break-all">{ADMIN_GMAIL_ACCOUNT}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(ADMIN_GMAIL_ACCOUNT, 'email')}
                    className="p-1 hover:bg-[#181a27] rounded text-[#8e887a] hover:text-[#c5a059] transition-colors ml-1 cursor-pointer shrink-0"
                    title="Copy email address"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-[11px] text-[#8e887a]">
                  Status:{' '}
                  <span className={gmailStatus === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {gmailStatus === 'connected' ? 'Authorized via Google OAuth' : 'Pending Authorization'}
                  </span>
                  {gmailConnectedAt && ` (${new Date(gmailConnectedAt).toLocaleDateString()})`}
                </div>
              </div>
              <p className="text-[11px] text-[#6b665c] leading-relaxed">
                Dedicated Google account used for website correspondence, author dispatches, and reader inquiries.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            {gmailStatus === 'connected' ? (
              <>
                <button
                  type="button"
                  onClick={handleReconnectGmail}
                  disabled={gmailLoading}
                  className="px-4 py-2 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-[#c5a059] text-xs font-cinzel rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gmailLoading ? 'animate-spin' : ''}`} />
                  <span>Reconnect Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectGmail}
                  disabled={gmailLoading}
                  className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 text-xs font-cinzel rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Disconnect Gmail</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectGmail}
                disabled={gmailLoading}
                className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-[#c5a059]/15"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{gmailLoading ? 'Connecting...' : 'Authorize & Connect Gmail'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleMarkConnectedManually}
              disabled={gmailLoading}
              className="px-4 py-2 bg-[#181a27] hover:bg-[#212435] border border-[#2b2e40] text-emerald-400 text-xs font-cinzel rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              title="Confirm and retain connection status in database"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Retain Connection</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTesterGuide(!showTesterGuide)}
              className="px-4 py-2 bg-[#141622] hover:bg-[#1c1f2e] border border-[#2b2e40] text-[#c5a059] text-xs font-cinzel rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showTesterGuide ? 'Hide Test User Guide' : 'GCP Test User Setup Guide'}</span>
            </button>

            <button
              type="button"
              onClick={() => gmailAuthService.openGmail()}
              className="px-4 py-2 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-[#e5dfd3] hover:text-[#f5efeb] text-xs font-cinzel rounded-lg transition-colors cursor-pointer flex items-center gap-2 ml-auto"
              title="Open Gmail in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Open Email Client</span>
            </button>
          </div>

          {/* Feedback Banner */}
          {gmailFeedback && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 animate-in fade-in ${
                gmailFeedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}
            >
              {gmailFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="leading-relaxed">{gmailFeedback.message}</span>
            </div>
          )}

          {/* Google Cloud OAuth Testing & Test User Configuration Guide */}
          {showTesterGuide && (
            <div className="p-5 bg-[#0e1017] border border-amber-500/30 rounded-xl space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between gap-3 border-b border-[#232635] pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-cinzel font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Required Google Cloud Configuration
                    </span>
                    <span className="text-xs font-mono text-zinc-400">Error 403 / Access Denied Fix</span>
                  </div>
                  <h4 className="text-sm font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#c5a059]" />
                    <span>Authorize Administrative Gmail in Google Cloud Console</span>
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTesterGuide(false)}
                  className="p-1 text-[#8e887a] hover:text-[#f5efeb] transition-colors rounded cursor-pointer"
                  title="Close guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Explanation of Error 403 */}
              <div className="text-xs text-[#a8a396] leading-relaxed space-y-2">
                <p>
                  Because the Google Cloud & Firebase project is owned by{' '}
                  <strong className="text-[#f5efeb] font-mono">{DEVELOPER_ACCOUNT}</strong>, Google&apos;s OAuth consent screen operates in{' '}
                  <strong className="text-amber-400 font-semibold">Testing</strong> publishing status until public verification.
                </p>
                <p>
                  In Testing status, Google blocks any account not explicitly listed under{' '}
                  <strong className="text-[#f5efeb]">Test users</strong> with{' '}
                  <code className="px-1.5 py-0.5 rounded bg-[#181a27] text-rose-300 font-mono text-[11px]">
                    Error 403: access_denied (Access blocked: developer-approved testers)
                  </code>.
                  To allow <strong className="text-[#f5efeb] font-mono">{ADMIN_GMAIL_ACCOUNT}</strong> to authorize, you must add it as a Test User in Google Cloud Console.
                </p>
              </div>

              {/* 4-Step Instructions */}
              <div className="p-4 bg-[#08090e] border border-[#232635] rounded-lg space-y-3">
                <div className="text-xs font-cinzel font-semibold text-[#c5a059] uppercase tracking-wider">
                  Steps to Authorize in Google Cloud Console:
                </div>
                <ol className="text-xs text-[#d4cfc2] space-y-2.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Open the Google Cloud Console while logged into developer account:{' '}
                    <span className="font-mono text-[#f5efeb] font-semibold">{DEVELOPER_ACCOUNT}</span>.
                  </li>
                  <li>
                    Navigate to project{' '}
                    <span className="font-mono text-[#c5a059] font-semibold">{GCP_PROJECT_ID}</span> &rarr;{' '}
                    <strong>APIs & Services</strong> &rarr; <strong>OAuth consent screen</strong> (or <strong>Audience</strong>).
                  </li>
                  <li>
                    Under the <strong>Test users</strong> section, click <strong>+ ADD USERS</strong>.
                  </li>
                  <li>
                    Enter{' '}
                    <span className="font-mono text-[#f5efeb] font-semibold bg-[#181a27] px-1.5 py-0.5 rounded border border-[#2b2e40]">
                      {ADMIN_GMAIL_ACCOUNT}
                    </span>{' '}
                    and click <strong>Save</strong>.
                  </li>
                  <li>
                    Return to this page and click <strong>Authorize & Connect Gmail</strong> below (or <strong>Confirm & Retain Connection</strong>).
                  </li>
                </ol>
              </div>

              {/* Console Quick Links & Tools */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={GCP_AUDIENCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#1c1f2e] hover:bg-[#25293d] border border-[#373b50] text-[#c5a059] text-xs font-cinzel rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open GCP Test Users / Audience</span>
                </a>

                <a
                  href={GCP_CONSENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-[#e5dfd3] hover:text-[#f5efeb] text-xs font-cinzel rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#8e887a]" />
                  <span>Open OAuth Consent Screen</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(ADMIN_GMAIL_ACCOUNT, 'email')}
                  className="px-4 py-2 bg-[#12141f] hover:bg-[#1c1f2e] border border-[#2b2e40] text-[#a8a396] hover:text-[#f5efeb] text-xs font-cinzel rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied Email' : 'Copy Gmail Address'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConnectGmail}
                  disabled={gmailLoading}
                  className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase rounded-lg transition-colors flex items-center gap-2 cursor-pointer ml-auto shadow-md"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{gmailLoading ? 'Testing...' : 'Authorize Now'}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Site Settings & Contact Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: CONTACT INFORMATION */}
        <div className="p-6 bg-[#11131c] border border-[#232635] rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2231] pb-3">
            <h3 className="text-sm font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#c5a059]" />
              <span>Contact Information & Correspondence Channels</span>
            </h3>
            <span className="text-[11px] text-[#8e887a] font-mono">Firestore: siteSettings/general</span>
          </div>

          <p className="text-xs text-[#8e887a]">
            Manage the primary email and correspondence information displayed across the public Contact page and reader notifications.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel text-[#d4cfc2] font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Primary Contact Email</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@matthewemessmer.com"
                disabled={!isAuthor || isSaving}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059] disabled:opacity-60 font-mono"
              />
              <span className="text-[10px] text-[#787367]">Public correspondence email for reader and media inquiries.</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel text-[#d4cfc2] font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Contact Phone (Optional)</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                disabled={!isAuthor || isSaving}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059] disabled:opacity-60 font-mono"
              />
              <span className="text-[10px] text-[#787367]">Direct media or representation contact line.</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel text-[#d4cfc2] font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Studio & Workshop Location</span>
              </label>
              <input
                type="text"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="Texas, United States"
                disabled={!isAuthor || isSaving}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059] disabled:opacity-60"
              />
              <span className="text-[10px] text-[#787367]">Physical location referenced in correspondence and keepsake provenance.</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel text-[#d4cfc2] font-semibold flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Official Website URL</span>
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://matthewemessmer.com"
                disabled={!isAuthor || isSaving}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059] disabled:opacity-60 font-mono"
              />
              <span className="text-[10px] text-[#787367]">Canonical web domain for author identity and structured data.</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: IDENTITY & BRANDING */}
        <div className="p-6 bg-[#11131c] border border-[#232635] rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2231] pb-3">
            <h3 className="text-sm font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#c5a059]" />
              <span>Identity & Branding</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel text-[#d4cfc2]">Author Display Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                disabled={!isAuthor || isSaving}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059] disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-cinzel text-[#d4cfc2]">Global Site Meta Title</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                disabled={!isAuthor || isSaving}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059] disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-cinzel text-[#d4cfc2]">Author Philosophy Tagline</label>
              <textarea
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                disabled={!isAuthor || isSaving}
                className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059] disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: RETAIL & DISTRIBUTION LINKS */}
        <div className="p-6 bg-[#11131c] border border-[#232635] rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2231] pb-3">
            <h3 className="text-sm font-cinzel font-semibold text-[#f5efeb] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#c5a059]" />
              <span>Retail & Distribution Links</span>
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-cinzel text-[#d4cfc2]">Amazon Author Central Page</label>
            <input
              type="url"
              value={amazonAuthorUrl}
              onChange={(e) => setAmazonAuthorUrl(e.target.value)}
              disabled={!isAuthor || isSaving}
              className="w-full px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059] disabled:opacity-60 font-mono"
            />
          </div>
        </div>

        {/* SAVE ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-[#8e887a]">
            {currentSettings.updatedAt && (
              <span>Last persisted: {new Date(currentSettings.updatedAt).toLocaleString()}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-400 font-cinzel">Unsaved edits pending</span>
            )}

            <button
              type="submit"
              disabled={isSaving || !isAuthor}
              className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-[#c5a059]/15 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Site Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
