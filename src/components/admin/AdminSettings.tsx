import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Database,
  Lock,
  Globe,
  Check,
  RefreshCw,
  LogOut,
  Sliders,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CO_FOUNDERS_PRESET } from '../../data/authors';
import {
  DEFAULT_MEMBER_CREDENTIALS,
  MASTER_ADMIN_KEY,
  getMemberPasscode,
} from '../../services/securityService';

export const AdminSettings: React.FC = () => {
  const {
    user,
    currentAuthor,
    role,
    isCoFounder,
    allAuthors,
    switchActiveAuthor,
    changePassword,
    adminUpdateMemberPassword,
    getPasswordStatus,
    signOutUser,
  } = useAuth();

  // Change My Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityFeedback, setSecurityFeedback] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Admin member password manager
  const [targetMemberId, setTargetMemberId] = useState<string>(
    currentAuthor?.id || 'dr-chirag-patidar'
  );
  const [memberNewPassword, setMemberNewPassword] = useState('');

  const passwordStatus = currentAuthor ? getPasswordStatus(currentAuthor.id) : null;

  const handleUpdateCurrentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityFeedback(null);
    setSecurityError(null);

    if (!currentAuthor) return;

    if (!newPassword || newPassword.trim().length < 6) {
      setSecurityError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match. Please verify.');
      return;
    }

    const result = changePassword(currentPassword.trim(), newPassword.trim());
    if (result.success) {
      setSecurityFeedback(
        `Password updated successfully for ${currentAuthor.name}! Your new password is now active.`
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setSecurityError(result.message);
    }
  };

  const handleAdminUpdateMemberPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityFeedback(null);
    setSecurityError(null);

    if (!targetMemberId || !memberNewPassword.trim()) return;

    const targetAuthor = allAuthors.find((a) => a.id === targetMemberId);
    if (!targetAuthor) return;

    if (memberNewPassword.trim().length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }

    const result = adminUpdateMemberPassword(targetMemberId, memberNewPassword.trim());
    if (result.success) {
      setSecurityFeedback(
        `Password for ${targetAuthor.name} has been updated to "${memberNewPassword.trim()}".`
      );
      setMemberNewPassword('');
    } else {
      setSecurityError(result.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
          CMS & Editorial Settings
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
          Configure ThatVetGuy publishing preferences, member passcodes, and security credentials.
        </p>
      </div>

      {/* Current Session Account */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-900" />
          <span>Active Contributor Session</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center gap-3">
            <img
              src={currentAuthor?.avatarUrl}
              alt={currentAuthor?.name}
              className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
            />
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base">
                {currentAuthor?.name}
              </h4>
              <p className="text-xs text-stone-600">{currentAuthor?.professionalRole}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 uppercase tracking-wider">
                  {role}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {user?.email || `${currentAuthor?.slug}@thatvetguy.net`}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={signOutUser}
            className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Password & Zero-Trust Security Settings */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-900" />
              <span>Password & Security Management</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Secure your editorial account. You can change your password anytime with zero-trust validation.
            </p>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Zero-Trust Active
          </span>
        </div>

        {/* Current Password Status */}
        {passwordStatus && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span className="text-stone-700">
                Password Status:{' '}
                <strong className={passwordStatus.isCustom ? 'text-emerald-900' : 'text-stone-800'}>
                  {passwordStatus.isCustom ? 'Custom Password Set' : 'Default Preset Password Active'}
                </strong>
              </span>
            </div>
            {passwordStatus.lastUpdated && (
              <span className="text-[10px] text-stone-500">
                Last modified: {new Date(passwordStatus.lastUpdated).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {securityFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{securityFeedback}</span>
          </div>
        )}

        {securityError && (
          <div className="p-3 bg-red-50 border border-red-300 text-red-950 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
            <span>{securityError}</span>
          </div>
        )}

        {/* Update My Password Form */}
        <form onSubmit={handleUpdateCurrentPassword} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-stone-800 uppercase tracking-wider">
              Change My Password ({currentAuthor?.name})
            </h4>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-emerald-850 hover:text-emerald-950 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPassword ? 'Hide characters' : 'Show characters'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone-600 block">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone-600 block">
                New Password (min 6 chars)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone-600 block">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
              className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 disabled:bg-stone-300 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer min-h-[40px]"
            >
              Update Password
            </button>
          </div>
        </form>

        {/* Co-Founder Team Member Password Controls */}
        {isCoFounder && (
          <form onSubmit={handleAdminUpdateMemberPassword} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-xs text-stone-800 uppercase tracking-wider">
                Admin Member Password Manager
              </h4>
              <span className="text-[10px] text-stone-500">Co-Founder Tool</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600 block">Select Member</label>
                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                >
                  {allAuthors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name} ({author.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-stone-600 block">
                  Assign New Password (min 6 chars)
                </label>
                <input
                  type="text"
                  value={memberNewPassword}
                  onChange={(e) => setMemberNewPassword(e.target.value)}
                  placeholder="e.g. Amaan@2025"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!memberNewPassword.trim()}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-850 disabled:bg-stone-300 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer min-h-[40px]"
              >
                Set Member Password
              </button>
            </div>
          </form>
        )}

        {/* Security Overview */}
        <div className="p-3 bg-stone-100/60 rounded-xl text-[11px] text-stone-600 space-y-1 font-mono">
          <div>• Brute-Force Rate Limiter: 5 consecutive attempts → 60s temporary IP lock</div>
          <div>• Emergency Recovery Key: Protected & Enforced</div>
          <div>• Session Persistence: Isolated per browser device</div>
        </div>
      </div>

      {/* Quick Profile Switcher (For testing all 6 Co-Founders and Contributors) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-900" />
            <span>Active Contributor Switcher</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Simulate or switch between the six Co-Founders and accredited contributors to test publishing permissions and workflow views.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {allAuthors.map((author) => {
            const isSelected = currentAuthor?.id === author.id;
            return (
              <button
                key={author.id}
                type="button"
                onClick={() => switchActiveAuthor(author.id)}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all min-h-[56px] ${
                  isSelected
                    ? 'border-emerald-800 bg-emerald-50/50 ring-2 ring-emerald-800/20 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <img
                  src={author.avatarUrl}
                  alt={author.name}
                  className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-stone-900 text-xs truncate">
                      {author.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-800 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-stone-500 block truncate">
                    {author.designation}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Integrity & Team Equality Charter */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-900" />
          <span>ThatVetGuy Editorial Charter & Co-Founder Equality</span>
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          ThatVetGuy is a collective veterinary publication. There is no single Founder or Owner. The six Co-Founders are:
        </p>
        <ol className="list-decimal list-inside text-xs text-stone-800 font-medium space-y-1 pl-1">
          <li>Dr. Chirag Patidar — Digital Creator & Partnerships Lead</li>
          <li>Dr. Amaan Ahmed — Wildlife Veterinarian & Research Analyst</li>
          <li>Dr. Shivam Singh Thakur — Veterinary Content Specialist</li>
          <li>Dr. Ritesh Verma — Lead Pathologist & Clinical Director</li>
          <li>Dr. Deepesh Mathur — Large Animal Field Veterinarian</li>
          <li>Dr. Deepesh Chaware — Small Animal Surgeon & Consultant</li>
        </ol>
      </div>

      {/* Database & Infrastructure */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-900" />
          <span>Cloud Database & Security</span>
        </h3>
        <div className="text-xs text-stone-600 space-y-1">
          <p>
            <strong>Storage Provider:</strong> Google Cloud Firestore (Live Multi-Region)
          </p>
          <p>
            <strong>Security Rules:</strong> Role-based access control enforced via <code>firestore.rules</code>. Co-Founders have full write authority; Contributors have draft submission authority.
          </p>
          <p>
            <strong>Autosave:</strong> Enabled (Dual-layer LocalStorage + Background Firestore Sync)
          </p>
        </div>
      </div>
    </div>
  );
};
