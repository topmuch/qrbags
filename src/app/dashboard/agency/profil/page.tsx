'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Save,
  Luggage,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit
} from "lucide-react";
import { DEMO_AGENCY } from '../layout';

interface AgencyProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
}

interface AgencyStats {
  totalBaggages: number;
  activeBaggages: number;
  lostBaggages: number;
  foundBaggages: number;
}

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<AgencyStats>({
    totalBaggages: 0,
    activeBaggages: 0,
    lostBaggages: 0,
    foundBaggages: 0,
  });
  const [profile, setProfile] = useState<AgencyProfile>({
    name: DEMO_AGENCY.name,
    email: DEMO_AGENCY.email || '',
    phone: DEMO_AGENCY.phone || '',
    address: DEMO_AGENCY.address || '',
    slug: DEMO_AGENCY.slug,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        agencyId: DEMO_AGENCY.id,
      });

      const response = await fetch(`/api/agency/baggages?${params}`);
      const data = await response.json();

      setStats({
        totalBaggages: data.stats?.total || 0,
        activeBaggages: (data.stats?.active || 0) + (data.stats?.scanned || 0),
        lostBaggages: data.stats?.lost || 0,
        foundBaggages: data.stats?.found || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await fetch('/api/agency/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: DEMO_AGENCY.id,
          ...profile,
        }),
      });
      
      setSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    {
      title: 'Total bagages',
      value: stats.totalBaggages,
      icon: Luggage,
      color: '#ff7f00',
      bgColor: 'bg-[#ff7f00]/10',
    },
    {
      title: 'Bagages actifs',
      value: stats.activeBaggages,
      icon: CheckCircle,
      color: '#10b981',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Bagages perdus',
      value: stats.lostBaggages,
      icon: AlertTriangle,
      color: '#ef4444',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Bagages retrouvés',
      value: stats.foundBaggages,
      icon: Clock,
      color: '#3b82f6',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#ff7f00]/10 rounded-xl flex items-center justify-center">
            <Building className="w-6 h-6 text-[#ff7f00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Profil de l&apos;agence</h1>
            <p className="text-slate-500 mt-1">Gérez les informations de votre agence</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-emerald-700">Profil mis à jour avec succès !</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className={`w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-slate-500 text-sm mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Informations de l&apos;agence</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Agency Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              Nom de l&apos;agence
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] transition-all"
              />
            ) : (
              <p className="text-slate-700 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">{profile.name}</p>
            )}
          </div>

          {/* Slug (Read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-700">
              <Building className="w-4 h-4 text-slate-400" />
              Identifiant (slug)
            </label>
            <p className="text-slate-500 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200 font-mono">
              {profile.slug}
              <span className="text-xs text-slate-400 ml-2">(non modifiable)</span>
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400" />
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] transition-all"
                placeholder="contact@agence.com"
              />
            ) : (
              <p className="text-slate-700 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                {profile.email || <span className="text-slate-400">Non renseigné</span>}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400" />
              Téléphone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] transition-all"
                placeholder="+33 6 12 34 56 78"
              />
            ) : (
              <p className="text-slate-700 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                {profile.phone || <span className="text-slate-400">Non renseigné</span>}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400" />
              Adresse
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] resize-none transition-all"
                placeholder="123 Avenue des Voyages, 75001 Paris"
              />
            ) : (
              <p className="text-slate-700 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
                {profile.address || <span className="text-slate-400">Non renseignée</span>}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
