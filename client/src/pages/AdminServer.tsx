import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/BackButton';
import { useLocation } from 'wouter';
import {
  Users, Settings, Plus, Search, Filter, Edit2, Trash2,
  BarChart3, Lock, Shield, Database, ChevronDown, Menu, X, AlertCircle, Loader2
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'manager';
  department?: string;
  departmentId?: string;
  companyId?: number;
  companyName?: string;
  createdAt: string;
  isActive: boolean;
  profileImage?: string;
  position?: string;
}

interface Company {
  id: number;
  name: string;
  cnpj: string;
}

interface Department {
  id: number;
  companyId: number;
  name: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'companies' | 'departments' | 'tickets' | 'reports';
}

const PERMISSIONS: Permission[] = [
  { id: 'view_users', name: 'Visualizar Usuários', description: 'Acesso de leitura à lista de usuários', category: 'users' },
  { id: 'create_users', name: 'Criar Usuários', description: 'Permissão para criar novos usuários', category: 'users' },
  { id: 'edit_users', name: 'Editar Usuários', description: 'Permissão para editar dados de usuários', category: 'users' },
  { id: 'delete_users', name: 'Deletar Usuários', description: 'Permissão para deletar usuários', category: 'users' },
  { id: 'view_companies', name: 'Visualizar Empresas', description: 'Acesso de leitura à lista de empresas', category: 'companies' },
  { id: 'create_companies', name: 'Criar Empresas', description: 'Permissão para criar novas empresas', category: 'companies' },
  { id: 'view_departments', name: 'Visualizar Departamentos', description: 'Acesso de leitura à lista de departamentos', category: 'departments' },
  { id: 'manage_tickets', name: 'Gerenciar Tickets', description: 'Permissão para gerenciar tickets de suporte', category: 'tickets' },
  { id: 'view_reports', name: 'Visualizar Relatórios', description: 'Acesso a relatórios e analytics', category: 'reports' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['view_users', 'create_users', 'edit_users', 'delete_users', 'view_companies', 'create_companies', 'view_departments', 'manage_tickets', 'view_reports'],
  manager: ['view_users', 'create_users', 'edit_users', 'view_departments', 'manage_tickets'],
  user: [],
};

type TabType = 'dashboard' | 'users' | 'permissions' | 'settings';

export default function AdminServer() {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user' as 'user' | 'admin' | 'manager',
    department: '',
    departmentId: '',
    companyId: '',
    password: '',
    confirmPassword: '',
    profileImage: '',
  });
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [currentUser] = useState({ role: 'admin', name: 'Admin' });
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string>('');

  // Load users, companies, and departments on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load departments when company changes
  useEffect(() => {
    if (formData.companyId) {
      loadDepartmentsByCompany(parseInt(formData.companyId));
    }
  }, [formData.companyId]);

  // Abrir modal de criação automaticamente se ?action=create estiver na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
      setActiveTab('users');
      setEditingUser(null);
      setFormData({ email: '', name: '', role: 'user', department: '', departmentId: '', companyId: '', password: '', confirmPassword: '', profileImage: '' });
      setError('');
      setShowUserModal(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUsers(), loadCompanies()]);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role || 'user',
          department: u.department,
          companyId: u.companyId,
          createdAt: new Date(u.createdAt).toISOString().split('T')[0],
          isActive: true,
        })));
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadCompanies = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('/api/companies', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const loadDepartmentsByCompany = async (companyId: number) => {
    try {
      const response = await fetch(`/api/departments/company/${companyId}`);
      if (response.ok) {
        const raw = await response.json();
        // A API pode retornar array direto ou objeto { data: [...] } do retryWithBackoff
        const data: Department[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        setDepartments(data);
        // Reset department selection if it's not in the new list
        if (formData.departmentId && !data.find((d: any) => d.id.toString() === formData.departmentId)) {
          setFormData(prev => ({ ...prev, department: '', departmentId: '' }));
        }
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const generateUserId = () => {
    return `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    setDepartments([]);
    setFormData({ email: '', name: '', role: 'user', department: '', departmentId: '', companyId: '', password: '', confirmPassword: '', profileImage: '' });
    setError('');
    setShowUserModal(true);
  };

  const handleEditUser = async (u: User) => {
    setEditingUser(u);
    setDepartments([]);
    // Carregar departamentos da empresa do usuário antes de abrir o modal
    let deptId = '';
    if (u.companyId) {
      try {
        const response = await fetch(`/api/departments/company/${u.companyId}`);
        if (response.ok) {
          const raw = await response.json();
          const depts: Department[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
          setDepartments(depts);
          // Tentar encontrar o departamento pelo nome
          if (u.department) {
            const matched = depts.find(d => d.name === u.department);
            if (matched) deptId = matched.id.toString();
          }
        }
      } catch (err) {
        console.error('Failed to load departments for edit:', err);
      }
    }
    setFormData({
      email: u.email,
      name: u.name,
      role: u.role,
      department: u.department || '',
      departmentId: deptId,
      companyId: u.companyId?.toString() || '',
      password: '',
      confirmPassword: '',
      profileImage: '',
    });
    setError('');
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.email || !formData.name || !formData.companyId) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validar senha se for novo usuário
    if (!editingUser) {
      if (!formData.password || !formData.confirmPassword) {
        setError('Senha é obrigatória para novo usuário');
        return;
      }
      if (formData.password.length < 6) {
        setError('Senha deve ter no mínimo 6 caracteres');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não conferem');
        return;
      }
    }

    try {
      setError('');
      setIsSaving(true);

      if (editingUser) {
        // Passo 1: Se houver imagem pendente, fazer upload para S3
        let profileImageUrl: string | undefined = undefined;
        if (formData.profileImage && formData.profileImage.startsWith('data:')) {
          // É uma Data URL - precisa fazer upload
          const token = localStorage.getItem('authToken');
          if (!token) {
            throw new Error('Token não disponível para upload de imagem');
          }

          // Extrair base64 da Data URL
          const base64Data = formData.profileImage.split(',')[1];
          const fileName = `profile-${editingUser.id}-${Date.now()}.jpg`;

          const uploadResponse = await fetch(`/api/users/${editingUser.id}/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageData: base64Data,
              fileName: fileName,
            }),
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || 'Falha ao fazer upload da imagem');
          }

          const uploadResult = await uploadResponse.json();
          profileImageUrl = uploadResult.url;
        } else if (formData.profileImage && !formData.profileImage.startsWith('data:')) {
          // Já é uma URL válida
          profileImageUrl = formData.profileImage;
        }

        // Passo 2: Update user via API
        const updateBody: any = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          companyId: parseInt(formData.companyId),
        };
        // Enviar departmentId (ID numérico) para o backend resolver o nome
        if (formData.departmentId) {
          updateBody.departmentId = parseInt(formData.departmentId);
        } else if (formData.department) {
          // Fallback: enviar nome do departamento
          updateBody.department = formData.department;
        } else {
          updateBody.department = null;
        }
        if (profileImageUrl) {
          updateBody.profileImage = profileImageUrl;
        }

        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateBody),
        });

        if (response.ok) {
          const updatedUserData = await response.json();
          
          // Se o usuário editado for o usuário logado, atualizar localStorage
          const currentUserStr = localStorage.getItem('currentUser');
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser.id === editingUser.id) {
              const newUserData = {
                ...currentUser,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                department: formData.department,
                profileImage: updatedUserData.profileImage || currentUser.profileImage
              };
              localStorage.setItem('currentUser', JSON.stringify(newUserData));
              
              // Disparar evento para atualizar UserMenu
              window.dispatchEvent(new CustomEvent('profileImageUpdated', {
                detail: { profileImage: newUserData.profileImage }
              }));
            }
          }

          // Resolver nome do departamento para atualizar a lista local
          const deptName = formData.departmentId
            ? (departments.find(d => d.id === parseInt(formData.departmentId))?.name || formData.department)
            : formData.department;
          setUsers(users.map(u => u.id === editingUser.id ? {
            ...u,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: deptName,
            companyId: parseInt(formData.companyId),
            profileImage: updatedUserData.profileImage || u.profileImage
          } : u));
          setSuccessMessage('Usuário atualizado com sucesso!');
        } else {
          throw new Error('Erro ao atualizar usuário');
        }
      } else {
        // Passo 1: Criar usuário primeiro (sem imagem)
        const createBody: any = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          companyId: formData.companyId ? parseInt(formData.companyId) : undefined,
          password: formData.password,
        };
        if (formData.departmentId) {
          createBody.departmentId = parseInt(formData.departmentId);
        }
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createBody),
        });

        if (response.ok) {
          const newUserData = await response.json();
          const newUserId = newUserData.id;

          // Passo 2: Se houver imagem, fazer upload para S3
          if (formData.profileImage && formData.profileImage.startsWith('data:')) {
            const token = localStorage.getItem('authToken');
            if (token) {
              try {
                const base64Data = formData.profileImage.split(',')[1];
                const fileName = `profile-${newUserId}-${Date.now()}.jpg`;

                const uploadResponse = await fetch(`/api/users/${newUserId}/upload-image`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    imageData: base64Data,
                    fileName: fileName,
                  }),
                });

                if (!uploadResponse.ok) {
                  console.error('Falha ao fazer upload da imagem do novo usuário');
                }
              } catch (uploadError) {
                console.error('Erro ao fazer upload de imagem:', uploadError);
              }
            }
          }

          const newUser: User = {
            id: newUserId,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            companyId: parseInt(formData.companyId),
            createdAt: new Date().toISOString().split('T')[0],
            isActive: true,
          };
          setUsers([...users, newUser]);
          setSuccessMessage('Usuário criado com sucesso!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar usuário');
        }
      }

      setTimeout(() => {
        setShowUserModal(false);
        setSuccessMessage('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        setSuccessMessage('Usuário deletado com sucesso!');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        throw new Error('Erro ao deletar usuário');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar usuário');
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUserForPassword(user);
    setPasswordFormData({ newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!selectedUserForPassword) return;

    if (!passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      setPasswordError('Por favor, preencha todos os campos');
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      setPasswordError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('As senhas não conferem');
      return;
    }

    try {
      setPasswordError('');
      setIsSaving(true);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      // Usar a rota dedicada de administração que não exige token de redefinição/senha atual
      const response = await fetch(`/api/admin/users/${selectedUserForPassword.id}/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ newPassword: passwordFormData.newPassword }),
      });

      if (response.ok) {
        setSuccessMessage('Senha atualizada com sucesso!');
        setTimeout(() => {
          setShowPasswordModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar senha');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao atualizar senha');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setLocation('/management');
  };

  const stats = [
    { label: 'Total de Usuários', value: users.length, icon: Users, color: 'text-blue-400' },
    { label: 'Administradores', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-red-400' },
    { label: 'Gerentes', value: users.filter(u => u.role === 'manager').length, icon: BarChart3, color: 'text-yellow-400' },
    { label: 'Usuários Ativos', value: users.filter(u => u.isActive).length, icon: Database, color: 'text-green-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Painel de Administração</h1>
          </div>
          <BackButton to="/management" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {(['dashboard', 'users', 'permissions', 'settings'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                      </div>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Messages */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Search and Add Button */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Todos os Papéis</option>
                <option value="user">Usuário</option>
                <option value="manager">Gerente</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleCreateUser}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Usuário
              </button>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 text-center">
                <p className="text-slate-400">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div key={user.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/70 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{user.name}</h3>
                        <p className="text-sm text-slate-400 mb-2">{user.email}</p>
                        <div className="flex gap-3 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                            user.role === 'manager' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Gerente' : 'Usuário'}
                          </span>
                          {user.companyName && (
                            <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                              {user.companyName}
                            </span>
                          )}
                          {user.department && (
                            <span className="px-2 py-1 rounded bg-slate-600 text-slate-300">
                              {user.department}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-slate-600 rounded transition-colors text-slate-400 hover:text-slate-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenPasswordModal(user)}
                          className="p-2 hover:bg-cyan-600/20 rounded transition-colors text-cyan-400 hover:text-cyan-300"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-600/20 rounded transition-colors text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
              <div key={role} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 capitalize">{role === 'admin' ? 'Administrador' : role === 'manager' ? 'Gerente' : 'Usuário'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PERMISSIONS.filter(p => perms.includes(p.id)).map(perm => (
                    <div key={perm.id} className="bg-slate-600/50 rounded p-3">
                      <p className="font-medium text-white text-sm">{perm.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{perm.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Configurações do Sistema</h3>
            <p className="text-slate-400">Configurações do sistema em desenvolvimento...</p>
          </div>
        )}
      </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h2 className="text-xl font-semibold text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                    placeholder="Nome do Usuário"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Empresa *</label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Departamento</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedDept = departments.find(d => d.id.toString() === selectedId);
                      setFormData({
                        ...formData,
                        departmentId: selectedId,
                        department: selectedDept?.name || '',
                      });
                    }}
                    disabled={!formData.companyId}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecione um departamento</option>
                    {Array.isArray(departments) && departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {!formData.companyId && (
                    <p className="text-xs text-slate-500 mt-1">Selecione uma empresa primeiro</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Função do Usuário *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' | 'manager' })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="user">Usuário</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {!editingUser && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Senha *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                      placeholder="Minimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Senha *</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                      placeholder="Confirme a senha"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Imagem de Perfil</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        setError('Imagem deve ter no máximo 5MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setFormData({ ...formData, profileImage: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
                />
                {formData.profileImage && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400 mb-2">Preview:</p>
                    <img src={formData.profileImage} alt="Preview" className="w-24 h-24 rounded-lg object-cover border border-slate-600" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleSaveUser}
                  disabled={isSaving}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Usuário'
                  )}
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                Alterar Senha
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-sm">
                Usuário: <span className="font-semibold">{selectedUserForPassword.name}</span>
              </p>

              {passwordError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{passwordError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nova Senha *</label>
                <input
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  placeholder="Digite a nova senha"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Senha *</label>
                <input
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  placeholder="Confirme a nova senha"
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleSavePassword}
                  disabled={isSaving}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
