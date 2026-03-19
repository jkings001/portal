import { useState, useEffect } from "react";
import { Bell, Moon, Sun, Volume2, Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useLocation } from "wouter";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Página de configurações com opções de layout, notificações e preferências
 * - Suporta temas claro/escuro
 * - Controle de notificações por tipo
 * - Preferências de privacidade e acessibilidade
 */

interface Settings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    sound: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showOnlineStatus: boolean;
    allowMessages: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  };
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      sms: false,
      sound: true,
    },
    privacy: {
      profileVisible: true,
      showOnlineStatus: true,
      allowMessages: true,
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
    },
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    }
  };

  const handleResetSettings = () => {
    const defaultSettings: Settings = {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        sms: false,
        sound: true,
      },
      privacy: {
        profileVisible: true,
        showOnlineStatus: true,
        allowMessages: true,
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
      },
    };
    setSettings(defaultSettings);
    localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const toggleNotification = (key: keyof Settings['notifications']) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
  };

  const togglePrivacy = (key: keyof Settings['privacy']) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key],
      },
    });
  };

  const toggleAccessibility = (key: keyof Settings['accessibility']) => {
    setSettings({
      ...settings,
      accessibility: {
        ...settings.accessibility,
        [key]: !settings.accessibility[key],
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-300">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <BackButton variant="ghost" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-gray-400 mt-1">Personalize sua experiência no portal</p>
          </div>
        </div>

        {/* Mensagem de sucesso */}
        {isSaved && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-400/50 text-green-300 flex items-center gap-2">
            <Save className="w-5 h-5" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Seção de Tema */}
        <div className="glassmorphic rounded-lg p-6 border border-cyan-400/30">
          <div className="flex items-center gap-3 mb-6">
            <Sun className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Aparência</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-3">Tema</label>
              <div className="flex gap-3">
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSettings({ ...settings, theme })}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      settings.theme === theme
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {theme === 'light' && <Sun className="w-4 h-4 inline mr-2" />}
                    {theme === 'dark' && <Moon className="w-4 h-4 inline mr-2" />}
                    {theme === 'auto' && '⚙️'}
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Notificações */}
        <div className="glassmorphic rounded-lg p-6 border border-cyan-400/30">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Notificações</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'email', label: 'Notificações por Email', icon: '📧' },
              { key: 'push', label: 'Notificações Push', icon: '🔔' },
              { key: 'sms', label: 'Notificações por SMS', icon: '📱' },
              { key: 'sound', label: 'Som de Notificações', icon: '🔊' },
            ].map(({ key, label, icon }) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <span className="text-gray-200">{label}</span>
                </div>
                <button
                  onClick={() => toggleNotification(key as keyof Settings['notifications'])}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.notifications[key as keyof Settings['notifications']]
                      ? 'bg-cyan-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.notifications[key as keyof Settings['notifications']]
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Seção de Privacidade */}
        <div className="glassmorphic rounded-lg p-6 border border-cyan-400/30">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Privacidade</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'profileVisible', label: 'Perfil Visível para Outros Usuários', icon: '👤' },
              { key: 'showOnlineStatus', label: 'Mostrar Status Online', icon: '🟢' },
              { key: 'allowMessages', label: 'Permitir Mensagens Diretas', icon: '💬' },
            ].map(({ key, label, icon }) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <span className="text-gray-200">{label}</span>
                </div>
                <button
                  onClick={() => togglePrivacy(key as keyof Settings['privacy'])}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.privacy[key as keyof Settings['privacy']]
                      ? 'bg-cyan-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.privacy[key as keyof Settings['privacy']]
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Seção de Acessibilidade */}
        <div className="glassmorphic rounded-lg p-6 border border-cyan-400/30">
          <div className="flex items-center gap-3 mb-6">
            <Volume2 className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Acessibilidade</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'highContrast', label: 'Alto Contraste', icon: '◐' },
              { key: 'largeText', label: 'Texto Maior', icon: 'A+' },
              { key: 'reducedMotion', label: 'Reduzir Animações', icon: '⏸️' },
            ].map(({ key, label, icon }) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <span className="text-gray-200">{label}</span>
                </div>
                <button
                  onClick={() => toggleAccessibility(key as keyof Settings['accessibility'])}
                  className={`w-12 h-6 rounded-full transition-all ${
                    settings.accessibility[key as keyof Settings['accessibility']]
                      ? 'bg-cyan-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.accessibility[key as keyof Settings['accessibility']]
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={handleResetSettings}
            className="px-6 py-3 rounded-lg font-semibold text-gray-300 bg-gray-600/30 hover:bg-gray-600/50 transition-all flex items-center gap-2 border border-gray-500/30"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Padrões
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
