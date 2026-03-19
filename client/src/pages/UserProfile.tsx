import { useState, useEffect, useRef } from "react";
import { Mail, Briefcase, Building2, Lock, Save, X, Loader, Eye, EyeOff, Check, AlertCircle, Calendar, User, Camera } from "lucide-react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";

/**
 * Design Philosophy: Glassmorphism Futurista - Enxuto e Direto
 * - Layout compacto com informações do banco
 * - Upload de foto pequeno no canto superior
 * - Campos não-editáveis: empresa, departamento, função, último acesso
 * - Campos editáveis: nome, email
 * - Botão único "Salvar Alterações"
 * - Seção separada para alterar senha
 */

interface UserData {
  id: number;
  name: string;
  email: string;
  department?: string;
  role: string;
  profileImage?: string;
  company?: string;
  lastSignedIn?: string;
  createdAt?: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfile() {
  const [, setLocation] = useLocation();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null); // arquivo aguardando salvar
  const [pendingImageData, setPendingImageData] = useState<string | null>(null); // base64 aguardando salvar
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editData, setEditData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "",
  });

  // Carregar dados do usuário ao montar componente
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Atualizar preview quando imagem do usuário mudar
  useEffect(() => {
    if (userData?.profileImage && !userData.profileImage.startsWith('data:')) {
      // Apenas atualizar se for uma URL válida (não Data URL)
      setPreviewImage(userData.profileImage);
    }
  }, [userData?.profileImage]);

  // Calcular força da senha
  useEffect(() => {
    if (passwordData.newPassword) {
      const strength = calculatePasswordStrength(passwordData.newPassword);
      setPasswordStrength(strength);
    }
  }, [passwordData.newPassword]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError("");

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Usuário não autenticado');
        return;
      }

      const response = await fetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar perfil');
      }

      const user = await response.json();
      setUserData(user);
      setEditData({
        name: user.name ?? "",
        email: user.email ?? "",
      });
      setPreviewImage(user.profileImage || null);
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err);
      setError(err.message || 'Falha ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^a-zA-Z\d]/.test(password),
    ];

    score = checks.filter(Boolean).length;

    const strengthMap: { [key: number]: { message: string; color: string } } = {
      0: { message: "Muito fraca", color: "text-red-400" },
      1: { message: "Fraca", color: "text-red-400" },
      2: { message: "Média", color: "text-orange-400" },
      3: { message: "Boa", color: "text-yellow-400" },
      4: { message: "Forte", color: "text-lime-400" },
      5: { message: "Muito forte", color: "text-green-400" },
    };

    return {
      score,
      ...strengthMap[score],
    };
  };

  const handleBack = () => {
    setLocation("/dashboard");
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveProfile = async () => {
    try {
      setError("");
      
      if (!editData.name.trim()) {
        setError("Nome é obrigatório");
        return;
      }

      if (!editData.email.trim()) {
        setError("Email é obrigatório");
        return;
      }

      if (!validateEmail(editData.email)) {
        setError("Email inválido");
        return;
      }

      if (!userData) {
        setError("Dados do usuário não carregados");
        return;
      }

      setIsSaving(true);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Usuário não autenticado');
        return;
      }

      // Passo 1: Se houver imagem pendente, fazer upload para S3 e obter URL
      let profileImageUrl: string | undefined = undefined;
      if (pendingImageFile && pendingImageData) {
        setIsUploadingImage(true);
        const uploadResponse = await fetch(`/api/users/${userData.id}/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageData: pendingImageData,
            fileName: pendingImageFile.name,
          }),
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Falha ao fazer upload da imagem');
        }

        const uploadResult = await uploadResponse.json();
        // O endpoint retorna { success, url, user } — usar url diretamente
        profileImageUrl = uploadResult.url || uploadResult.user?.profileImage;
        setIsUploadingImage(false);
        
        // Limpar imagem pendente após upload bem-sucedido
        setPendingImageFile(null);
        setPendingImageData(null);
      }

      // Passo 2: Salvar dados do perfil (nome, email e profileImage se houver)
      const body: Record<string, string> = {
        name: editData.name,
        email: editData.email,
      };
      if (profileImageUrl) {
        body.profileImage = profileImageUrl;
      }

      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar perfil');
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      
      // Atualizar localStorage para que as mudanças persistam entre recarregamentos
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const newUserData = {
          ...currentUser,
          name: updatedUser.name,
          email: updatedUser.email,
          profileImage: updatedUser.profileImage || currentUser.profileImage
        };
        localStorage.setItem('currentUser', JSON.stringify(newUserData));
      }
      
      // Atualizar preview com URL do S3 (não mais base64)
      if (updatedUser.profileImage) {
        setPreviewImage(updatedUser.profileImage);
      }

      // Disparar evento para atualizar UserMenu no Dashboard
      window.dispatchEvent(new CustomEvent('profileImageUpdated', {
        detail: { profileImage: updatedUser.profileImage }
      }));

      setSuccessMessage("Perfil atualizado com sucesso! Redirecionando...");

      // Redirecionar após 1.5 segundos para dar tempo de ver a mensagem
      setTimeout(() => {
        setSuccessMessage("");
        // Voltar para a tela anterior
        window.history.back();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setError(err.message || 'Falha ao atualizar perfil');
      setIsUploadingImage(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    try {
      setError("");

      if (!passwordData.currentPassword) {
        setError("Senha atual é obrigatória");
        return;
      }

      if (!passwordData.newPassword) {
        setError("Nova senha é obrigatória");
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError("Nova senha deve ter no mínimo 8 caracteres");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("As senhas não conferem");
        return;
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        setError("A nova senha deve ser diferente da atual");
        return;
      }

      if (!userData) {
        setError("Dados do usuário não carregados");
        return;
      }

      setIsSaving(true);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Usuário não autenticado');
        return;
      }

      const response = await fetch(`/api/users/${userData.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao alterar senha');
      }

      setSuccessMessage("Senha alterada com sucesso!");
      setIsEditingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      setError(err.message || 'Falha ao alterar senha');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsEditingPassword(false);
    setError("");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Máximo 5MB');
      return;
    }

    // Apenas mostrar preview local — o upload real acontece ao clicar em "Salvar Alterações"
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreviewImage(imageData);
      setPendingImageFile(file);
      setPendingImageData(imageData.split(',')[1]); // base64 sem prefixo
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-gray-300">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar perfil do usuário</p>
          <BackButton />
        </div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuário',
    };
    return roleMap[role] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton variant="ghost" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Meu Perfil
            </h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie suas informações pessoais</p>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-400/50 text-red-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-400/50 text-green-300 flex items-center gap-3">
            <Check className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Main Card */}
        <div className="glassmorphic rounded-xl p-6 md:p-8 border border-cyan-400/30 space-y-6">
          
          {/* Foto de Perfil - Pequena */}
          <div className="flex items-center justify-between pb-6 border-b border-cyan-400/20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-1 overflow-hidden">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Foto de perfil"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className={`absolute bottom-0 right-0 p-2 rounded-full text-white transition-colors disabled:opacity-50 ${
                    pendingImageFile
                      ? 'bg-amber-500 hover:bg-amber-600 ring-2 ring-amber-300'
                      : 'bg-cyan-500 hover:bg-cyan-600'
                  }`}
                  title={pendingImageFile ? 'Nova foto selecionada (clique em Salvar para confirmar)' : 'Alterar foto'}
                >
                  {isUploadingImage ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div>
                <p className="text-white font-bold">{userData.name}</p>
                <p className="text-cyan-200 text-sm">{userData.email}</p>
                {pendingImageFile && (
                  <p className="text-amber-300 text-xs mt-1">
                    ⚠️ Nova foto selecionada — clique em "Salvar Alterações" para confirmar
                  </p>
                )}
              </div>
            </div>
            {isUploadingImage && (
              <div className="flex items-center gap-2 text-cyan-300 text-sm">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Enviando imagem...</span>
              </div>
            )}
          </div>

          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Informações Pessoais
            </h3>

            {/* Nome - Editável */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">Nome Completo</label>
              <input
                type="text"
                value={editData.name ?? ""}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cyan-400/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            {/* Email - Editável */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">Email</label>
              <input
                type="email"
                value={editData.email ?? ""}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cyan-400/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            {/* Empresa - Não Editável */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">Empresa</label>
              <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/20 text-gray-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                {userData.company || "Não informado"}
              </div>
            </div>

            {/* Departamento - Não Editável */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">Departamento</label>
              <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/20 text-gray-300 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                {userData.department || "Não informado"}
              </div>
            </div>

            {/* Função - Não Editável */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">Função</label>
              <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/20 text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                {getRoleLabel(userData.role)}
              </div>
            </div>

            {/* Último Acesso - Não Editável */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">Último Acesso</label>
              <div className="w-full px-4 py-2 rounded-lg bg-white/5 border border-cyan-400/20 text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                {formatDate(userData.lastSignedIn)}
              </div>
            </div>

            {/* Botão Salvar */}
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-cyan-400/20" />

          {/* Segurança */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Segurança
            </h3>

            {!isEditingPassword ? (
              <button
                onClick={() => setIsEditingPassword(true)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cyan-400/30 text-cyan-300 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Alterar Senha
              </button>
            ) : (
              <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-cyan-400/20">
                {/* Senha Atual */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-2 block">Senha Atual</label>
                  <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword ?? ""}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cyan-400/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 pr-10"
                  />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Nova Senha */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-2 block">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword ?? ""}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cyan-400/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Indicador de Força */}
                  {passwordData.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              passwordStrength.score <= 1 ? 'bg-red-500 w-1/5' :
                              passwordStrength.score === 2 ? 'bg-orange-500 w-2/5' :
                              passwordStrength.score === 3 ? 'bg-yellow-500 w-3/5' :
                              passwordStrength.score === 4 ? 'bg-lime-500 w-4/5' :
                              'bg-green-500 w-full'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.color}`}>
                          {passwordStrength.message}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-2 block">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword ?? ""}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cyan-400/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSavePassword}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isSaving ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelPassword}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
