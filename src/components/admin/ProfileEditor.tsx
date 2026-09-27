import React, { useState } from 'react';
import {
  User,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Linkedin,
  Instagram,
  Mail,
  Globe,
  Award,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { uploadImageFile } from '../../services/imageService';
import { Author } from '../../types';

export const ProfileEditor: React.FC = () => {
  const { currentAuthor, updateCurrentAuthorProfile } = useAuth();
  const { navigateTo } = useNavigation();

  if (!currentAuthor) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please sign in to edit your profile.
      </div>
    );
  }

  const [name, setName] = useState(currentAuthor.name || '');
  const [professionalRole, setProfessionalRole] = useState(currentAuthor.professionalRole || '');
  const [qualifications, setQualifications] = useState(currentAuthor.qualifications || 'BVSc & AH');
  const [clinicOrAffiliation, setClinicOrAffiliation] = useState(
    currentAuthor.clinicOrAffiliation || 'ThatVetGuy Veterinary Collaborative'
  );
  const [bio, setBio] = useState(currentAuthor.bio || '');
  const [fullBio, setFullBio] = useState(currentAuthor.fullBio || currentAuthor.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentAuthor.avatarUrl || '');
  const [expertiseInput, setExpertiseInput] = useState(
    (currentAuthor.expertise || []).join(', ')
  );
  const [linkedin, setLinkedin] = useState(currentAuthor.socials?.linkedin || '');
  const [instagram, setInstagram] = useState(currentAuthor.socials?.instagram || '');
  const [email, setEmail] = useState(currentAuthor.socials?.email || '');
  const [website, setWebsite] = useState(currentAuthor.socials?.website || 'https://www.thatvetguy.net');

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsUploadingPhoto(true);
    try {
      const res = await uploadImageFile(file, {
        folder: 'authors',
        id: currentAuthor.id,
        maxWidth: 800,
        maxHeight: 800,
      });
      setAvatarUrl(res.url);
      setSuccessMessage('Photo uploaded successfully! Remember to click "Save Changes".');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Display Name is required.');
      return;
    }

    const expertiseList = expertiseInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      const updates: Partial<Author> = {
        name: name.trim(),
        professionalRole: professionalRole.trim(),
        qualifications: qualifications.trim(),
        clinicOrAffiliation: clinicOrAffiliation.trim(),
        bio: bio.trim(),
        fullBio: fullBio.trim(),
        avatarUrl: avatarUrl.trim(),
        expertise: expertiseList,
        socials: {
          linkedin: linkedin.trim(),
          instagram: instagram.trim(),
          email: email.trim(),
          website: website.trim(),
        },
      };

      await updateCurrentAuthorProfile(updates);
      setSuccessMessage('Your profile has been saved successfully! It is now live on your author page and article bylines.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif font-bold text-2xl text-stone-900">
            Edit My Profile
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Updating the profile for <strong className="text-stone-800">{currentAuthor.name}</strong> (Co-Founder).
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo({ name: 'author', slug: currentAuthor.slug })}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors shrink-0"
        >
          <span>View Public Profile</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Photo Upload Section */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-800" />
            Profile Photo
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
                alt={name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-900/20 shadow-xs"
              />
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 w-full text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="cursor-pointer px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Upload New Photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingPhoto}
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
              <p className="text-[11px] text-stone-500">
                Recommended: Square image (JPG, PNG, or WebP). Maximum 10MB.
              </p>
              <div className="pt-1">
                <input
                  type="url"
                  placeholder="Or enter image URL directly"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Identity & Credentials */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-800" />
            Identity & Credentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Amaan Ahmed"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Qualifications
              </label>
              <input
                type="text"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. BVSc & AH"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Professional Role / Specialization
              </label>
              <input
                type="text"
                value={professionalRole}
                onChange={(e) => setProfessionalRole(e.target.value)}
                placeholder="e.g. Wildlife Veterinarian & Research Analyst"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Clinic or Affiliation
              </label>
              <input
                type="text"
                value={clinicOrAffiliation}
                onChange={(e) => setClinicOrAffiliation(e.target.value)}
                placeholder="e.g. ThatVetGuy Veterinary Collaborative"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Biographies */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-emerald-800" />
            Biographical Information
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Short Bio (Appears on article byline card & previews)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A concise 2-3 sentence overview of your background and passion..."
                className="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Full Clinical Bio (Appears on your dedicated public author page)
              </label>
              <textarea
                rows={6}
                value={fullBio}
                onChange={(e) => setFullBio(e.target.value)}
                placeholder="Full clinical background, education, research interests, and expertise..."
                className="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Clinical Focus & Areas of Expertise (Comma-separated)
              </label>
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                placeholder="e.g. Wildlife Medicine, Zoonoses, Clinical Diagnostics, Preventive Care"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Social & Contact Links */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-emerald-800" />
            Social Profiles & Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />
                Instagram URL
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-800" />
                Contact Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. amaan@thatvetguy.net"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-500" />
                Website URL
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.thatvetguy.net"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
