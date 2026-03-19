import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, UserCheck, UserX, Edit2, Trash2, Plus } from 'lucide-react';

/**
 * UsersManagement - Página de gerenciamento de usuários
 * 
 * Permite visualizar, editar e gerenciar usuários com diferentes roles
 * Roles: Usuario, Gerente, Administrador
 */

const UsersManagement: React.FC = () => {
  const { getAllUsers } = useAuth();
  const users = getAllUsers();
  const [selectedRole, setSelectedRole] = useState<'todos' | 'usuario' | 'gerente' | 'admin'>('todos');

  const filteredUsers = selectedRole === 'todos' ? users : users.filter((u) => u.role === selectedRole);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      usuario: 'Usuário',
      gerente: 'Gerente',
      admin: 'Administrador',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'gerente':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'usuario':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={18} className="text-red-400" />;
      case 'gerente':
        return <UserCheck size={18} className="text-amber-400" />;
      case 'usuario':
        return <Users size={18} className="text-blue-400" />;
      default:
        return <UserX size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Users size={32} className="text-cyan-400" />
              Gerenciamento de Usuários
            </h1>
            <p className="text-slate-400 mt-2">Gerencie usuários, gerentes e administradores do sistema</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex items-center gap-2">
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* Filtros por Role */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Todos', value: 'todos' },
            { label: 'Usuários', value: 'usuario' },
            { label: 'Gerentes', value: 'gerente' },
            { label: 'Administradores', value: 'admin' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedRole(filter.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedRole === filter.value
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Nome</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Departamento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="admin-table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.avatar || user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{user.email}</td>
                  <td className="px-6 py-4 text-slate-300">{user.department || '-'}</td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border admin-badge ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="text-xs font-medium">{getRoleLabel(user.role)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300 text-slate-400 hover:text-cyan-400">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors duration-300 text-slate-400 hover:text-red-400">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          {
            label: 'Total de Usuários',
            value: users.length,
            icon: <Users size={24} />,
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Gerentes',
            value: users.filter((u) => u.role === 'manager').length,
            icon: <UserCheck size={24} />,
            color: 'from-amber-500 to-orange-500',
          },
          {
            label: 'Administradores',
            value: users.filter((u) => u.role === 'admin').length,
            icon: <Shield size={24} />,
            color: 'from-red-500 to-pink-500',
          },
        ].map((stat, index) => (
          <div key={index} className="admin-kpi-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersManagement;
