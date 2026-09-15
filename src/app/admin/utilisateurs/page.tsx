'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus,
  Trash2,
  Users
} from "lucide-react";

// Types
interface Agency {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  agency: {
    name: string;
  } | null;
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'agent',
    agencyId: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchAgencies();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const res = await fetch('/api/admin/agencies');
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      
      if (response.ok) {
        fetchUsers();
        setDialogOpen(false);
        setUserForm({ email: '', name: '', password: '', role: 'agent', agencyId: '' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; className: string }> = {
      superadmin: { label: 'SuperAdmin', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
      admin: { label: 'Admin', className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' },
      agent: { label: 'Agent', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
      agency: { label: 'Agence', className: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300' },
    };
    const { label, className } = config[role] || { label: role, className: 'bg-slate-100 text-slate-600' };
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Utilisateurs</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les utilisateurs et leurs accès</p>
      </div>

      <div className="flex items-center justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input 
                  placeholder="Jean Dupont"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email"
                  placeholder="email@exemple.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input 
                  type="password"
                  placeholder="Mot de passe"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select 
                  value={userForm.role} 
                  onValueChange={(v) => setUserForm({ ...userForm, role: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="agency">Agence</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">SuperAdmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {userForm.role === 'agency' && (
                <div className="space-y-2">
                  <Label>Agence</Label>
                  <Select 
                    value={userForm.agencyId} 
                    onValueChange={(v) => setUserForm({ ...userForm, agencyId: v })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Sélectionner une agence" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl" 
                onClick={handleCreateUser}
              >
                Créer l&apos;utilisateur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
            <span className="text-slate-500 dark:text-slate-400">Chargement...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Aucun utilisateur</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
              >
                {/* Header with role + created date */}
                <div className="flex items-start justify-between mb-3">
                  {getRoleBadge(user.role)}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {/* User info */}
                <h3 className="font-semibold text-slate-800 dark:text-white mb-0.5">{user.name || 'Sans nom'}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{user.email}</p>
                {/* Agency */}
                {user.agency?.name && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-4">
                    {user.agency.name}
                  </span>
                )}
                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 px-2 py-3">
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              {users.length} utilisateur(s)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
