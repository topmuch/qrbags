'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  MessageSquare,
  MapPin,
  FileText,
  Bell,
  Globe,
  BarChart3,
  Upload,
  Webhook,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  MapPin,
  FileText,
  Bell,
  Globe,
  BarChart3,
  Upload,
  Webhook,
  Zap,
  Settings,
};

interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  icon: string | null;
  enabled: boolean;
  updatedAt: string;
}

interface FeatureData {
  flags: FeatureFlag[];
  categories: Record<string, FeatureFlag[]>;
  categoryLabels: Record<string, string>;
}

// Default empty data
const DEFAULT_DATA: FeatureData = {
  flags: [],
  categories: {},
  categoryLabels: {},
};

export default function FonctionnalitesPage() {
  const [data, setData] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/features');
      const result = await response.json();
      
      // Validate the response has required fields
      if (result && result.categories && result.flags) {
        setData(result);
      } else {
        console.error('Invalid API response:', result);
        setData(DEFAULT_DATA);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
      setData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (key: string, currentEnabled: boolean) => {
    setUpdating(key);
    try {
      const response = await fetch('/api/admin/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: !currentEnabled }),
      });

      if (response.ok) {
        // Update local state
        if (data) {
          const updatedFlags = data.flags.map(flag =>
            flag.key === key ? { ...flag, enabled: !currentEnabled } : flag
          );

          const updatedCategories: Record<string, FeatureFlag[]> = {};
          updatedFlags.forEach(flag => {
            if (!updatedCategories[flag.category]) {
              updatedCategories[flag.category] = [];
            }
            updatedCategories[flag.category].push(flag);
          });

          setData({
            ...data,
            flags: updatedFlags,
            categories: updatedCategories,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling feature:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange, disabled }: {
    enabled: boolean;
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        relative w-14 h-7 rounded-full transition-all duration-300
        ${enabled
          ? 'bg-emerald-500'
          : 'bg-slate-300 hover:bg-slate-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-lg
      `}
    >
      <span
        className={`
          absolute top-1 w-5 h-5 bg-white rounded-full shadow-md
          transition-transform duration-300
          ${enabled ? 'translate-x-8' : 'translate-x-1'}
        `}
      />
    </button>
  );

  // Feature card component
  const FeatureCard = ({ feature }: { feature: FeatureFlag }) => {
    const IconComponent = feature.icon ? ICON_MAP[feature.icon] || Settings : Settings;
    const isUpdating = updating === feature.key;

    return (
      <div className={`
        bg-white border rounded-2xl p-5 transition-all duration-300
        ${feature.enabled
          ? 'border-emerald-200 shadow-sm'
          : 'border-slate-200 hover:border-slate-300'
        }
      `}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
              ${feature.enabled
                ? 'bg-emerald-100'
                : 'bg-slate-100'
              }
            `}>
              <IconComponent className={`w-6 h-6 ${feature.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-slate-800 font-semibold text-lg">
                  {feature.label}
                </h3>
                {feature.enabled ? (
                  <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Activé
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Désactivé
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feature.description}
              </p>
              <p className="text-slate-400 text-xs mt-2">
                Dernière modification: {new Date(feature.updatedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isUpdating && (
              <RefreshCw className="w-4 h-4 text-[#ff7f00] animate-spin" />
            )}
            <ToggleSwitch
              enabled={feature.enabled}
              onChange={() => toggleFeature(feature.key, feature.enabled)}
              disabled={isUpdating}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">APIs & Fonctionnalités</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Activez ou désactivez les fonctionnalités du système</p>
      </div>
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchFeatures}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
        {/* Info Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <h3 className="text-slate-800 font-medium mb-1">Feature Flags modulaires</h3>
              <p className="text-slate-600 text-sm">
                Chaque fonctionnalité est désactivée par défaut. Activez-la quand vous êtes prêt.
                Toutes les fonctionnalités restent stables même si elles sont désactivées.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-[#ff7f00] animate-spin" />
          </div>
        )}

        {/* Features by Category */}
        {data && Object.keys(data.categories || {}).length > 0 && (
          <div className="space-y-8">
            {Object.entries(data.categories).map(([category, features]) => (
              <div key={category}>
                <h2 className="text-slate-500 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-8 h-px bg-slate-200" />
                  {data.categoryLabels?.[category] || category}
                  <span className="w-full h-px bg-slate-200" />
                </h2>
                <div className="space-y-3">
                  {features.map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No features message */}
        {data && Object.keys(data.categories || {}).length === 0 && !loading && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune fonctionnalité disponible</p>
          </div>
        )}

        {/* Stats Summary */}
        {data && data.flags && data.flags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-800">{data.flags.length}</p>
                <p className="text-slate-500 text-sm">Total</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-emerald-200">
                <p className="text-3xl font-bold text-emerald-600">
                  {data.flags.filter(f => f.enabled).length}
                </p>
                <p className="text-slate-500 text-sm">Activées</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <p className="text-3xl font-bold text-slate-400">
                  {data.flags.filter(f => !f.enabled).length}
                </p>
                <p className="text-slate-500 text-sm">Désactivées</p>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
