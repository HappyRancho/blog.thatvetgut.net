import React from 'react';
import { Database, Globe, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSettings: React.FC = () => {
  const { user, currentAuthor, role, signOutUser } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-stone-200">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">CMS & Editorial Settings</h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-0.5">Review your authenticated session and CMS security configuration.</p>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2"><User className="w-4 h-4 text-emerald-900" />Active Contributor Session</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center gap-3">
            <img src={currentAuthor?.avatarUrl} alt={currentAuthor?.name} className="w-14 h-14 rounded-2xl object-cover border border-stone-200" />
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base">{currentAuthor?.name}</h4>
              <p className="text-xs text-stone-600">{currentAuthor?.professionalRole}</p>
              <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 uppercase tracking-wider">{role}</span><span className="text-xs text-stone-400 font-mono">{user?.email}</span></div>
            </div>
          </div>
          <button type="button" onClick={signOutUser} className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors cursor-pointer"><LogOut className="w-3.5 h-3.5" />Sign Out</button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-900" />Authentication Security</h3>
        <p className="text-sm text-stone-700">CMS access is protected by Firebase Google Sign-In and an explicit editorial roster. Passwords, recovery keys, and local browser sessions are not used for CMS authentication.</p>
        <p className="text-xs text-stone-500">To update an account or its access, update the Firebase Authentication user and the approved editorial roster together.</p>
      </section>

      <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2"><Database className="w-4 h-4 text-emerald-900" />Cloud Database & Security</h3>
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-2"><p><strong>Security Rules:</strong> Firestore permissions validate authenticated, allowlisted editorial identities before allowing CMS changes.</p><p><strong>Profile records:</strong> Login activity is stored under the Firebase Authentication UID, keeping identity and database access aligned.</p></div>
        <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 hover:text-emerald-950"><Globe className="w-4 h-4" />View public website</a>
      </section>
    </div>
  );
};
