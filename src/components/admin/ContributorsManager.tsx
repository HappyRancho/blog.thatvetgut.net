import React, { useState, useEffect } from 'react';
import {
  Award,
  Edit2,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Plus,
  Power,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { Author, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getAllContributors,
  saveContributor,
  toggleContributorActive,
} from '../../services/contributorService';

export const ContributorsManager: React.FC = () => {
  const { currentAuthor, isCoFounder, refreshAuthorProfile } = useAuth();

  const [contributors, setContributors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states for adding/editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Partial<Author> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const list = await getAllContributors();
      setContributors(list);
    } catch (e) {
      console.error('Error fetching contributors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleOpenAdd = () => {
    setEditingAuthor({
      name: '',
      designation: 'Contributor, ThatVetGuy',
      professionalRole: 'Veterinary Contributor',
      role: 'CONTRIBUTOR',
      qualifications: 'BVSc & AH',
      bio: '',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800',
      expertise: ['Veterinary Medicine', 'Companion Animal Health'],
      clinicOrAffiliation: 'ThatVetGuy Collaborative',
      isActive: true,
      socials: {
        linkedin: '',
        instagram: '',
        twitter: '',
        website: 'https://www.thatvetguy.net',
        email: '',
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (author: Author) => {
    setEditingAuthor({ ...author });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingAuthor?.name?.trim()) {
      alert('Please enter contributor full name');
      return;
    }
    setSaving(true);
    try {
      await saveContributor(editingAuthor);
      await fetchList();
      await refreshAuthorProfile();
      setIsModalOpen(false);
      setEditingAuthor(null);
      alert('Contributor profile saved successfully!');
    } catch (err: any) {
      alert(`Error saving contributor: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (author: Author) => {
    if (author.role === 'CO_FOUNDER' && author.isActive) {
      const confirmDeact = window.confirm(
        `${author.name} is one of the six Co-Founders. Are you sure you want to deactivate this profile?`
      );
      if (!confirmDeact) return;
    }
    try {
      await toggleContributorActive(author.id, Boolean(author.isActive));
      await fetchList();
    } catch (err: any) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
            Contributors & Team Management
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Manage ThatVetGuy Co-Founders and accredited veterinary contributors without touching code.
          </p>
        </div>
        {isCoFounder && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Contributor</span>
          </button>
        )}
      </div>

      {/* Equality Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-950">
        <ShieldCheck className="w-4 h-4 text-emerald-900 shrink-0 mt-0.5" />
        <p>
          <strong>Collaborative Publishing Architecture:</strong> All six core team members are collectively designated as <strong>Co-Founder, ThatVetGuy</strong> with equal editorial and publishing authority. New team members can be designated as Contributors or Co-Founders.
        </p>
      </div>

      {/* Contributors Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-xs">Loading team profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contributors.map((author) => {
            const isSelf = currentAuthor?.id === author.id;
            const isCoFound = author.role === 'CO_FOUNDER';
            return (
              <div
                key={author.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                  author.isActive === false
                    ? 'opacity-60 border-stone-200 bg-stone-50/60'
                    : 'border-stone-200 shadow-xs hover:border-emerald-800/40'
                }`}
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={author.avatarUrl}
                      alt={author.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-serif font-bold text-stone-900 text-base leading-tight truncate">
                          {author.name}
                        </h4>
                        {isSelf && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                            You
                          </span>
                        )}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 uppercase tracking-wider">
                        {author.designation}
                      </span>
                      <p className="text-xs font-semibold text-stone-700 mt-1 truncate">
                        {author.professionalRole}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-stone-600 mb-3">
                    <p className="flex items-center gap-1.5 text-stone-700 font-medium">
                      <Award className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                      <span>{author.qualifications}</span>
                    </p>
                    <p className="text-[11px] text-stone-500 line-clamp-2 italic">
                      {author.bio || 'No biography recorded.'}
                    </p>
                  </div>

                  {/* Social icons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-stone-400">
                    {author.socials?.linkedin && <Linkedin className="w-3.5 h-3.5 text-blue-700" />}
                    {author.socials?.instagram && <Instagram className="w-3.5 h-3.5 text-pink-700" />}
                    {author.socials?.website && <Globe className="w-3.5 h-3.5 text-stone-600" />}
                    {author.socials?.email && <Mail className="w-3.5 h-3.5 text-emerald-800" />}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      author.isActive !== false ? 'text-emerald-700' : 'text-stone-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        author.isActive !== false ? 'bg-emerald-600' : 'bg-stone-300'
                      }`}
                    />
                    {author.isActive !== false ? 'Active Member' : 'Deactivated'}
                  </span>

                  {isCoFounder && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(author)}
                        className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                        title={author.isActive !== false ? 'Deactivate profile' : 'Activate profile'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(author)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl min-h-[44px] flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-900" />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && editingAuthor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                {editingAuthor.id ? 'Edit Team Member Profile' : 'Add New Contributor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 mt-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingAuthor.name || ''}
                    onChange={(e) => setEditingAuthor({ ...editingAuthor, name: e.target.value })}
                    placeholder="e.g. Dr. Shivam Singh Thakur"
                    className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={editingAuthor.role || 'CONTRIBUTOR'}
                    onChange={(e) =>
                      setEditingAuthor({ ...editingAuthor, role: e.target.value as UserRole })
                    }
                    className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800 bg-white"
                  >
                    <option value="CO_FOUNDER">CO_FOUNDER (Full Equal Authority)</option>
                    <option value="CONTRIBUTOR">CONTRIBUTOR (Requires Review)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editingAuthor.designation || ''}
                    onChange={(e) =>
                      setEditingAuthor({ ...editingAuthor, designation: e.target.value })
                    }
                    placeholder="Co-Founder, ThatVetGuy"
                    className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Professional Role
                  </label>
                  <input
                    type="text"
                    value={editingAuthor.professionalRole || ''}
                    onChange={(e) =>
                      setEditingAuthor({ ...editingAuthor, professionalRole: e.target.value })
                    }
                    placeholder="e.g. Lead Pathologist & Clinical Director"
                    className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={editingAuthor.qualifications || ''}
                    onChange={(e) =>
                      setEditingAuthor({ ...editingAuthor, qualifications: e.target.value })
                    }
                    placeholder="BVSc & AH"
                    className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingAuthor.socials?.email || ''}
                    onChange={(e) =>
                      setEditingAuthor({
                        ...editingAuthor,
                        socials: { ...editingAuthor.socials, email: e.target.value },
                      })
                    }
                    placeholder="doctor@thatvetguy.net"
                    className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={editingAuthor.avatarUrl || ''}
                  onChange={(e) =>
                    setEditingAuthor({ ...editingAuthor, avatarUrl: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Biography
                </label>
                <textarea
                  rows={3}
                  value={editingAuthor.bio || ''}
                  onChange={(e) => setEditingAuthor({ ...editingAuthor, bio: e.target.value })}
                  placeholder="Describe clinical background, focus areas, and role at ThatVetGuy..."
                  className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2 outline-hidden focus:border-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Areas of Expertise (Comma-separated)
                </label>
                <input
                  type="text"
                  value={editingAuthor.expertise ? editingAuthor.expertise.join(', ') : ''}
                  onChange={(e) =>
                    setEditingAuthor({
                      ...editingAuthor,
                      expertise: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Preventive Medicine, Clinical Diagnostics, Animal Nutrition"
                  className="w-full text-xs sm:text-sm border border-stone-300 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={editingAuthor.socials?.linkedin || ''}
                    onChange={(e) =>
                      setEditingAuthor({
                        ...editingAuthor,
                        socials: { ...editingAuthor.socials, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/in/..."
                    className="w-full text-xs border border-stone-300 rounded-xl px-2.5 py-2 min-h-[44px] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={editingAuthor.socials?.instagram || ''}
                    onChange={(e) =>
                      setEditingAuthor({
                        ...editingAuthor,
                        socials: { ...editingAuthor.socials, instagram: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/..."
                    className="w-full text-xs border border-stone-300 rounded-xl px-2.5 py-2 min-h-[44px] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editingAuthor.socials?.website || ''}
                    onChange={(e) =>
                      setEditingAuthor({
                        ...editingAuthor,
                        socials: { ...editingAuthor.socials, website: e.target.value },
                      })
                    }
                    placeholder="https://thatvetguy.net"
                    className="w-full text-xs border border-stone-300 rounded-xl px-2.5 py-2 min-h-[44px] outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 rounded-xl min-h-[44px] shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Contributor Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
