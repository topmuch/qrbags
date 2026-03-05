'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
          : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-lg
      `}
      aria-label={enabled ? 'Désactiver' : 'Activer'}
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
      <Card className={`
        transition-all duration-300 rounded-2xl
        ${feature.enabled
          ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 shadow-sm'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }
      `}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                ${feature.enabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-slate-100 dark:bg-slate-700'
                }
              `}>
                <IconComponent 
                  className={`w-6 h-6 ${feature.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} 
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-slate-800 dark:text-white font-semibold text-lg">
                    {feature.label}
                  </h3>
                  {feature.enabled ? (
                    <span className="flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" aria-hidden="true" />
                      Activé
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" aria-hidden="true" />
                      Désactivé
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
                  Dernière modification: {new Date(feature.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isUpdating && (
                <RefreshCw className="w-4 h-4 text-[#ff7f00] animate-spin" aria-hidden="true" />
              )}
              <ToggleSwitch
                enabled={feature.enabled}
                onChange={() => toggleFeature(feature.key, feature.enabled)}
                disabled={isUpdating}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate stats
  const stats = data ? {
    total: data.flags.length,
    enabled: data.flags.filter(f => f.enabled).length,
    disabled: data.flags.filter(f => !f.enabled).length,
  } : { total: 0, enabled: 0, disabled: 0 };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">APIs & Fonctionnalités</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Activez ou désactivez les fonctionnalités du système</p>
        </div>
        <Button
          onClick={fetchFeatures}
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total === 0 ? '—' : stats.total}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.enabled === 0 ? '—' : stats.enabled}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Activées</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-400 dark:text-slate-500">{stats.disabled === 0 ? '—' : stats.disabled}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Désactivées</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 rounded-2xl mb-8">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h3 className="text-slate-800 dark:text-white font-medium mb-1">Feature Flags modulaires</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Chaque fonctionnalité est désactivée par défaut. Activez-la quand vous êtes prêt.
                Toutes les fonctionnalités restent stables même si elles sont désactivées.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
        </div>
      )}

      {/* Features by Category */}
      {data && Object.keys(data.categories || {}).length > 0 && (
        <div className="space-y-8">
          {Object.entries(data.categories).map(([category, features]) => (
            <div key={category}>
              <h2 className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
                {data.categoryLabels?.[category] || category}
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
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
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-slate-400" aria-hidden="true" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucune fonctionnalité disponible</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
