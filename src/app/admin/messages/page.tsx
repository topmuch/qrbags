'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
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
  contact: { label: 'Contact', icon: '📩', color: 'text-blue-600' },
  partenaire: { label: 'Partenaire', icon: '🤝', color: 'text-violet-600' },
  commande_agence: { label: 'Commande', icon: '📦', color: 'text-amber-600' },
  assistance_agence: { label: 'Assistance', icon: '💬', color: 'text-amber-600' },
  reponse_assistance: { label: 'Réponse', icon: '↩️', color: 'text-emerald-600' },
  message_superadmin: { label: 'SuperAdmin', icon: '👑', color: 'text-red-600' },
};

// Status config
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  non_lu: { label: 'Non lu', className: 'bg-red-100 text-red-700' },
  lu: { label: 'Lu', className: 'bg-slate-100 text-slate-600' },
  traite: { label: 'Traité', className: 'bg-emerald-100 text-emerald-700' },
};

// AI Summary Component for messages
function MessageSummaryCell({ content }: { content: string }) {
  const [summary, setSummary] = useState<string>('');
  const [wasSummarized, setWasSummarized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    checkAIAndSummarize();
  }, [content]);

  const checkAIAndSummarize = async () => {
    // First parse the content
    let text = content;
    try {
      const parsed = JSON.parse(content);
      text = parsed.message || parsed.nom || content;
    } catch {
      // Keep original content
    }

    // If short, no need for summary
    if (text.length <= 50) {
      setSummary(text);
      return;
    }

    // Check if AI is enabled
    try {
      const statusRes = await fetch('/api/ai/suggestions?status=true');
      const statusData = await statusRes.json();
      const enabled = statusData.aiStatus?.ai_message_summary === true;
      setAiEnabled(enabled);

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
    return (
      <span className="text-slate-400 animate-pulse">Résumé...</span>
    );
  }

  return (
    <span className="text-slate-700 text-sm flex items-center gap-1">
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

  const truncateContent = (content: string, maxLength: number = 50) => {
    try {
      const parsed = JSON.parse(content);
      const text = parsed.message || parsed.nom || content;
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    } catch {
      return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    }
  };

  const parseContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return { raw: content };
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Messages</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos messages et demandes</p>
      </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                {unreadCount} nouveaux
              </span>
            )}
          </div>
          <button
            onClick={fetchMessages}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">Type:</span>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-white border-slate-200 text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
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
            <span className="text-slate-500 text-sm">Statut:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white border-slate-200 text-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="non_lu">Non lus</SelectItem>
                <SelectItem value="lu">Lus</SelectItem>
                <SelectItem value="traite">Traités</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={handleExportPDF}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 hover:border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        {/* Messages Table */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Date</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Expéditeur</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Type</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Contenu</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Statut</th>
                  <th className="text-left px-6 py-4 text-slate-500 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
                        <span className="text-slate-500">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Mail className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-500">Aucun message</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  messages.map((message) => {
                    const typeConfig = TYPE_LABELS[message.type] || { label: message.type, icon: '📨', color: 'text-slate-600' };
                    const statusConfig = STATUS_CONFIG[message.status] || { label: message.status, className: 'bg-slate-100 text-slate-600' };
                    
                    return (
                      <tr
                        key={message.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          message.status === 'non_lu' ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Clock className="w-4 h-4" />
                            {formatDate(message.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-800 font-medium">{message.senderName || '-'}</div>
                          <div className="text-slate-500 text-sm">{message.senderEmail || ''}</div>
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
                              className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#ff7f00] transition-all duration-200 flex items-center justify-center"
                              title="Voir détails"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {message.status === 'non_lu' && (
                              <button
                                onClick={() => handleMarkAsRead(message.id)}
                                className="w-10 h-10 rounded-xl hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all duration-200 flex items-center justify-center"
                                title="Marquer comme lu"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(message.id)}
                              className="w-10 h-10 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
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
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-slate-500 text-sm">
              {messages.length} message(s)
            </span>
          </div>
        </div>
      </div>

      {/* Message Details Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Détails du message</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Type</p>
                  <p className="text-slate-800 font-medium">
                    {TYPE_LABELS[selectedMessage.type]?.icon} {TYPE_LABELS[selectedMessage.type]?.label || selectedMessage.type}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Statut</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedMessage.status]?.className}`}>
                    {STATUS_CONFIG[selectedMessage.status]?.label || selectedMessage.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Nom</p>
                  <p className="text-slate-800">{selectedMessage.senderName || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Email</p>
                  <p className="text-slate-800">{selectedMessage.senderEmail || '-'}</p>
                </div>
              </div>

              {selectedMessage.senderPhone && (
                <div>
                  <p className="text-slate-500 text-sm">Téléphone</p>
                  <p className="text-slate-800">{selectedMessage.senderPhone}</p>
                </div>
              )}
              
              {selectedMessage.subject && (
                <div>
                  <p className="text-slate-500 text-sm">Sujet</p>
                  <p className="text-slate-800 font-medium">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <p className="text-slate-500 text-sm mb-2">Contenu</p>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <pre className="text-slate-700 text-sm whitespace-pre-wrap font-mono">
                    {JSON.stringify(parseContent(selectedMessage.content), null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-sm">Date</p>
                <p className="text-slate-800">{new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-100 flex flex-wrap gap-3">
              {/* Reply button for agency assistance messages */}
              {selectedMessage.type === 'assistance_agence' && selectedMessage.agencyId && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowReplyModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Répondre à l'agence
                </button>
              )}
              {selectedMessage.senderEmail && selectedMessage.type !== 'assistance_agence' && (
                <a
                  href={`mailto:${selectedMessage.senderEmail}?subject=Re: Votre message sur QRBag`}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
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
                  <CheckCircle className="w-4 h-4" />
                  Marquer comme traité
                </button>
              )}
              <button
                onClick={() => {
                  handleDelete(selectedMessage.id);
                  setShowModal(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-red-600 rounded-xl hover:bg-red-50 transition-colors ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Répondre à {selectedMessage.senderName || 'l\'agence'}</h2>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyContent('');
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Original Message */}
            <div className="p-6 border-b border-slate-100">
              <p className="text-slate-500 text-sm mb-2">Message original :</p>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-slate-700 text-sm">
                  {selectedMessage.subject && <strong className="block mb-1">{selectedMessage.subject}</strong>}
                  {selectedMessage.content}
                </p>
              </div>
            </div>

            {/* Reply Form */}
            <div className="p-6">
              <label className="block text-slate-500 text-sm mb-2">Votre réponse :</label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={6}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#ff7f00] resize-none"
                placeholder="Écrivez votre réponse ici..."
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyContent('');
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (!replyContent.trim()) return;
                    setReplySubmitting(true);
                    try {
                      // Create reply message
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
                      
                      // Mark original as processed
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
                      <Send className="w-4 h-4" />
                      Envoyer la réponse
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
