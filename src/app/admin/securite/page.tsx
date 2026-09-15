'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Users,
  Monitor,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Activity,
  DatabaseBackup,
  Download,
  HeartPulse,
} from 'lucide-react';

interface LoginLog {
  id: string;
  userId: string | null;
  email: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActivity: string;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
    role: string;
  };
}

interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

interface HealthInfo {
  status: string;
  schema: { ok: boolean; missingTables: number; missingColumns: number };
  baggageReadOk: boolean;
}

export default function SecurityAuditPage() {
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 💾 Sauvegardes
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupLoading, setBackupLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch login logs
      const logsRes = await fetch('/api/admin/security/logs');
      const logsData = await logsRes.json();

      // Fetch active sessions
      const sessionsRes = await fetch('/api/admin/security/sessions');
      const sessionsData = await sessionsRes.json();

      if (logsData.logs) setLoginLogs(logsData.logs);
      if (sessionsData.sessions) setActiveSessions(sessionsData.sessions);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchBackups();
    fetchHealth();
  }, []);

  const fetchBackups = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/cron/backup');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch {
      // non bloquant
    } finally {
      setBackupLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/system/health');
      if (res.ok) setHealth(await res.json());
    } catch {
      // non bloquant
    }
  };

  const createBackupNow = async () => {
    setCreatingBackup(true);
    setBackupMessage(null);
    try {
      const res = await fetch('/api/cron/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBackupMessage(`✅ ${data.message || 'Backup créé'}`);
        await fetchBackups();
      } else {
        setBackupMessage(`❌ ${data.error || 'Échec de la création'}`);
      }
    } catch {
      setBackupMessage('❌ Erreur de connexion');
    } finally {
      setCreatingBackup(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${(bytes / 1024).toFixed(0)} Ko`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return formatDate(dateString);
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: 'Inconnu', os: 'Inconnu' };

    let browser = 'Inconnu';
    let os = 'Inconnu';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { browser, os };
  };

  // Statistics
  const successfulLogins = loginLogs.filter(l => l.success).length;
  const failedLogins = loginLogs.filter(l => !l.success).length;
  const uniqueIPs = new Set(loginLogs.map(l => l.ipAddress).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#8b17c9]" />
            Sécurité & Audit
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Surveillez les connexions et sessions actives
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-violet-600/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-violet-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{successfulLogins}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Connexions réussies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{failedLogins}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tentatives échouées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeSessions.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Sessions actives</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{uniqueIPs}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Adresses IP uniques</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 💾 Sauvegardes de la base */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="w-5 h-5 text-[#8b17c9]" />
              Sauvegardes de la base
            </CardTitle>
            <div className="flex items-center gap-2">
              {health && (
                <Badge
                  variant={health.status === 'ok' ? 'default' : 'destructive'}
                  className="gap-1"
                  title={`schema.ok: ${health.schema?.ok} — baggageReadOk: ${health.baggageReadOk}`}
                >
                  <HeartPulse className="w-3 h-3" />
                  {health.status === 'ok'
                    ? 'Base saine'
                    : `Base dégradée (${health.schema?.missingColumns ?? '?'} colonne(s) manquante(s))`}
                </Badge>
              )}
              <button
                onClick={createBackupNow}
                disabled={creatingBackup}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8b17c9] text-white text-sm font-medium hover:bg-[#7a13b0] disabled:opacity-50 transition-colors"
              >
                <DatabaseBackup className={`w-4 h-4 ${creatingBackup ? 'animate-pulse' : ''}`} />
                {creatingBackup ? 'Création…' : 'Backup maintenant'}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Snapshot quotidien automatique (au démarrage du serveur + cron). Rétention : 14 snapshots.
            Téléchargez régulièrement le dernier backup et conservez-le hors du serveur.
          </p>
          {backupMessage && (
            <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200">
              {backupMessage}
            </div>
          )}
          {backupLoading ? (
            <div className="flex items-center justify-center py-6">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm">
              Aucun backup pour le moment — cliquez sur « Backup maintenant »
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">Fichier</th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">Taille</th>
                    <th className="text-right px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">Télécharger</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b) => (
                    <tr
                      key={b.filename}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-200">{b.filename}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 text-xs">{formatDate(b.createdAt)}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 text-xs">{formatSize(b.sizeBytes)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <a
                          href={`/api/cron/backup/download?file=${encodeURIComponent(b.filename)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          .db
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#8b17c9]" />
            Sessions actives
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : activeSessions.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              Aucune session active
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeSessions.map((session) => {
                const { browser, os } = parseUserAgent(session.userAgent);
                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{session.user.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>
                      </div>
                      <Badge variant={session.user.role === 'superadmin' ? 'default' : 'secondary'}>
                        {session.user.role === 'superadmin' ? 'SuperAdmin' : 'Agence'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500 w-20 shrink-0 text-xs">IP</span>
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {session.ipAddress || 'N/A'}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Monitor className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-xs">{browser} / {os}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="text-xs">{getTimeAgo(session.lastActivity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Logs */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#8b17c9]" />
            Historique des connexions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : loginLogs.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              Aucune connexion enregistrée
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loginLogs.map((log) => {
                const { browser, os } = parseUserAgent(log.userAgent);
                return (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      {log.success ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-violet-600" />
                          <span className="text-violet-700 dark:text-violet-500 font-medium text-sm">Réussie</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-600 dark:text-red-400 font-medium text-sm">Échouée</span>
                        </div>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                        <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">Email</span>
                        <span className="truncate text-sm">{log.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">IP</span>
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {log.ipAddress || 'N/A'}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Monitor className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-xs">{browser} / {os}</span>
                      </div>
                      {log.failureReason && (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-violet-500">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="text-xs">{log.failureReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
