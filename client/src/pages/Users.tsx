import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import CircuitBackground from '@/components/CircuitBackground';
import BackButton from '@/components/BackButton';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'manager';
  department?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function Users() {
  const [, setLocation] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin' | 'manager',
    department: '',
  });

  // tRPC queries and mutations
  const { data: users = [], isLoading: isLoadingUsers, refetch } = trpc.users.list.useQuery(undefined);

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        role: 'user',
        department: '',
      });
      setError(null);
    },
    onError: (error) => {
      console.error('Erro ao criar usuário:', error);
      setError(error.message);
    }
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsModalOpen(false);
      setSelectedUser(null);
      setError(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar usuário:', error);
      setError(error.message);
    }
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário: ' + error.message);
    }
  });

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email) {
      setError('Nome e email são obrigatórios');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: 'TempPass123!', // Senha temporária - usuário deve alterar no primeiro login
        role: formData.role,
        department: formData.department || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    if (!formData.name || !formData.email) {
      setError('Nome e email são obrigatórios');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await updateMutation.mutateAsync({
        userId: selectedUser.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    
    try {
      await deleteMutation.mutateAsync({ userId });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{ background: '#020810' }}
    >
      {/* Background animado de circuito eletrônico */}
      <CircuitBackground />
      {/* Overlay suave */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(2,8,16,0.12) 0%, rgba(2,8,16,0.04) 50%, rgba(2,8,16,0.18) 100%)'
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 p-4 sm:p-8">
        {/* Header com botão voltar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <BackButton to="/management" />
            <h1 className="text-2xl sm:text-4xl font-bold text-white">Gestão de Usuários</h1>
          </div>
          <Button
            onClick={() => {
              setSelectedUser(null);
              setFormData({
                name: '',
                email: '',
                role: 'user',
                department: '',
              });
              setError(null);
              setIsModalOpen(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-600 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Card principal */}
        <div className="max-w-6xl mx-auto">
          <Card className="bg-slate-800/50 border-white/10">
            <div className="overflow-x-auto">
              {isLoadingUsers ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Carregando usuários...
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-white">Nome</th>
                      <th className="px-6 py-4 text-left text-white">Email</th>
                      <th className="px-6 py-4 text-left text-white">Role</th>
                      <th className="px-6 py-4 text-left text-white">Departamento</th>
                      <th className="px-6 py-4 text-right text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-slate-700/50">
                        <td className="px-6 py-4 text-white">{user.name}</td>
                        <td className="px-6 py-4 text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-slate-300">
                          <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{user.department || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-300"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-800 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}
              <div>
                <Label className="text-white">Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-700 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Role</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-slate-700 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-white/10">
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Departamento</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="bg-slate-700 border-white/10 text-white"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-white/10 text-white hover:bg-slate-700"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={selectedUser ? handleUpdateUser : handleCreateUser}
                  className="bg-cyan-500 hover:bg-cyan-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    selectedUser ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="bg-slate-800 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-400">Nome</Label>
                  <p className="text-white">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Email</Label>
                  <p className="text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Role</Label>
                  <p className="text-white">{selectedUser.role}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Departamento</Label>
                  <p className="text-white">{selectedUser.department || '-'}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
