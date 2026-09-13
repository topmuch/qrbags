'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';

interface QRSet {
  setId: string;
  type: string;
  qrCount: number;
  references: string[];
  travelerName: string | null;
  agencyName: string | null;
}

function PlancheContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setId = searchParams.get('setId');

  const [set, setSet] = useState<QRSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagesReady, setImagesReady] = useState(0);

  useEffect(() => {
    if (!setId) return;
    fetch(`/api/qrcodes?search=${encodeURIComponent(setId)}`)
      .then((r) => r.json())
      .then((data) => {
        const found: QRSet | undefined = (data.sets as QRSet[]).find((s) => s.setId === setId);
        setSet(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [setId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-slate-600">Set « {setId} » introuvable.</p>
        <button
          onClick={() => router.push('/admin/etiquettes')}
          className="px-4 py-2 rounded-lg bg-[#0d5e34] text-white font-medium"
        >
          Retour aux étiquettes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Barre d'actions (masquée à l'impression) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push('/admin/etiquettes')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="text-sm text-slate-500">
          <span className="font-bold text-slate-800">{set.setId}</span> — {set.qrCount} étiquette
          {set.qrCount > 1 ? 's' : ''} 7×10 cm • A4
          {imagesReady < set.references.length && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {imagesReady}/{set.references.length}
            </span>
          )}
        </div>
        <button
          onClick={() => window.print()}
          disabled={imagesReady < set.references.length}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d5e34] text-white font-medium hover:bg-[#0a4a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-4 h-4" />
          Imprimer
        </button>
      </div>

      {/* Planche A4 : étiquettes 7×10 cm, 2 colonnes */}
      <div className="planche p-4 print:p-0 flex flex-wrap justify-center gap-4 print:gap-[0.8cm] py-6">
        {set.references.map((ref) => (
          <figure key={ref} className="etiquette m-0">
            <img
              src={`/api/labels/${ref}`}
              alt={`Étiquette QRBag ${ref}`}
              width={661}
              height={944}
              onLoad={() => setImagesReady((n) => n + 1)}
              className="block rounded-lg shadow-md print:shadow-none print:rounded-none"
              style={{ width: '7cm', height: '10cm' }}
            />
          </figure>
        ))}
      </div>
    </div>
  );
}

export default function PlancheEtiquettesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <PlancheContent />
    </Suspense>
  );
}
