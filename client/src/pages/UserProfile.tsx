import { useState } from "react";
import { ArrowLeft, Mail, Briefcase, Building2, Smartphone, Edit2, Lock, Save, X } from "lucide-react";
import { useLocation } from "wouter";
import { currentUser, userEquipments, userProfilePhoto } from "@/lib/trainingData";
import BackButton from "@/components/BackButton";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Página de perfil do usuário com informações pessoais
 * - Edição de informações com botão salvar
 * - Exibição de equipamentos atribuídos
 * - Opção de alterar para admin com proteção por senha
 */

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    department: currentUser.department || "",
    position: currentUser.position || "",
    password: ""
  });
  const [saveMessage, setSaveMessage] = useState("");

  const handleBack = () => {
    setLocation("/dashboard");
  };

  const handleSwitchToAdmin = () => {
    if (adminPassword === "4123") {
      setLocation("/admin");
      setShowAdminModal(false);
      setAdminPassword("");
      setAdminError("");
    } else {
      setAdminError("Senha incorreta. Tente novamente.");
    }
  };

  const handleSaveProfile = () => {
    setSaveMessage("Perfil atualizado com sucesso!");
    setTimeout(() => {
      setSaveMessage("");
      setIsEditing(false);
    }, 2000);
  };

  const handleCancel = () => {
    setEditData({
      name: currentUser.name,
      email: currentUser.email,
      department: currentUser.department || "",
      position: currentUser.position || "",
      password: ""
    });
    setIsEditing(false);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black"
      style={{
        backgroundImage: "url('https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/KoIkonwMtIdIHrjnda2AbH-img-1_1770239808000_na1fn_YmctcGFnZXMtZ2VuZXJhbA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0tvSWtvbndNdElkSUhyam5kYTJBYkgtaW1nLTFfMTc3MDIzOTgwODAwMF9uYTFmbl9ZbWN0Y0dGblpYTXRaMlZ1WlhKaGJBLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=G-4sam25r3pn-X1QcnliL6aRvhIeTzyayYtXnPHYnJmFJBa7YxlwfCxXZmRdTqb0WuQNAPbaInMrWlNU9Qwu4-MOoxGokBbR~g5S7~K8SJiVWEeilwBhReWUwy8Xv-0mJjOJUVzQ-kKG5wf87sTt60z68n39mMMx36gvnf-X6qNkWt4PfgQziT6L5vreP5betjsfIDH9HvQ6~TTWwAN~8qFR1A8x5tVX2lrJt8F22C~NRVAHfU2XdoqawdV~0zGZVA5gqCO9H88uWz3YeFT6Jq8hJAWE48b373pP2~oSFD8dg6me9Lk1OjZnWYeN6trzN8NYrWMoa~MJHXmDXvNwvw__')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/30 to-black/50 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="glassmorphic border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo-jkings.png" 
                  alt="JKINGS" 
                  className="h-8"
                />
                <div>
                  <h1 className="text-white font-bold">Meu Perfil</h1>
                  <p className="text-gray-300 text-xs">Informações Pessoais</p>
                </div>
              </div>

              <BackButton onClick={handleBack} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Perfil Card */}
          <div className="glassmorphic rounded-xl p-8 mb-8">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Foto e Info Básica */}
              <div className="flex flex-col items-center sm:items-start">
                <img
                  src={userProfilePhoto}
                  alt={editData.name}
                  className="w-32 h-32 rounded-full border-4 border-cyan-400 mb-4 object-cover"
                />
                {!isEditing && (
                  <>
                    <h2 className="text-2xl font-bold text-white text-center sm:text-left">
                      {editData.name}
                    </h2>
                    <p className="text-gray-300 text-sm mt-1">{editData.position}</p>
                  </>
                )}
              </div>

              {/* Informações */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  // Modo Edição
                  <div className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="text-gray-400 text-sm">Nome</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 mt-1"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-gray-400 text-sm">Email</label>
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 mt-1"
                      />
                    </div>

                    {/* Departamento */}
                    <div>
                      <label className="text-gray-400 text-sm">Departamento</label>
                      <input
                        type="text"
                        value={editData.department}
                        onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 mt-1"
                      />
                    </div>

                    {/* Função */}
                    <div>
                      <label className="text-gray-400 text-sm">Função</label>
                      <input
                        type="text"
                        value={editData.position}
                        onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 mt-1"
                      />
                    </div>

                    {/* Senha */}
                    <div>
                      <label className="text-gray-400 text-sm">Nova Senha (deixe em branco para manter)</label>
                      <input
                        type="password"
                        value={editData.password}
                        onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 mt-1"
                      />
                    </div>

                    {/* Mensagem de Sucesso */}
                    {saveMessage && (
                      <div className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm">
                        {saveMessage}
                      </div>
                    )}
                  </div>
                ) : (
                  // Modo Visualização
                  <>
                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white font-medium">{editData.email}</p>
                      </div>
                    </div>

                    {/* Departamento */}
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-gray-400 text-sm">Departamento</p>
                        <p className="text-white font-medium">{editData.department}</p>
                      </div>
                    </div>

                    {/* Função */}
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-gray-400 text-sm">Função</p>
                        <p className="text-white font-medium">{editData.position}</p>
                      </div>
                    </div>

                    {/* Senha */}
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-gray-400 text-sm">Senha</p>
                        <p className="text-white font-medium">••••••••</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="mt-8 pt-8 border-t border-white/10 flex gap-4">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 transition-all"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    <X className="w-5 h-5" />
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                    Editar Perfil
                  </button>
                  <button 
                    onClick={() => setShowAdminModal(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500 transition-all"
                  >
                    <Lock className="w-5 h-5" />
                    Acessar Admin
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Equipamentos Atribuídos */}
          <div className="glassmorphic rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-cyan-400" />
              Equipamentos Atribuídos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userEquipments.map((equipment) => (
                <div
                  key={equipment.id}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-white font-bold text-lg">{equipment.name}</h4>
                      <p className="text-gray-400 text-sm">{equipment.model}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                      {equipment.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-400">Serial</p>
                      <p className="text-white font-mono">{equipment.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Atribuído em</p>
                      <p className="text-white">
                        {new Date(equipment.assignedDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glassmorphic rounded-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Acessar Painel Admin</h3>
            <p className="text-gray-300 mb-6">
              Digite a senha para acessar o painel de administração
            </p>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Digite a senha"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminError("");
                }}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />

              {adminError && (
                <p className="text-red-400 text-sm">{adminError}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleSwitchToAdmin}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all"
                >
                  Acessar
                </button>
                <button
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminPassword("");
                    setAdminError("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
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
