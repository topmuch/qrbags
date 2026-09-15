'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0e1734] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#f8921f]/30 border-t-[#f8921f] rounded-full animate-spin"></div>
        <p className="text-white/60 text-sm">Redirection vers le tableau de bord...</p>
      </div>
    </div>
  );
}
