import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { UserProfile, UserRole, AccountStatus } from '../../types';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  X,
  UserCheck,
  UserX,
  Sparkles,
  Mail,
  Clock,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { user: currentAuthUser, isAuthor, sendPasswordReset } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole | 'DISABLED'>('ALL');

  // Role change modal state
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [authorConfirmationChecked, setAuthorConfirmationChecked] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Status toggle confirmation
  const [statusTargetUser, setStatusTargetUser] = useState<UserProfile | null>(null);

  // Feedback notifications
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const activeAuthorCount = users.filter((u) => u.role === 'AUTHOR' && u.status === 'active').length;

  const filteredUsers = users.filter((u) => {
    // Role filter
    if (roleFilter === 'DISABLED') {
      if (u.status !== 'suspended') return false;
    } else if (roleFilter !== 'ALL') {
      if (u.role !== roleFilter) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.displayName || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      return matchName || matchEmail;
    }

    return true;
  });

  const handleRoleChangeInitiate = (user: UserProfile, newRole: UserRole) => {
    setBannerError(null);
    if (user.role === newRole) return;

    // Self-lockout check
    if (user.role === 'AUTHOR' && newRole !== 'AUTHOR' && activeAuthorCount <= 1) {
      setBannerError(
        'You are the only Author account. Create another Author before transferring or removing your Author privileges.'
      );
      return;
    }

    setTargetUser(user);
    setPendingRole(newRole);
    setAuthorConfirmationChecked(false);
  };

  const handleConfirmRoleChange = async () => {
    if (!targetUser || !pendingRole || !currentAuthUser) return;

    if (pendingRole === 'AUTHOR' && !authorConfirmationChecked) {
      setBannerError('You must explicitly confirm promoting a user to full Author privileges.');
      return;
    }

    setIsUpdatingRole(true);
    const res = await userService.updateUserRole(targetUser.uid, pendingRole, currentAuthUser.uid);
    setIsUpdatingRole(false);

    if (res.success) {
      setBannerSuccess(`Successfully updated ${targetUser.displayName}'s role to ${pendingRole}.`);
      setTargetUser(null);
      setPendingRole(null);
      await loadUsers();
      setTimeout(() => setBannerSuccess(null), 4000);
    } else {
      setBannerError(res.error || 'Failed to update user role.');
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    if (!currentAuthUser) return;
    setBannerError(null);

    const newStatus: AccountStatus = user.status === 'active' ? 'suspended' : 'active';

    if (user.role === 'AUTHOR' && newStatus !== 'active' && activeAuthorCount <= 1) {
      setBannerError(
        'You are the only Author account. Create another Author before transferring or removing your Author privileges.'
      );
      return;
    }

    const res = await userService.updateUserStatus(user.uid, newStatus, currentAuthUser.uid);
    if (res.success) {
      setBannerSuccess(`User status changed to ${newStatus}.`);
      await loadUsers();
      setTimeout(() => setBannerSuccess(null), 4000);
    } else {
      setBannerError(res.error || 'Could not update user status.');
    }
  };

  const handleSendReset = async (email: string) => {
    const res = await sendPasswordReset(email);
    if (res.success) {
      setBannerSuccess(`Password reset email sent to ${email}.`);
      setTimeout(() => setBannerSuccess(null), 4000);
    } else {
      setBannerError(res.error || 'Could not send password reset.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212334] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Site Administration
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Author Only
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
            User Role & Access Management
          </h2>
          <p className="text-xs sm:text-sm text-[#8f897c] mt-1">
            Manage readers, editors, and author permissions across the platform with built-in self-lockout safeguards.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-[#171926] hover:bg-[#222536] border border-[#2e3146] text-[#c5a059] text-xs font-cinzel rounded-lg flex items-center gap-2 transition-colors self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Notifications */}
      {bannerSuccess && (
        <div className="p-4 bg-[#142319] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerSuccess}</span>
          </div>
          <button onClick={() => setBannerSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {bannerError && (
        <div className="p-4 bg-[#261517] border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{bannerError}</span>
          </div>
          <button onClick={() => setBannerError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#12141e] border border-[#232635] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-cinzel text-[#8f897c] uppercase">Total Users</span>
          <p className="text-2xl font-cinzel font-bold text-[#f5efeb]">{users.length}</p>
        </div>
        <div className="bg-[#12141e] border border-[#232635] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-cinzel text-[#8f897c] uppercase">Readers</span>
          <p className="text-2xl font-cinzel font-bold text-emerald-400">
            {users.filter((u) => u.role === 'READER').length}
          </p>
        </div>
        <div className="bg-[#12141e] border border-[#232635] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-cinzel text-[#8f897c] uppercase">Editors</span>
          <p className="text-2xl font-cinzel font-bold text-blue-400">
            {users.filter((u) => u.role === 'EDITOR').length}
          </p>
        </div>
        <div className="bg-[#12141e] border border-[#232635] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-cinzel text-[#8f897c] uppercase">Authors</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-cinzel font-bold text-[#c5a059]">{activeAuthorCount}</p>
            {activeAuthorCount <= 1 && (
              <span className="text-[10px] text-amber-400 font-cinzel bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                Sole Author Protected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#11131c] border border-[#232635] rounded-xl p-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d786d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by display name or email..."
            className="w-full bg-[#161825] border border-[#2a2d3e] focus:border-[#c5a059] focus:outline-none rounded-lg pl-9 pr-4 py-2 text-xs text-[#e8e2d9]"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'READER', 'EDITOR', 'AUTHOR', 'DISABLED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 text-xs font-cinzel rounded-lg transition-colors cursor-pointer ${
                roleFilter === f
                  ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                  : 'bg-[#161825] hover:bg-[#202334] text-[#a8a396] border border-[#2a2d3e]'
              }`}
            >
              {f === 'ALL' ? 'All Users' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#11131c] border border-[#232635] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#d6d0c4]">
            <thead className="bg-[#161825] border-b border-[#242738] text-[11px] font-cinzel text-[#8f897c] uppercase">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e202f]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#7d786d] font-cinzel">
                    Loading registered user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#7d786d] font-cinzel">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSoleAuthor = user.role === 'AUTHOR' && activeAuthorCount <= 1;

                  return (
                    <tr key={user.uid} className="hover:bg-[#151724] transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1f2233] border border-[#31354a] flex items-center justify-center font-cinzel font-bold text-xs text-[#c5a059] shrink-0">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-cinzel font-bold text-[#f5efeb] block">
                              {user.displayName || 'Anonymous Reader'}
                            </span>
                            <span className="text-[11px] text-[#7d786d] flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-[#5f5a4f]" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Selector */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-cinzel font-bold uppercase tracking-wider border ${
                              user.role === 'AUTHOR'
                                ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40'
                                : user.role === 'EDITOR'
                                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                                : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {user.role}
                          </span>

                          {/* Quick Role Shift Dropdown */}
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChangeInitiate(user, e.target.value as UserRole)}
                            className="bg-[#191b29] border border-[#2b2e40] text-[11px] text-[#d6d0c4] rounded px-2 py-1 focus:outline-none focus:border-[#c5a059] cursor-pointer"
                          >
                            <option value="READER">Reader</option>
                            <option value="EDITOR">Editor</option>
                            <option value="AUTHOR">Author</option>
                          </select>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-cinzel ${
                            user.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {user.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Date Joined */}
                      <td className="py-3.5 px-4 text-[#8f897c] text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSendReset(user.email)}
                            title="Send Password Reset Email"
                            className="p-1.5 bg-[#171926] hover:bg-[#202334] border border-[#2b2e40] text-[#a8a396] hover:text-[#c5a059] rounded-md transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isSoleAuthor}
                            title={
                              isSoleAuthor
                                ? 'Sole Author protected against self-lockout'
                                : user.status === 'active'
                                ? 'Disable Account'
                                : 'Enable Account'
                            }
                            className={`p-1.5 rounded-md border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              user.status === 'active'
                                ? 'bg-[#211618] hover:bg-[#2e1c1f] border-rose-500/30 text-rose-300'
                                : 'bg-[#162118] hover:bg-[#1e2e21] border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            {user.status === 'active' ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {targetUser && pendingRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#212334] pb-3">
              <div className="flex items-center gap-2 font-cinzel font-bold text-base text-[#f5efeb]">
                <ShieldAlert className="w-5 h-5 text-[#c5a059]" />
                <span>Confirm Role Change</span>
              </div>
              <button
                onClick={() => {
                  setTargetUser(null);
                  setPendingRole(null);
                }}
                className="text-[#807b70] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#ccc7bd]">
              <p>
                Are you sure you want to change <strong className="text-[#f5efeb]">{targetUser.displayName}</strong>'s role from{' '}
                <span className="text-[#c5a059] uppercase font-cinzel font-bold">{targetUser.role}</span> to{' '}
                <span className="text-emerald-400 uppercase font-cinzel font-bold">{pendingRole}</span>?
              </p>

              {pendingRole === 'AUTHOR' && (
                <div className="p-3.5 bg-[#251b14] border border-amber-500/40 rounded-xl space-y-2 text-amber-200">
                  <div className="flex items-center gap-2 font-cinzel font-bold text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>High Privilege Grant</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Authors possess complete site-management access, including user management, book deletion, site configuration, and newsletter publishing.
                  </p>
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authorConfirmationChecked}
                      onChange={(e) => setAuthorConfirmationChecked(e.target.checked)}
                      className="mt-0.5 rounded border-[#2e3146] text-[#c5a059] focus:ring-[#c5a059]"
                    />
                    <span className="text-[11px] font-semibold text-white">
                      I understand and confirm granting full Author privileges to this account.
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setTargetUser(null);
                  setPendingRole(null);
                }}
                className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRoleChange}
                disabled={isUpdatingRole || (pendingRole === 'AUTHOR' && !authorConfirmationChecked)}
                className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold tracking-wider uppercase rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isUpdatingRole ? 'Updating...' : `Confirm Change to ${pendingRole}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
