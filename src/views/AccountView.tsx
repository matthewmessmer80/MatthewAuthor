import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commentService } from '../services/commentService';
import { BookComment } from '../types';
import {
  User,
  Mail,
  Shield,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Save,
  KeyRound,
  LogOut,
  Bell,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface AccountViewProps {
  onBackToSite: () => void;
  onNavigateToBook?: (bookSlug: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
];

export const AccountView: React.FC<AccountViewProps> = ({ onBackToSite, onNavigateToBook }) => {
  const { user, profile, role, updateUserProfile, sendPasswordReset, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [shortBio, setShortBio] = useState(profile?.shortBio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(!!profile?.newsletterSubscribed);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [userComments, setUserComments] = useState<BookComment[]>([]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setShortBio(profile.shortBio || '');
      setPhotoURL(profile.photoURL || '');
      setNewsletterSubscribed(!!profile.newsletterSubscribed);
    }
    if (user) {
      const comms = commentService.getUserComments(user.uid);
      setUserComments(comms);
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMessage(null);

    const res = await updateUserProfile({
      displayName: displayName.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      shortBio: shortBio.trim(),
      photoURL: photoURL.trim(),
      newsletterSubscribed,
    });

    setSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setErrorMessage(res.error || 'Could not update profile.');
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const res = await sendPasswordReset(user.email);
    if (res.success) {
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } else {
      setErrorMessage(res.error || 'Could not send reset email.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-cinzel font-bold text-[#f5efeb]">Reader Account Required</h2>
        <p className="text-sm text-[#a8a396]">
          Please sign in to view and manage your reader profile and comment history.
        </p>
        <button
          onClick={onBackToSite}
          className="px-6 py-2.5 bg-[#c5a059] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg hover:bg-[#d6b066] transition-colors"
        >
          Return to Website
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToSite}
          className="text-xs font-cinzel uppercase tracking-wider text-[#c5a059] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Author Site</span>
        </button>

        <button
          onClick={signOut}
          className="px-3.5 py-1.5 bg-[#171926] hover:bg-[#202334] border border-[#2d3044] text-[#a8a294] hover:text-[#f5efeb] text-xs font-cinzel rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#1a1d2c] border-2 border-[#c5a059]/40 flex items-center justify-center text-xl font-cinzel font-bold text-[#c5a059] shadow-xl">
              {photoURL ? (
                <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{(displayName || user.email || 'R').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#11131c]" title="Account Active" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb]">
                {displayName || 'Reader Account'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-cinzel uppercase font-bold tracking-wider border ${
                role === 'AUTHOR'
                  ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40'
                  : role === 'EDITOR'
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {role}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8f897c] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2 text-xs text-[#8f897c]">
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Account Status: Active</span>
          </div>
          <span className="text-[11px] text-[#706c62]">
            Joined {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}
      {resetSent && (
        <div className="p-4 bg-[#14202e] border border-sky-500/40 text-sky-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <Mail className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Password reset email dispatched to {user.email}. Check your inbox.</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-[#261517] border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Profile Edit Form */}
        <div className="lg:col-span-7 bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#212334] pb-4">
            <h3 className="text-lg font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
              <User className="w-4 h-4 text-[#c5a059]" />
              <span>Reader Profile Settings</span>
            </h3>
            <p className="text-xs text-[#8f897c] mt-0.5">
              Manage how your name and reader bio appear in discussion threads.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                Display Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#151724] border border-[#2c2f44] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                placeholder="e.g. Samuel Kaye"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  First Name (Optional)
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#151724] border border-[#2c2f44] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Last Name (Optional)
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#151724] border border-[#2c2f44] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="w-full bg-[#10121a] border border-[#222434] rounded-lg px-3.5 py-2.5 text-xs text-[#7d776c] cursor-not-allowed"
              />
              <span className="text-[10px] text-[#696356] mt-1 block">
                Email is tied to your Firebase Authentication credentials.
              </span>
            </div>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                Profile Image URL
              </label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-[#151724] border border-[#2c2f44] focus:border-[#c5a059] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#f5efeb]"
              />
              <div className="mt-2">
                <span className="text-[11px] text-[#787265] block mb-1.5 font-cinzel">
                  Or pick a fantasy preset avatar:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoURL(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border transition-all cursor-pointer ${
                        photoURL === url ? 'ring-2 ring-[#c5a059] border-white' : 'border-[#303348] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                Short Bio
              </label>
              <textarea
                value={shortBio}
                onChange={(e) => setShortBio(e.target.value)}
                rows={3}
                placeholder="Share your favorite fantasy tropes, reading speed, or thoughts..."
                className="w-full bg-[#151724] border border-[#2c2f44] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#f5efeb] resize-none"
              />
            </div>

            {/* Newsletter Preference */}
            <div className="pt-2 border-t border-[#1e202e]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletterSubscribed}
                  onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                  className="mt-0.5 rounded border-[#2e3146] text-[#c5a059] focus:ring-[#c5a059] bg-[#151724]"
                />
                <div>
                  <span className="text-xs font-cinzel font-semibold text-[#f5efeb] block">
                    Receive Author Newsletters & Early Previews
                  </span>
                  <span className="text-[11px] text-[#7d786d] block leading-relaxed">
                    Hear directly from Matthew E. Messmer regarding release dates, signed book drops, and lore side-stories.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-xs font-cinzel text-[#a8a396] hover:text-[#c5a059] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Password</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-all shadow-md shadow-[#c5a059]/10 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Comment History & Role Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Role & Permissions Card */}
          <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#c5a059]" />
              <span>Role & Permissions</span>
            </h3>

            <div className="space-y-2 text-xs text-[#a8a396]">
              <div className="p-3 bg-[#151725] rounded-lg border border-[#242738] space-y-1">
                <span className="font-cinzel text-[#c5a059] font-semibold block">
                  Current Role: {role}
                </span>
                <p className="text-[11px] text-[#8a8477] leading-relaxed">
                  {role === 'READER' &&
                    'You can participate in book discussions, submit comments, reply to fellow readers, and report inappropriate content.'}
                  {role === 'EDITOR' &&
                    'You have moderation privileges, reader messages access, and book catalog metadata editing abilities.'}
                  {role === 'AUTHOR' &&
                    'Complete site-wide administration access, user role management, content publishing, and newsletter management.'}
                </p>
              </div>
              <p className="text-[10px] text-[#696357] italic">
                * To protect security integrity, user roles can only be granted by the Author.
              </p>
            </div>
          </div>

          {/* Comment History Card */}
          <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3">
              <h3 className="text-sm font-cinzel font-bold text-[#f5efeb] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c5a059]" />
                <span>Your Comment History ({userComments.length})</span>
              </h3>
            </div>

            {userComments.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#7d786d] space-y-2">
                <p>You haven't posted any comments yet.</p>
                <button
                  onClick={onBackToSite}
                  className="text-[#c5a059] font-cinzel hover:underline text-[11px]"
                >
                  Explore books & join the discussion →
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {userComments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3.5 bg-[#151725] border border-[#222536] rounded-xl text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-cinzel font-semibold text-[#f5efeb] truncate">
                        {comm.bookTitle || comm.bookId}
                      </span>
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
                    </div>

                    <p className="text-[#a8a396] text-[11px] line-clamp-2 leading-relaxed">
                      "{comm.content}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#696459] pt-1">
                      <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                      {comm.bookSlug && onNavigateToBook && (
                        <button
                          onClick={() => onNavigateToBook(comm.bookSlug!)}
                          className="text-[#c5a059] hover:underline flex items-center gap-1 font-cinzel"
                        >
                          <span>View Book</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
