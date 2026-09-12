import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div
        id="medical-disclaimer-compact"
        className="flex items-start gap-2.5 px-3 py-2.5 text-xs text-stone-600 bg-stone-100/90 rounded-lg border border-stone-200"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold text-stone-800">Veterinary Educational Notice:</strong>{' '}
          Information published by ThatVetGuy is intended for educational purposes and should not replace professional veterinary consultation, diagnosis, or in-person treatment.
        </p>
      </div>
    );
  }

  return (
    <div
      id="medical-disclaimer-banner"
      className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 text-stone-700"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-emerald-100/70 text-emerald-900 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5 text-emerald-800" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
            Veterinary Clinical & Educational Disclaimer
          </h4>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Information published by ThatVetGuy is intended for educational purposes and should not replace professional veterinary consultation. If your pet or patient is demonstrating acute signs of distress, shock, toxin exposure, or severe illness, contact your local primary veterinary hospital or emergency clinic immediately.
          </p>
        </div>
      </div>
    </div>
  );
};
