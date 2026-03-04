'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Eye,
  QrCode,
  MapPin,
  Clock,
  User,
  Phone,
  X,
  CheckCircle
} from "lucide-react";
import { DEMO_AGENCY } from '../layout';

interface Baggage {
  id: string;
  reference: string;
  type: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  lastScanDate: string | null;
  lastLocation: string | null;
  createdAt: string;
}

export default function PerdusPage() {
  const [baggages, setBaggages] = useState<Baggage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBaggage, setSelectedBaggage] = useState<Baggage | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLostBaggages();
  }, []);

  const fetchLostBaggages = async () => {
    try {
      const params = new URLSearchParams({
        agencyId: DEMO_AGENCY.id,
        status: 'lost',
      });

      const response = await fetch(`/api/agency/baggages?${params}`);
      const data = await response.json();

      // Filter only lost baggages
      const lostBaggages = (data.baggages || []).filter((b: Baggage) => b.status === 'lost');
      setBaggages(lostBaggages);
    } catch (error) {
      console.error('Error fetching lost baggages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFound = async () => {
    if (!selectedBaggage) return;
    
    setUpdating(true);
    try {
      await fetch(`/api/baggage/${selectedBaggage.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'found' }),
      });
      
      setBaggages(baggages.filter(b => b.id !== selectedBaggage.id));
      setShowFoundModal(false);
      setSelectedBaggage(null);
    } catch (error) {
      console.error('Error updating baggage status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bagages Perdus</h1>
            <p className="text-slate-500 mt-1">Bagages signalés comme perdus</p>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span className="text-slate-700 font-medium">
              {baggages.length} bagage{baggages.length !== 1 ? 's' : ''} perdu{baggages.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Link
            href="/dashboard/agency/trouvailles"
            className="text-[#ff7f00] text-sm hover:underline font-medium"
          >
            Voir les trouvailles →
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Référence</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Voyageur</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden md:table-cell">Contact</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden lg:table-cell">Dernière position</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden lg:table-cell">Date perte</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Actions</th>
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
              ) : baggages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="text-slate-500">Aucun bagage perdu</p>
                      <p className="text-sm text-slate-400 mt-2">
                        Excellent ! Tous vos bagages sont suivis correctement.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                baggages.map((baggage) => (
                  <tr
                    key={baggage.id}
                    className="border-b border-slate-100 hover:bg-red-50/50 transition-colors bg-red-50/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#ff7f00]/10 flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-[#ff7f00]" />
                        </div>
                        <span className="text-slate-800 font-mono font-medium">
                          {baggage.reference}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-800">
                          {baggage.travelerFirstName} {baggage.travelerLastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {baggage.whatsappOwner ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-500" />
                          <span className="text-slate-700">{baggage.whatsappOwner}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Non renseigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {baggage.lastLocation ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="text-slate-700">{baggage.lastLocation}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Inconnue</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500 text-sm">
                          {formatDateTime(baggage.lastScanDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedBaggage(baggage);
                            setShowDetail(true);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors group"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-[#ff7f00]" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBaggage(baggage);
                            setShowFoundModal(true);
                          }}
                          className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-xl hover:bg-emerald-600 transition-colors font-medium"
                        >
                          Retrouvé
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedBaggage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Détails du bagage perdu
              </h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedBaggage(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-slate-800 font-mono font-bold">{selectedBaggage.reference}</p>
                  <p className="text-slate-500 text-sm">Bagage perdu</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Voyageur</p>
                  <p className="text-slate-800 font-medium">{selectedBaggage.travelerFirstName} {selectedBaggage.travelerLastName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Type</p>
                  <p className="text-slate-800">{selectedBaggage.baggageType} #{selectedBaggage.baggageIndex}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-sm">Contact WhatsApp</p>
                <p className="text-slate-800">{selectedBaggage.whatsappOwner || 'Non renseigné'}</p>
              </div>

              <div>
                <p className="text-slate-500 text-sm">Dernière position connue</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <p className="text-slate-800">{selectedBaggage.lastLocation || 'Inconnue'}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-sm">Dernière activité</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-slate-800">{formatDateTime(selectedBaggage.lastScanDate)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setShowFoundModal(true);
                  }}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
                >
                  Marquer comme retrouvé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Found Confirmation Modal */}
      {showFoundModal && selectedBaggage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold">Bagage retrouvé ?</h3>
                  <p className="text-slate-500 text-sm">{selectedBaggage.reference}</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-6">
                Confirmer que le bagage de <strong className="text-slate-700">{selectedBaggage.travelerFirstName} {selectedBaggage.travelerLastName}</strong> a été retrouvé ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFoundModal(false);
                    setSelectedBaggage(null);
                  }}
                  className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleMarkAsFound}
                  disabled={updating}
                  className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirmation...
                    </>
                  ) : (
                    'Confirmer'
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
