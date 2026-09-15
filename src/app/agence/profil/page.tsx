'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  CheckCircle,
  AlertCircle,
  Key,
  ShieldCheck,
  Calendar,
  Crown
} from "lucide-react";
import {
  brandInput,
  brandLabel,
  brandBtnGradient,
  brandBtnNavy,
} from '@/components/brand/BrandShell';
import { useAgency } from '../layout';

// Carte blanche style BrandCard (design system « étiquette » QRBag)
const cardCls =
  'bg-white rounded-3xl border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5 p-6';

export default function ProfilPage() {
  const { agencyId, agencyData, userEmail } = useAgency();
  const [form, setForm] = useState({
    name: agencyData?.name || '',
    email: agencyData?.email || userEmail || '',
    phone: agencyData?.phone || '',
    address: agencyData?.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sauvegarde réelle — PUT /api/agency/profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) {
      setError('Session agence introuvable — reconnectez-vous puis réessayez.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/agency/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || 'Erreur lors de la mise à jour du profil');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16234e]">Profil de l&apos;agence</h1>
        <p className="text-[#16234e]/60 mt-1">Gérez les informations de votre agence</p>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-[#8b17c9]/5 border border-[#8b17c9]/20">
          <CheckCircle className="w-5 h-5 text-[#8b17c9] shrink-0" />
          <span className="font-medium text-[#16234e]">Modifications enregistrées avec succès !</span>
        </div>
      )}

      {error && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-[#ef4036]/5 border border-[#ef4036]/20"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-[#ef4036] shrink-0" />
          <span className="font-medium text-[#ef4036]">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Agency Info — carte blanche */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#8b17c9]/10">
              <Building className="w-5 h-5 text-[#8b17c9]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#16234e]">Informations de l&apos;agence</h2>
              <p className="text-sm text-[#16234e]/60">Ces informations apparaîtront sur vos documents</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="agency-name" className={brandLabel}>
                  <User className="w-4 h-4 inline mr-2" />
                  Nom de l&apos;agence
                </label>
                <input
                  id="agency-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={brandInput}
                />
              </div>

              <div>
                <label htmlFor="agency-email" className={brandLabel}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  id="agency-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={brandInput}
                />
              </div>

              <div>
                <label htmlFor="agency-phone" className={brandLabel}>
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </label>
                <input
                  id="agency-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={brandInput}
                />
              </div>

              <div>
                <label htmlFor="agency-address" className={brandLabel}>
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Adresse
                </label>
                <input
                  id="agency-address"
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={brandInput}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`${brandBtnGradient} inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] cursor-pointer`}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Change — carte blanche (visuel harmonisé, logique inchangée) */}
        <div className={cardCls}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#2f9bff]/10">
              <Key className="w-5 h-5 text-[#2f9bff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#16234e]">Changer le mot de passe</h2>
              <p className="text-sm text-[#16234e]/60">Mettez à jour votre mot de passe régulièrement</p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="agency-current-password" className={brandLabel}>Mot de passe actuel</label>
              <input
                id="agency-current-password"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="••••••••"
                className={brandInput}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="agency-new-password" className={brandLabel}>Nouveau mot de passe</label>
                <input
                  id="agency-new-password"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className={brandInput}
                />
              </div>

              <div>
                <label htmlFor="agency-confirm-password" className={brandLabel}>Confirmer le mot de passe</label>
                <input
                  id="agency-confirm-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={brandInput}
                />
              </div>
            </div>

            <button
              type="button"
              className={`${brandBtnNavy} inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] cursor-pointer`}
            >
              Changer le mot de passe
            </button>
          </form>
        </div>

        {/* Account Stats — cartes blanches, pastilles de marque */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-[#2f9bff]/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#2f9bff]" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-[#16234e]/60">Statut du compte</p>
            </div>
            <p className="text-xl font-extrabold text-[#16234e]">Actif</p>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-[#8b17c9]/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#8b17c9]" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-[#16234e]/60">Membre depuis</p>
            </div>
            <p className="text-xl font-extrabold text-[#16234e]">Jan 2024</p>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-[#f8921f]/10 flex items-center justify-center">
                <Crown className="w-4 h-4 text-[#f8921f]" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-[#16234e]/60">Abonnement</p>
            </div>
            <p className="text-xl font-extrabold text-[#16234e]">Premium</p>
          </div>
        </div>
      </div>
    </div>
  );
}
