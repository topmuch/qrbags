'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Database,
  RefreshCw,
  HardDrive,
  Calendar,
  CheckCircle,
  Upload,
  AlertTriangle,
  X
} from "lucide-react";

interface BackupInfo {
  database: {
    size: number;
    sizeMB: string;
    modified: string;
  } | null;
  backups: {
    name: string;
    size: string;
    date: string;
  }[];
}

export default function BackupsPage() {
  const [info, setInfo] = useState<BackupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBackupInfo();
  }, []);

  const fetchBackupInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/backup', { method: 'POST' });
      const data = await response.json();
      setInfo(data);
    } catch (error) {
      console.error('Error fetching backup info:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async () => {
    setDownloading(true);
    setSuccess('');
    setError('');
    try {
      const response = await fetch('/api/admin/backup');

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Get filename from header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename="')[1].replace('"', '')
          : `qrbag-backup-${new Date().toISOString().split('T')[0]}.db`;

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSuccess('Sauvegarde téléchargée avec succès !');
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      setError('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.db')) {
        setError('Veuillez sélectionner un fichier .db');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const restoreBackup = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    if (!confirm('⚠️ ATTENTION : La restauration remplacera TOUTES les données actuelles.\n\nUne sauvegarde automatique sera créée avant la restauration.\n\nVoulez-vous continuer ?')) {
      return;
    }

    setRestoring(true);
    setSuccess('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('backup', selectedFile);

      const response = await fetch('/api/admin/backup', {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Base de données restaurée avec succès depuis "${data.restoredFrom}" ! Rechargez la page pour voir les changements.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Refresh info
        fetchBackupInfo();
      } else {
        setError(data.error || 'Erreur lors de la restauration');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      setError('Erreur lors de la restauration');
    } finally {
      setRestoring(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Sauvegardes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Téléchargez ou restaurez votre base de données
          </p>
        </div>
        <Button
          onClick={fetchBackupInfo}
          variant="outline"
          className="border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Database Info Card */}
      <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-[#ff7f00]/10 dark:bg-[#ff7f00]/20 rounded-xl flex items-center justify-center">
              <Database className="w-7 h-7 text-[#ff7f00]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Base de données SQLite
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Fichier: /app/data/custom.db
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
            </div>
          ) : info?.database ? (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <HardDrive className="w-4 h-4" />
                  Taille
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {info.database.sizeMB} MB
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  Dernière modification
                </div>
                <p className="text-lg font-semibold text-slate-800 dark:text-white">
                  {new Date(info.database.modified).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Impossible de récupérer les informations de la base de données</p>
            </div>
          )}

          {/* Download Button */}
          <Button
            onClick={downloadBackup}
            disabled={downloading || !info?.database}
            className="w-full bg-[#ff7f00] hover:bg-[#ff7f00]/90 text-white rounded-xl py-6 text-lg"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Téléchargement en cours...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Télécharger la sauvegarde
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Card */}
      <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Upload className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Restaurer une sauvegarde
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Importez un fichier .db précédemment sauvegardé
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-amber-700 dark:text-amber-300 text-sm">
                <p className="font-semibold mb-1">⚠️ Attention</p>
                <p>La restauration remplacera <strong>toutes les données actuelles</strong>. Une sauvegarde automatique sera créée avant la restauration.</p>
              </div>
            </div>
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Sélectionner un fichier .db
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".db"
                onChange={handleFileSelect}
                className="hidden"
                id="backup-file"
              />
              <label
                htmlFor="backup-file"
                className="flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-[#ff7f00] dark:hover:border-[#ff7f00] transition-colors"
              >
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">
                  {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier .db'}
                </span>
              </label>
            </div>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[#ff7f00]" />
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Restore Button */}
          <Button
            onClick={restoreBackup}
            disabled={restoring || !selectedFile}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 text-lg"
          >
            {restoring ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Restauration en cours...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Restaurer cette sauvegarde
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            💡 Recommandations
          </h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Téléchargez régulièrement</strong> une sauvegarde (hebdomadaire recommandé)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Stockez les sauvegardes</strong> dans un cloud (Google Drive, Dropbox, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Avant chaque mise à jour</strong> majeure, faites une sauvegarde</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Testez la restauration</strong> sur un environnement de test si possible</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Les données sont sur un volume persistant, mais un incident peut toujours arriver</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
