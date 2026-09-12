import React from 'react';
import {
  CheckCircle2,
  Heart,
  Scale,
  ShieldCheck,
  Stethoscope,
  Users,
  ArrowRight,
} from 'lucide-react';
import { AUTHORS } from '../data/authors';
import { SEOHead } from '../components/common/SEOHead';
import { useNavigation } from '../context/NavigationContext';

export const AboutPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">
      <SEOHead
        title="About ThatVetGuy — Collaborative Veterinary Publication"
        description="Learn about ThatVetGuy, our collective founding principles, equal co-authorship model, and mission to deliver peer-reviewed pet health education."
      />

      {/* Header */}
      <div className="border-b border-stone-200 pb-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-950 text-xs font-bold uppercase tracking-wider">
          <Stethoscope className="w-3.5 h-3.5 text-emerald-800" />
          <span>About ThatVetGuy</span>
        </div>
        <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-stone-900 tracking-tight leading-tight">
          Veterinary Medicine Grounded in Collective Clinical Truth
        </h1>
        <p className="font-serif text-lg sm:text-xl text-stone-700 leading-relaxed italic">
          Veterinary Medicine • Animal Health • Pet Education
        </p>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-3xl">
          ThatVetGuy is an independent veterinary publication created, operated, and peer-reviewed collectively by practicing veterinary clinicians. We exist to provide companion animal caregivers, veterinary students, and practitioners with clear, uncompromised medical clarity in an age saturated by commercial misinformation.
        </p>
      </div>

      {/* Core Principle: Equal Co-Foundership */}
      <section className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 space-y-6 shadow-md border border-emerald-900">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
          <Scale className="w-4 h-4" />
          <span>Our Organizational Ethos</span>
        </div>
        <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">
          A True Veterinary Collective: No Hierarchy, Zero Solo Owners
        </h2>
        <p className="text-stone-200 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Unlike conventional media outlets centered around a solitary influencer or corporate hierarchy, ThatVetGuy is founded on absolute professional equality.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-800/80 space-y-2">
            <h3 className="font-bold text-sm text-emerald-200">ThatVetGuy Co-Founders</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              All core team members are recognized collectively as ThatVetGuy Co-Founders. No individual is designated as &ldquo;Owner&rdquo;, &ldquo;Sole Founder&rdquo;, &ldquo;Head&rdquo;, or &ldquo;Boss&rdquo;.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-800/80 space-y-2">
            <h3 className="font-bold text-sm text-emerald-200">Equal Publishing Authority</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Every authorized Co-Founder possesses equal editorial capability to write, review, critique, approve, and publish scientific literature without top-down bureaucratic friction.
            </p>
          </div>
        </div>
      </section>

      {/* The Core Co-Founders List */}
      <section className="space-y-6">
        <div className="border-b border-stone-200 pb-4">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            The Co-Founders
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            The initial core veterinary team operating ThatVetGuy:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AUTHORS.map((author) => (
            <div
              key={author.id}
              onClick={() => navigateTo({ name: 'author', slug: author.slug })}
              className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-700/50 shadow-xs cursor-pointer group transition-all flex items-center gap-3.5"
            >
              <img
                src={author.avatarUrl}
                alt={author.name}
                className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
              />
              <div className="overflow-hidden">
                <h3 className="font-serif font-bold text-sm text-stone-900 group-hover:text-emerald-950 truncate">
                  {author.name}
                </h3>
                <span className="text-[11px] text-emerald-950 font-bold block truncate">
                  {author.designation}
                </span>
                <span className="text-[11px] text-stone-700 font-medium block truncate">
                  {author.professionalRole}
                </span>
                <span className="text-[10px] text-stone-500 block truncate">
                  {author.qualifications}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={() => navigateTo({ name: 'contributors' })}
            className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 inline-flex items-center gap-1"
          >
            Explore Complete Contributor Profiles <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* Editorial Pillars */}
      <section className="space-y-6">
        <div className="border-b border-stone-200 pb-4">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Our Editorial Standards & Methodology
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Three principles govern every article published under the ThatVetGuy imprint.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Evidence Over Algorithm
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              We never produce clickbait or search-engine stuffing. Clinical claims are cross-checked against peer-reviewed journals, textbooks, and WSAVA guidelines.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Mandatory Peer Review
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Before publication, draft articles are submitted to a fellow Co-Founder or specialist for independent clinical critique, verifying drug dosages, pathophysiology, and nuance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Compassionate Translation
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Veterinary science should not be cloistered behind impenetrable academic paywalls. We explain complex pathology in human language without diluting diagnostic fidelity.
            </p>
          </div>
        </div>
      </section>

      {/* Intended Architecture & Independence */}
      <section className="bg-stone-50 rounded-2xl border border-stone-200 p-6 text-xs text-stone-600 space-y-2">
        <h4 className="font-semibold text-stone-900 uppercase tracking-wider">
          Platform Architecture & Deployment Target
        </h4>
        <p className="leading-relaxed">
          ThatVetGuy is engineered as a modern, decoupled web application prepared for deployment on <strong className="text-stone-800">Cloudflare Pages</strong> under the primary domain <strong className="text-stone-800">blog.thatvetguy.net</strong>. The platform operates independently with dedicated client-side routing, responsive mobile-first views for Android, and future integration ready for Firebase Firestore and Google Sign-In.
        </p>
      </section>
    </div>
  );
};
