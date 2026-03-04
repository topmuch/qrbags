'use client';

import { useState, useEffect } from 'react';
import {
  HelpCircle,
  Send,
  Inbox,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { DEMO_AGENCY } from '../layout';

interface Message {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  content: string;
  createdAt: string;
  senderName?: string | null;
}

type TabType = 'new' | 'sent' | 'received' | 'superadmin';

export default function AssistancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // New message form
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (activeTab !== 'new') {
      fetchMessages();
    }
  }, [activeTab]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        agencyId: DEMO_AGENCY.id,
        type: activeTab === 'sent' ? 'assistance_agence' : 
              activeTab === 'received' ? 'reponse_assistance' : 
              'message_superadmin'
      });

      const response = await fetch(`/api/agency/messages?${params}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await fetch('/api/agency/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assistance_agence',
          agencyId: DEMO_AGENCY.id,
          senderName: DEMO_AGENCY.name,
          subject: formData.subject,
          content: formData.message,
        }),
      });
      
      setSuccess(true);
      setFormData({ subject: '', message: '' });
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' à ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      non_lu: { label: 'Non lu', icon: <AlertCircle className="w-3 h-3" />, className: 'bg-amber-100 text-amber-700' },
      lu: { label: 'Lu', icon: <CheckCircle className="w-3 h-3" />, className: 'bg-blue-100 text-blue-700' },
      traite: { label: 'Traité', icon: <CheckCircle className="w-3 h-3" />, className: 'bg-emerald-100 text-emerald-700' },
    };

    const config = statusConfig[status] || statusConfig.non_lu;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const tabs = [
    { id: 'new' as TabType, label: 'Nouveau message', icon: <Send className="w-4 h-4" /> },
    { id: 'sent' as TabType, label: 'Messages envoyés', icon: <Mail className="w-4 h-4" /> },
    { id: 'received' as TabType, label: 'Messages reçus', icon: <Inbox className="w-4 h-4" /> },
    { id: 'superadmin' as TabType, label: 'Messages SuperAdmin', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#ff7f00]/10 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-[#ff7f00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Assistance</h1>
            <p className="text-slate-500 mt-1">Contactez le support ou consultez vos messages</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-[#ff7f00] border-[#ff7f00] bg-[#ff7f00]/5'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* New Message Tab */}
          {activeTab === 'new' && (
            <div>
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Message envoyé !</h3>
                  <p className="text-slate-500">Notre équipe vous répondra dans les plus brefs délais.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Sujet</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] transition-all"
                      placeholder="Ex: Problème avec un QR code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">Message</label>
                    <textarea
                      rows={6}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 focus:border-[#b8860b] resize-none transition-all"
                      placeholder="Décrivez votre problème ou votre question en détail..."
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-slate-600 text-sm">
                      <strong className="text-slate-800">De :</strong> {DEMO_AGENCY.name} ({DEMO_AGENCY.email})
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Messages Tabs */}
          {(activeTab === 'sent' || activeTab === 'received' || activeTab === 'superadmin') && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">Aucun message</p>
                  <p className="text-sm text-slate-400 mt-2">
                    {activeTab === 'sent' && 'Vos messages envoyés apparaîtront ici'}
                    {activeTab === 'received' && 'Les réponses du support apparaîtront ici'}
                    {activeTab === 'superadmin' && 'Les messages de l\'administrateur apparaîtront ici'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-[#ff7f00]/30 cursor-pointer transition-all hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-slate-800 font-medium truncate">
                            {message.subject || 'Sans sujet'}
                          </h4>
                          <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                            {message.content}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(message.status)}
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {selectedMessage.subject || 'Message sans sujet'}
              </h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                {getStatusBadge(selectedMessage.status)}
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(selectedMessage.createdAt)}
                </span>
              </div>
              
              {selectedMessage.senderName && (
                <p className="text-slate-500 text-sm mb-4">
                  <strong className="text-slate-700">De :</strong> {selectedMessage.senderName}
                </p>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="w-full mt-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
