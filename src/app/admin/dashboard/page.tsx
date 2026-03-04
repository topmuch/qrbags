'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to new admin dashboard
export default function OldAdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/tableau-de-bord');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
        <span className="text-slate-500">Redirection...</span>
      </div>
    </div>
  );
}
