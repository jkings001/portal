import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Server, Globe, Activity } from 'lucide-react';

interface VirtualMachine {
  id: string;
  name: string;
  status: string;
  ipAddress: string;
  cpu: {
    cores: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
  };
  storage: {
    total: number;
    used: number;
  };
}

interface Domain {
  id: string;
  name: string;
  registrar: string;
  expirationDate: string;
  autoRenewal: boolean;
  status: string;
}

export default function HostingerDashboard() {
  const [vms, setVms] = useState<VirtualMachine[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check API connectivity
      const healthRes = await fetch('/api/hostinger/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setIsConnected(healthData.connected);
      }

      // Fetch virtual machines
      const vmsRes = await fetch('/api/hostinger/vms');
      if (vmsRes.ok) {
        const vmsData = await vmsRes.json();
        setVms(vmsData);
      }

      // Fetch domains
      const domainsRes = await fetch('/api/hostinger/domains');
      if (domainsRes.ok) {
        const domainsData = await domainsRes.json();
        setDomains(domainsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Hostinger data');
      console.error('Error fetching Hostinger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    const lower = status.toLowerCase();
    if (lower.includes('active') || lower.includes('online')) return 'text-green-600';
    if (lower.includes('inactive') || lower.includes('offline')) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getMemoryUsagePercent = (vm: VirtualMachine) => {
    return ((vm.memory.used / vm.memory.total) * 100).toFixed(1);
  };

  const getStorageUsagePercent = (vm: VirtualMachine) => {
    return ((vm.storage.used / vm.storage.total) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Hostinger Dashboard</h1>
            <p className="text-slate-400">Monitoramento de recursos e domínios</p>
          </div>
          <Button
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4" />
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>

        {/* API Status */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-5 h-5" />
              Status da API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {isConnected === null ? (
                <div className="text-slate-400">Verificando...</div>
              ) : isConnected ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-green-400 font-semibold">Conectado à API Hostinger</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-400 font-semibold">Desconectado da API Hostinger</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-900/20 border-red-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <span className="text-red-400">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Virtual Machines Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Server className="w-6 h-6" />
            Máquinas Virtuais ({vms.length})
          </h2>
          {vms.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400">Nenhuma máquina virtual encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vms.map(vm => (
                <Card key={vm.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">{vm.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className={`font-semibold ${getStatusColor(vm.status)}`}>
                        {vm.status}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">IP Address</p>
                      <p className="text-white font-mono">{vm.ipAddress}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-2">CPU</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white">{vm.cpu.cores} cores</span>
                        <span className="text-cyan-400">{vm.cpu.usage}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-cyan-500 h-2 rounded-full"
                          style={{ width: `${vm.cpu.usage}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-2">Memória</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white">{vm.memory.used}MB / {vm.memory.total}MB</span>
                        <span className="text-blue-400">{getMemoryUsagePercent(vm)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${getMemoryUsagePercent(vm)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm mb-2">Armazenamento</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white">{vm.storage.used}GB / {vm.storage.total}GB</span>
                        <span className="text-purple-400">{getStorageUsagePercent(vm)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${getStorageUsagePercent(vm)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Domains Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Domínios ({domains.length})
          </h2>
          {domains.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400">Nenhum domínio encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {domains.map(domain => (
                <Card key={domain.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">{domain.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className={`font-semibold ${getStatusColor(domain.status)}`}>
                        {domain.status}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-slate-400 text-sm">Registrador</p>
                      <p className="text-white">{domain.registrar}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Data de Expiração</p>
                      <p className="text-white">{new Date(domain.expirationDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Renovação Automática</p>
                      <p className="text-white">
                        {domain.autoRenewal ? (
                          <span className="text-green-400">✓ Ativada</span>
                        ) : (
                          <span className="text-red-400">✗ Desativada</span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
