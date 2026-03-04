'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Image as ImageIcon,
  Globe,
  Search,
  CheckCircle,
  RefreshCw,
  Upload,
  Save,
  Phone,
  Mail,
  MapPin,
  Languages,
  DollarSign,
  QrCode,
  Download,
  Database,
  HardDrive,
  X,
} from "lucide-react";

interface SettingsData {
  // Company
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo: string;
  // SEO
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_image: string;
  // Localization
  languages: string;
  default_language: string;
  currency: string;
}

const CURRENCIES = [
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'USD', name: 'Dollar US ($)', symbol: '$' },
  { code: 'MAD', name: 'Dirham marocain (MAD)', symbol: 'MAD' },
  { code: 'XOF', name: 'Franc CFA (XOF)', symbol: 'XOF' },
  { code: 'GBP', name: 'Livre sterling (£)', symbol: '£' },
  { code: 'SAR', name: 'Riyal saoudien (SAR)', symbol: 'SAR' },
];

const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Backup Section Component
function BackupSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/backup/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrbag-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/backup/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportStatus({ 
          success: true, 
          message: `Import réussi ! ${result.imported?.baggages || 0} bagages, ${result.imported?.users || 0} utilisateurs` 
        });
      } else {
        setImportStatus({ success: false, message: result.error || 'Erreur lors de l\'import' });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({ success: false, message: 'Erreur lors de l\'import' });
    } finally {
      setIsImporting(false);
      setFileInputKey(prev => prev + 1);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Sauvegarde des données</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Exportez ou importez votre base de données</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Export...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Exporter
            </>
          )}
        </button>

        <div>
          <input
            key={fileInputKey}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="backup-import"
          />
          <label
            htmlFor="backup-import"
            className={`flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Import...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Importer
              </>
            )}
          </label>
        </div>

        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <HardDrive className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Dernière: {new Date().toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {importStatus && (
        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${importStatus.success ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
          {importStatus.success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          <span className="text-sm">{importStatus.message}</span>
        </div>
      )}
    </div>
  );
}

export default function ParametresPage() {
  const [settings, setSettings] = useState<SettingsData>({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_logo: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    seo_image: '',
    languages: 'fr,en,ar',
    default_language: 'fr',
    currency: 'EUR',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setSettings({ ...settings, company_logo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSeoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setSettings({ ...settings, seo_image: base64 });
    };
    reader.readAsDataURL(file);
  };

  const toggleLanguage = (code: string) => {
    const currentLangs = settings.languages.split(',').filter(l => l);
    if (currentLangs.includes(code)) {
      const newLangs = currentLangs.filter(l => l !== code);
      setSettings({ 
        ...settings, 
        languages: newLangs.join(','),
        default_language: settings.default_language === code ? newLangs[0] || 'fr' : settings.default_language
      });
    } else {
      setSettings({ ...settings, languages: [...currentLangs, code].join(',') });
    }
  };

  const tabs = [
    { id: 'company', label: 'Entreprise', icon: Building2 },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'localization', label: 'Localisation', icon: Globe },
    { id: 'backup', label: 'Sauvegarde', icon: Database },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Paramètres</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configurez votre application QRBag</p>
      </div>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-end mb-8">
          <button
            onClick={fetchSettings}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
                transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-[#ff7f00] animate-spin" />
          </div>
        )}

        {/* Company Tab */}
        {!loading && activeTab === 'company' && (
          <div className="space-y-6">
            {/* Logo Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#ff7f00]" />
                Logo de l&apos;entreprise
              </h3>
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                  {settings.company_logo ? (
                    <img src={settings.company_logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                    Uploadez le logo de votre entreprise. Format recommandé: PNG ou SVG, 200x200px minimum.
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors">
                      <Upload className="w-4 h-4" />
                      Choisir une image
                    </div>
                  </label>
                  {settings.company_logo && (
                    <button
                      onClick={() => setSettings({ ...settings, company_logo: '' })}
                      className="ml-3 text-rose-500 hover:text-rose-600 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#ff7f00]" />
                Informations de l&apos;entreprise
              </h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Nom de l&apos;entreprise
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#ff7f00]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={settings.company_address}
                    onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#ff7f00]"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      value={settings.company_phone}
                      onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#ff7f00]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.company_email}
                      onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#ff7f00]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {!loading && activeTab === 'seo' && (
          <div className="space-y-6">
            {/* SEO Image */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#ff7f00]" />
                Image SEO (Open Graph)
              </h3>
              <div className="flex items-start gap-6">
                <div className="w-48 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                  {settings.seo_image ? (
                    <img src={settings.seo_image} alt="SEO" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                    Image affichée lors du partage sur les réseaux sociaux. Recommandé: 1200x630px.
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSeoImageUpload}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors">
                      <Upload className="w-4 h-4" />
                      Choisir une image
                    </div>
                  </label>
                  {settings.seo_image && (
                    <button
                      onClick={() => setSettings({ ...settings, seo_image: '' })}
                      className="ml-3 text-rose-500 hover:text-rose-600 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SEO Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#ff7f00]" />
                Référencement (SEO)
              </h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Titre SEO
                  </label>
                  <input
                    type="text"
                    value={settings.seo_title}
                    onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#ff7f00]"
                  />
                  <p className="text-slate-400 text-xs mt-1">
                    {settings.seo_title.length}/60 caractères (recommandé)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Description SEO
                  </label>
                  <textarea
                    value={settings.seo_description}
                    onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#ff7f00] resize-none"
                  />
                  <p className="text-slate-400 text-xs mt-1">
                    {settings.seo_description.length}/160 caractères (recommandé)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Mots-clés (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={settings.seo_keywords}
                    onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#ff7f00]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Localization Tab */}
        {!loading && activeTab === 'localization' && (
          <div className="space-y-6">
            {/* Currency */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#ff7f00]" />
                Devise
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => setSettings({ ...settings, currency: currency.code })}
                    className={`
                      flex items-center gap-3 p-4 rounded-2xl border transition-all
                      ${settings.currency === currency.code
                        ? 'border-[#ff7f00] bg-[#ff7f00]/10 text-slate-800 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400 hover:text-slate-800'
                      }
                    `}
                  >
                    <span className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-lg font-bold">
                      {currency.symbol}
                    </span>
                    <span className="text-sm">{currency.name}</span>
                    {settings.currency === currency.code && (
                      <CheckCircle className="w-5 h-5 text-[#ff7f00] ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5 text-[#ff7f00]" />
                Langues disponibles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const isActive = settings.languages.split(',').includes(lang.code);
                  const isDefault = settings.default_language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={`
                        flex items-center gap-3 p-3 rounded-2xl border transition-all
                        ${isActive
                          ? 'border-[#ff7f00] bg-[#ff7f00]/10 text-slate-800 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-400 dark:text-slate-500 hover:text-slate-600'
                        }
                      `}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm">{lang.name}</span>
                      {isDefault && (
                        <span className="ml-auto text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold">
                          Défaut
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Langue par défaut
                </label>
                <select
                  value={settings.default_language}
                  onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#ff7f00]"
                >
                  {AVAILABLE_LANGUAGES.filter(lang => settings.languages.split(',').includes(lang.code)).map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Backup Tab */}
        {!loading && activeTab === 'backup' && (
          <div className="space-y-6">
            <BackupSection />
          </div>
        )}

        {/* Save Button */}
        {!loading && activeTab !== 'backup' && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all
                ${saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black text-white hover:bg-slate-800 hover:scale-105'
                }
              `}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Enregistré !
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
