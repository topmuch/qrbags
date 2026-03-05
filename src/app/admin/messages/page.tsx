'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Eye,
  CheckCircle,
  Trash2,
  Download,
  RefreshCw,
  Clock,
  Send,
  XCircle,
  MessageSquare,
  AlertCircle,
  CheckCheck,
  Inbox
} from "lucide-react";
import { AIBadge } from '@/components/ai/AIIndicators';

// Types
interface Message {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  senderName: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  agencyId: string | null;
  recipientAgencyId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Type labels
const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  contact: { label: 'Contact', icon: '📩', color: 'text-blue-600 dark:text-blue-400' },
  partenaire: { label: 'Partenaire', icon: '🤝', color: 'text-violet-600 dark:text-violet-400' },
  commande_agence: { label: 'Commande', icon: '📦', color: 'text-amber-600 dark:text-amber-400' },
  assistance_agence: { label: 'Assistance', icon: '💬', color: 'text-amber-600 dark:text-amber-400' },
  reponse_assistance: { label: 'Réponse', icon: '↩️', color: 'text-emerald-600 dark:text-emerald-400' },
  message_superadmin: { label: 'SuperAdmin', icon: '👑', color: 'text-red-600 dark:text-red-400' },
};

// Status config
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  non_lu: { label: 'Non lu', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  lu: { label: 'Lu', className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  traite: { label: 'Traité', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

// AI Summary Component for messages
function MessageSummaryCell({ content }: { content: string }) {
  const [summary, setSummary] = useState<string>('');
  const [wasSummarized, setWasSummarized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAIAndSummarize();
  }, [content]);

  const checkAIAndSummarize = async () => {
    let text = content;
    try {
      const parsed = JSON.parse(content);
      text = parsed.message || parsed.nom || content;
    } catch {
      // Keep original content
    }

    if (text.length <= 50) {
      setSummary(text);
      return;
    }

    try {
      const statusRes = await fetch('/api/ai/suggestions?status=true');
      const statusData = await statusRes.json();
      const enabled = statusData.aiStatus?.ai_message_summary === true;

      if (enabled) {
        setLoading(true);
        const res = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, maxLength: 50 })
        });
        const data = await res.json();
        
        if (data.success) {
          setSummary(data.summary);
          setWasSummarized(data.wasSummarized);
        } else {
          setSummary(text.substring(0, 50) + '...');
        }
      } else {
        setSummary(text.substring(0, 50) + '...');
      }
    } catch {
      setSummary(text.substring(0, 50) + '...');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="text-slate-400 dark:text-slate-500 animate-pulse">Résumé...</span>;
  }

  return (
    <span className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-1">
      {wasSummarized && (
        <span className="shrink-0">
          <AIBadge tooltip="Résumé généré par IA - Désactivable dans Paramètres" />
        </span>
      )}
      {summary}
    </span>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [typeFilter, statusFilter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/messages?${params}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'lu' }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleMarkAsProcessed = async (id: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'traite' }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;
    
    try {
      await fetch(`/api/messages?id=${id}`, {
        method: 'DELETE',
      });
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleExportPDF = () => {
    alert('Export PDF à implémenter');
  };

  const openMessageDetails = (message: Message) => {
    setSelectedMessage(message);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return { raw: content };
    }
  };

  // Calculate stats
  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'non_lu').length,
    processed: messages.filter(m => m.status === 'traite').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Messages</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos messages et demandes</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {unreadCount} nouveaux
            </span>
          )}
          <Button
            onClick={fetchMessages}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total messages</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total === 0 ? '—' : stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#ff7f00]/10 dark:bg-[#ff7f00]/20 rounded-xl flex items-center justify-center">
                <Inbox className="w-6 h-6 text-[#ff7f00]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Non lus</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.unread === 0 ? '—' : stats.unread}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Traités</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.processed === 0 ? '—' : stats.processed}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Assistance</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{messages.filter(m => m.type === 'assistance_agence').length === 0 ? '—' : messages.filter(m => m.type === 'assistance_agence').length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Type:</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="partenaire">Partenaire</SelectItem>
              <SelectItem value="commande_agence">Commande</SelectItem>
              <SelectItem value="assistance_agence">Assistance</SelectItem>
              <SelectItem value="reponse_assistance">Réponses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Statut:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="non_lu">Non lus</SelectItem>
              <SelectItem value="lu">Lus</SelectItem>
              <SelectItem value="traite">Traités</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleExportPDF}
          variant="outline"
          className="ml-auto border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Messages Table */}
      <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Expéditeur</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Type</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Contenu</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Statut</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
                      <span className="text-slate-500 dark:text-slate-400">Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">Aucun message</p>
                    </div>
                  </td>
                </tr>
              ) : (
                messages.map((message) => {
                  const typeConfig = TYPE_LABELS[message.type] || { label: message.type, icon: '📨', color: 'text-slate-600 dark:text-slate-400' };
                  const statusConfig = STATUS_CONFIG[message.status] || { label: message.status, className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' };
                  
                  return (
                    <tr
                      key={message.id}
                      className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        message.status === 'non_lu' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          {formatDate(message.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 dark:text-white font-medium">{message.senderName || '—'}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">{message.senderEmail || 'Non renseigné'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 ${typeConfig.color}`}>
                          <span>{typeConfig.icon}</span>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <MessageSummaryCell content={message.content} />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openMessageDetails(message)}
                            className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-[#ff7f00] dark:hover:text-[#ff7f00] transition-all duration-200 flex items-center justify-center"
                            title="Voir détails"
                          >
                            <Eye className="w-5 h-5" aria-hidden="true" />
                          </button>
                          {message.status === 'non_lu' && (
                            <button
                              onClick={() => handleMarkAsRead(message.id)}
                              className="w-10 h-10 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 flex items-center justify-center"
                              title="Marquer comme lu"
                            >
                              <CheckCircle className="w-5 h-5" aria-hidden="true" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(message.id)}
                            className="w-10 h-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 flex items-center justify-center"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            {messages.length} message(s)
          </span>
        </div>
      </Card>

      {/* Message Details Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Détails du message</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <XCircle className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Type</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {TYPE_LABELS[selectedMessage.type]?.icon} {TYPE_LABELS[selectedMessage.type]?.label || selectedMessage.type}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Statut</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedMessage.status]?.className}`}>
                    {STATUS_CONFIG[selectedMessage.status]?.label || selectedMessage.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nom</p>
                  <p className="text-slate-800 dark:text-white">{selectedMessage.senderName || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Email</p>
                  <p className="text-slate-800 dark:text-white">{selectedMessage.senderEmail || '—'}</p>
                </div>
              </div>

              {selectedMessage.senderPhone && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Téléphone</p>
                  <p className="text-slate-800 dark:text-white">{selectedMessage.senderPhone}</p>
                </div>
              )}
              
              {selectedMessage.subject && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Sujet</p>
                  <p className="text-slate-800 dark:text-white font-medium">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Contenu</p>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <pre className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap font-mono">
                    {JSON.stringify(parseContent(selectedMessage.content), null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Date</p>
                <p className="text-slate-800 dark:text-white">{new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3">
              {selectedMessage.type === 'assistance_agence' && selectedMessage.agencyId && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowReplyModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Répondre à l'agence
                </button>
              )}
              {selectedMessage.senderEmail && selectedMessage.type !== 'assistance_agence' && (
                <a
                  href={`mailto:${selectedMessage.senderEmail}?subject=Re: Votre message sur QRBag`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ff7f00] text-white rounded-xl hover:bg-[#ff9f00] transition-colors"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Répondre par email
                </a>
              )}
              {selectedMessage.status !== 'traite' && (
                <button
                  onClick={() => {
                    handleMarkAsProcessed(selectedMessage.id);
                    setShowModal(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  Marquer comme traité
                </button>
              )}
              <button
                onClick={() => {
                  handleDelete(selectedMessage.id);
                  setShowModal(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Répondre à {selectedMessage.senderName || 'l\'agence'}</h2>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyContent('');
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <XCircle className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Original Message */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Message original :</p>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-200 dark:border-slate-600">
                <p className="text-slate-700 dark:text-slate-300 text-sm">
                  {selectedMessage.subject && <strong className="block mb-1">{selectedMessage.subject}</strong>}
                  {selectedMessage.content}
                </p>
              </div>
            </div>

            {/* Reply Form */}
            <div className="p-6">
              <label className="block text-slate-500 dark:text-slate-400 text-sm mb-2">Votre réponse :</label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={6}
                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#ff7f00] resize-none"
                placeholder="Écrivez votre réponse ici..."
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyContent('');
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (!replyContent.trim()) return;
                    setReplySubmitting(true);
                    try {
                      await fetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'reponse_assistance',
                          recipientAgencyId: selectedMessage.agencyId,
                          subject: `Re: ${selectedMessage.subject || 'Votre demande d\'assistance'}`,
                          content: replyContent,
                          senderName: 'Support QRBag',
                        }),
                      });
                      
                      await fetch('/api/messages', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selectedMessage.id, status: 'traite' }),
                      });
                      
                      setShowReplyModal(false);
                      setReplyContent('');
                      fetchMessages();
                    } catch (error) {
                      console.error('Error sending reply:', error);
                    } finally {
                      setReplySubmitting(false);
                    }
                  }}
                  disabled={replySubmitting || !replyContent.trim()}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {replySubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" aria-hidden="true" />
                      Envoyer la réponse
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
