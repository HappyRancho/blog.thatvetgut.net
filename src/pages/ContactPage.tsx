import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Send,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'editorial-inquiry',
    subject: '',
    message: '',
    isVeterinarian: false,
    clinicName: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setTimeout(() => {
      try {
        const stored = localStorage.getItem('thatvetguy_contact_inquiries');
        const list = stored ? JSON.parse(stored) : [];
        list.push({ ...formData, timestamp: new Date().toISOString() });
        localStorage.setItem('thatvetguy_contact_inquiries', JSON.stringify(list));
      } catch {
        // storage fallback
      }
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        topic: 'editorial-inquiry',
        subject: '',
        message: '',
        isVeterinarian: false,
        clinicName: '',
      });
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <SEOHead
        title="Contact & Editorial Inquiries — ThatVetGuy"
        description="Reach ThatVetGuy Co-Founders for editorial submissions, veterinary peer critique, case studies, or general inquiries."
      />

      {/* Header */}
      <div className="border-b border-stone-200 pb-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-950 text-xs font-bold uppercase tracking-wider">
          <Mail className="w-3.5 h-3.5 text-emerald-800" />
          <span>Editorial Communications</span>
        </div>
        <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-stone-900 tracking-tight leading-tight">
          Connect with ThatVetGuy
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl">
          Whether you are a veterinary clinician wishing to contribute peer-reviewed insights, a pet guardian with feedback on an educational article, or a scientific researcher, we welcome thoughtful dialogue.
        </p>
      </div>

      {/* Emergency Alert Banner */}
      <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-5 text-amber-950 flex items-start gap-4">
        <div className="p-2 bg-amber-100 rounded-xl shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-800" />
        </div>
        <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
          <h3 className="font-bold text-amber-950 uppercase tracking-wide text-xs">
            Notice Regarding Acute Veterinary Emergencies
          </h3>
          <p className="text-amber-900">
            ThatVetGuy is an educational publication and cannot provide individual veterinary medical triage or emergency diagnoses via contact form. If your companion pet is in acute distress, vomiting blood, non-responsive, or in pain, please transport them immediately to your nearest emergency veterinary hospital.
          </p>
        </div>
      </div>

      {/* Contact Form & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          {status === 'success' ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">
                Message Received by the Co-Founders
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out to ThatVetGuy. Our editorial team reviews communications collaboratively and will respond promptly.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="px-5 py-2.5 bg-emerald-900 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors min-h-[44px]"
              >
                Send Another Inquire
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-serif font-bold text-xl text-stone-900 mb-2">
                Send an Editorial Message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Jane Miller"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Topic of Inquiry
                </label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 min-h-[44px]"
                >
                  <option value="editorial-inquiry">Editorial Feedback / Article Query</option>
                  <option value="contributor-interest">Prospective Veterinary Contributor</option>
                  <option value="case-study">Clinical Case Study Suggestion</option>
                  <option value="press">Academic or Press Inquiry</option>
                  <option value="other">General Inquiries</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Subject of your message"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Message Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe your clinical query, suggestion, or collaboration idea..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              {/* Checkbox: Are you a veterinary professional? */}
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.isVeterinarian}
                  onChange={(e) =>
                    setFormData({ ...formData, isVeterinarian: e.target.checked })
                  }
                  className="rounded text-emerald-800 focus:ring-emerald-800"
                />
                <span>I am a licensed veterinarian, veterinary nurse, or veterinary student</span>
              </label>

              {formData.isVeterinarian && (
                <div className="space-y-1 pt-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Clinic, Institution, or University Affiliation (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) =>
                      setFormData({ ...formData, clinicName: e.target.value })
                    }
                    placeholder="e.g. Companion Animal Hospital / College of Vet Science"
                    className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden min-h-[40px]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-3 px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{status === 'submitting' ? 'Submitting...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
              <Stethoscope className="w-4 h-4 text-emerald-800" />
              <span>Veterinary Contributors</span>
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Join Our Collaborative Publishing Collective
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you a practicing veterinarian or veterinary specialist passionate about peer-reviewed animal health education? ThatVetGuy welcomes future vetted contributors who share our dedication to clinical accuracy.
            </p>
            <div className="pt-2 text-xs text-emerald-900 font-semibold space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Equal peer review standards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Full author credit and profile</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-3">
            <h4 className="font-serif font-bold text-base text-stone-900">
              Direct Inquiries
            </h4>
            <div className="text-xs text-stone-600 space-y-2">
              <p>
                <strong className="text-stone-800">Editorial Desk:</strong>{' '}
                <a
                  href="mailto:editorial@thatvetguy.net"
                  className="text-emerald-900 underline hover:text-emerald-950"
                >
                  editorial@thatvetguy.net
                </a>
              </p>
              <p>
                <strong className="text-stone-800">Domain:</strong>{' '}
                <span className="font-mono text-stone-500">blog.thatvetguy.net</span>
              </p>
              <p>
                <strong className="text-stone-800">Collective Leadership:</strong>{' '}
                ThatVetGuy Co-Founders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
