'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle,
  Eye,
  QrCode,
  MapPin,
  Clock,
  User,
  Phone,
  X
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

export default function TrouvaillesPage() {
  const [baggages, setBaggages] = useState<Baggage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBaggage, setSelectedBaggage] = useState<Baggage | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    fetchFoundBaggages();
  }, []);

  const fetchFoundBaggages = async () => {
    try {
      const params = new URLSearchParams({
        agencyId: DEMO_AGENCY.id,
        status: 'found',
      });

      const response = await fetch(`/api/agency/baggages?${params}`);
      const data = await response.json();

      // Filter only found baggages
      const foundBaggages = (data.baggages || []).filter((b: Baggage) => b.status === 'found');
      setBaggages(foundBaggages);
    } catch (error) {
      console.error('Error fetching found baggages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReturned = async () => {
    if (!selectedBaggage) return;
    
    setReturning(true);
    try {
      await fetch(`/api/baggage/${selectedBaggage.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }), // Mark as active (returned to owner)
      });
      
      setBaggages(baggages.filter(b => b.id !== selectedBaggage.id));
      setShowReturnModal(false);
      setSelectedBaggage(null);
    } catch (error) {
      console.error('Error updating baggage status:', error);
    } finally {
      setReturning(false);
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
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Trouvailles</h1>
            <p className="text-slate-500 mt-1">Bagages retrouvés en attente de restitution</p>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <span className="text-slate-700 font-medium">
              {baggages.length} bagage{baggages.length !== 1 ? 's' : ''} retrouvé{baggages.length !== 1 ? 's' : ''} en attente de restitution
            </span>
          </div>
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
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden lg:table-cell">Lieu de découverte</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden lg:table-cell">Date</th>
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
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500">Aucun bagage retrouvé</p>
                      <p className="text-sm text-slate-400 mt-2">
                        Les bagages marqués comme retrouvés apparaîtront ici
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                baggages.map((baggage) => (
                  <tr
                    key={baggage.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
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
                          <MapPin className="w-4 h-4 text-[#ff7f00]" />
                          <span className="text-slate-700">{baggage.lastLocation}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Non spécifié</span>
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
                            setShowReturnModal(true);
                          }}
                          className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-xl hover:bg-emerald-600 transition-colors font-medium"
                        >
                          Restituer
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
              <h2 className="text-lg font-bold text-slate-800">Détails du bagage retrouvé</h2>
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
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-slate-800 font-mono font-bold">{selectedBaggage.reference}</p>
                  <p className="text-slate-500 text-sm">Bagage retrouvé</p>
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
                <p className="text-slate-500 text-sm">Lieu de découverte</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#ff7f00]" />
                  <p className="text-slate-800">{selectedBaggage.lastLocation || 'Non spécifié'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setShowReturnModal(true);
                  }}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
                >
                  Marquer comme restitué
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {showReturnModal && selectedBaggage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold">Confirmer la restitution</h3>
                  <p className="text-slate-500 text-sm">{selectedBaggage.reference}</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-6">
                Confirmer que le bagage de <strong className="text-slate-700">{selectedBaggage.travelerFirstName} {selectedBaggage.travelerLastName}</strong> a été restitué à son propriétaire ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedBaggage(null);
                  }}
                  className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleMarkAsReturned}
                  disabled={returning}
                  className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
                >
                  {returning ? (
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
