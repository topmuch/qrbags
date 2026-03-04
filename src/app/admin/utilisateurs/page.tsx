'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/NewAdminLayout';
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
    role: 'agency',
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
        setUserForm({ email: '', name: '', password: '', role: 'agency', agencyId: '' });
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
      superadmin: { label: 'SuperAdmin', className: 'bg-amber-100 text-amber-700' },
      admin: { label: 'Admin', className: 'bg-violet-100 text-violet-700' },
      agency: { label: 'Agence', className: 'bg-indigo-100 text-indigo-700' },
    };
    const { label, className } = config[role] || { label: role, className: 'bg-slate-100 text-slate-600' };
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <AdminLayout 
      title="Utilisateurs"
      subtitle="Gérez les utilisateurs et leurs accès"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-end mb-8">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-slate-800 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-800">
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
                    className="bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    placeholder="email@exemple.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe *</Label>
                  <Input 
                    type="password"
                    placeholder="Mot de passe"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="bg-white border-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select 
                    value={userForm.role} 
                    onValueChange={(v) => setUserForm({ ...userForm, role: v })}
                  >
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
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
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Sélectionner une agence" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
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
                  className="w-full bg-black hover:bg-slate-800 text-white rounded-xl" 
                  onClick={handleCreateUser}
                >
                  Créer l&apos;utilisateur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-slate-500">Nom</TableHead>
                  <TableHead className="text-slate-500">Email</TableHead>
                  <TableHead className="text-slate-500">Rôle</TableHead>
                  <TableHead className="text-slate-500">Agence</TableHead>
                  <TableHead className="text-slate-500">Date création</TableHead>
                  <TableHead className="text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Aucun utilisateur
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-slate-100 hover:bg-slate-50">
                      <TableCell className="text-slate-800 font-medium">{user.name || '-'}</TableCell>
                      <TableCell className="text-slate-600">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-slate-600">{user.agency?.name || '-'}</TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
