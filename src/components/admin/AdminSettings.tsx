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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CO_FOUNDERS_PRESET } from '../../data/authors';

export const AdminSettings: React.FC = () => {
  const {
    user,
    currentAuthor,
    role,
    isCoFounder,
    allAuthors,
    switchActiveAuthor,
    signOutUser,
  } = useAuth();

  const [testEmail, setTestEmail] = useState(user?.email || 'chirag@thatvetguy.net');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
          CMS & Editorial Settings
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
          Configure ThatVetGuy publishing preferences, authentication, and team roles.
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
            className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
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
