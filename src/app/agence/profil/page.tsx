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
  Key
} from "lucide-react";
import { useAgency } from '../layout';

// ─── Brand constants (QRBag palette: blue #0047d6 + yellow #fcd616) ───
const BRAND = '#0047d6';   // bleu vif — boutons primaires
const ACCENT = '#fcd616';  // jaune vif — cards
const INK = '#1a1a1a';     // noir — texte sur jaune

export default function ProfilPage() {
  const { agencyData, userName, userEmail } = useAgency();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setSuccess(true);
    setSaving(false);

    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profil de l&apos;agence</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les informations de votre agence</p>
      </div>

      {success && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3 border-2"
          style={{ backgroundColor: ACCENT, borderColor: INK }}
        >
          <CheckCircle className="w-5 h-5" style={{ color: INK }} />
          <span className="font-medium" style={{ color: INK }}>Modifications enregistrées avec succès !</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Agency Info — Yellow card */}
        <div
          className="rounded-2xl p-6 border-2"
          style={{ backgroundColor: ACCENT, borderColor: INK }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: INK }}
            >
              <Building className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: INK }}>Informations de l&apos;agence</h2>
              <p className="text-sm" style={{ color: INK, opacity: 0.7 }}>Ces informations apparaîtront sur vos documents</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>
                  <User className="w-4 h-4 inline mr-2" />
                  Nom de l&apos;agence
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: BRAND }}
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

        {/* Password Change — Yellow card */}
        <div
          className="rounded-2xl p-6 border-2"
          style={{ backgroundColor: ACCENT, borderColor: INK }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: INK }}
            >
              <Key className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: INK }}>Changer le mot de passe</h2>
              <p className="text-sm" style={{ color: INK, opacity: 0.7 }}>Mettez à jour votre mot de passe régulièrement</p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: INK }}>Mot de passe actuel</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ borderColor: INK, color: INK }}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>
            </div>

            <button
              type="button"
              className="text-white py-3 px-6 rounded-xl font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              Changer le mot de passe
            </button>
          </form>
        </div>

        {/* Account Stats — Blue cards with yellow accents */}
        <div className="grid md:grid-cols-3 gap-4">
          <div
            className="p-5 rounded-2xl border-2"
            style={{ backgroundColor: BRAND, borderColor: INK }}
          >
            <p className="text-sm mb-1" style={{ color: ACCENT }}>Statut du compte</p>
            <p className="text-xl font-bold text-white">Actif</p>
          </div>
          <div
            className="p-5 rounded-2xl border-2"
            style={{ backgroundColor: BRAND, borderColor: INK }}
          >
            <p className="text-sm mb-1" style={{ color: ACCENT }}>Membre depuis</p>
            <p className="text-xl font-bold text-white">Jan 2024</p>
          </div>
          <div
            className="p-5 rounded-2xl border-2"
            style={{ backgroundColor: BRAND, borderColor: INK }}
          >
            <p className="text-sm mb-1" style={{ color: ACCENT }}>Abonnement</p>
            <p className="text-xl font-bold text-white">Premium</p>
          </div>
        </div>
      </div>
    </div>
  );
}
