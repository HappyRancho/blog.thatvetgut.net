import React, { useState } from 'react';
import { CheckCircle2, Mail, ShieldAlert } from 'lucide-react';

export const NewsletterBox: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'pet-parent' | 'vet-student' | 'veterinarian' | 'other'>('pet-parent');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      try {
        const stored = localStorage.getItem('thatvetguy_subscribers');
        const list = stored ? JSON.parse(stored) : [];
        list.push({ email, role, date: new Date().toISOString() });
        localStorage.setItem('thatvetguy_subscribers', JSON.stringify(list));
      } catch {
        // ignore
      }
      setStatus('success');
      setMessage('Thank you for subscribing to ThatVetGuy Clinical Dispatch. You will receive peer-reviewed veterinary insights.');
      setEmail('');
    }, 600);
  };

  return (
    <section id="newsletter-section" className="my-12 sm:my-16">
      <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-emerald-900 shadow-lg relative overflow-hidden">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-300 text-xs font-semibold tracking-wide uppercase border border-emerald-800">
            <Mail className="w-3.5 h-3.5" />
            <span>The ThatVetGuy Dispatch</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif font-bold text-2xl sm:text-4xl text-white tracking-tight">
              Veterinary Science, Delivered Straight to Your Inbox
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Receive monthly clinical roundups, pet nutrition analyses, preventative protocol updates, and emerging One Health news authored by ThatVetGuy Co-Founders. Zero spam or commercial affiliate gimmicks.
            </p>
          </div>

          {status === 'success' ? (
            <div className="bg-emerald-900/60 border border-emerald-600/60 rounded-2xl p-4 flex items-center gap-3 text-emerald-200 text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <p>{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 rounded-xl bg-stone-900/90 border border-emerald-800/80 text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-400 min-h-[44px]"
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs sm:text-sm rounded-xl transition-colors shrink-0 shadow-md min-h-[44px] cursor-pointer disabled:opacity-50"
                >
                  {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>

              {/* Reader Type selector */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300 pt-1">
                <span className="text-stone-400 font-medium">I am a:</span>
                {[
                  { id: 'pet-parent', label: 'Pet Parent' },
                  { id: 'veterinarian', label: 'Veterinarian' },
                  { id: 'vet-student', label: 'Vet Student' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="subscriber-role"
                      value={item.id}
                      checked={role === item.id}
                      onChange={() => setRole(item.id as any)}
                      className="accent-emerald-400"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-red-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{message}</span>
                </div>
              )}
            </form>
          )}

          <p className="text-[11px] text-stone-400">
            Educational publication. We respect your privacy and never sell subscriber data. You can unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};
