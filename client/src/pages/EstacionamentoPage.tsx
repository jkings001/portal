import { useState } from "react";
import { Car, BarChart3, PlusCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RHTicketsEstacionamento from "./RHTicketsEstacionamento";
import RHDashboardEstacionamento from "./RHDashboardEstacionamento";
import EstacionamentoSolicitar from "./EstacionamentoSolicitar";
import { useLocation } from "wouter";

export default function EstacionamentoPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("solicitar");

  return (
    <div className="min-h-screen bg-slate-900" style={{ background: "linear-gradient(135deg, #0a0e27 0%, #1e3a5f 50%, #0a0e27 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header Unificado */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton variant="ghost" />
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Car className="w-8 h-8 text-cyan-400" />
                API Estacionamento
              </h1>
              <p className="text-white/50">Portal unificado de gestão e solicitações de estacionamento</p>
            </div>
          </div>
        </div>

        {/* Sistema de Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-slate-800/50 border border-white/10 p-1 h-auto gap-2">
              <TabsTrigger 
                value="solicitar" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-white/60 px-6 py-2.5 rounded-md transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Solicitar
              </TabsTrigger>
              <TabsTrigger 
                value="tickets" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-white/60 px-6 py-2.5 rounded-md transition-all flex items-center gap-2"
              >
                <Car className="w-4 h-4" />
                Gestão de Tickets
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-white/60 px-6 py-2.5 rounded-md transition-all flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="solicitar" className="mt-0 focus-visible:ring-0">
              <div className="bg-slate-800/30 rounded-xl border border-white/5 p-1">
                <EstacionamentoSolicitar />
              </div>
            </TabsContent>
            
            <TabsContent value="tickets" className="mt-0 focus-visible:ring-0">
              <div className="bg-slate-800/30 rounded-xl border border-white/5 p-1">
                <RHTicketsEstacionamento />
              </div>
            </TabsContent>
            
            <TabsContent value="dashboard" className="mt-0 focus-visible:ring-0">
              <div className="bg-slate-800/30 rounded-xl border border-white/5 p-1">
                <RHDashboardEstacionamento />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
