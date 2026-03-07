import { useState } from "react";
import { FileText, CheckCircle, Download, Eye } from "lucide-react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";
import { equipmentTerms, workContracts, trainingCertificates } from "@/lib/trainingData";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Página de Termos de Responsabilidade
 * - Listagem de equipamentos, contratos e certificados assinados
 * - Download e visualização de documentos
 */

export default function TermsOfResponsibility() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"equipment" | "contracts" | "certificates">("equipment");

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
                  <h1 className="text-white font-bold">Termos de Responsabilidade</h1>
                  <p className="text-gray-300 text-xs">Documentos Assinados</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <BackButton />
                <div className="pl-4 border-l border-white/20">
                  <UserMenu showHome={false} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab("equipment")}
              className={`px-6 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === "equipment"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 shadow-lg shadow-cyan-400/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Equipamentos ({equipmentTerms.length})
            </button>
            <button
              onClick={() => setActiveTab("contracts")}
              className={`px-6 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === "contracts"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 shadow-lg shadow-cyan-400/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Contratos ({workContracts.length})
            </button>
            <button
              onClick={() => setActiveTab("certificates")}
              className={`px-6 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === "certificates"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 shadow-lg shadow-cyan-400/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Certificados ({trainingCertificates.length})
            </button>
          </div>

          {/* Equipment Terms */}
          {activeTab === "equipment" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-cyan-400" />
                Termos de Equipamentos
              </h2>
              {equipmentTerms.map((term) => (
                <div
                  key={term.id}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">{term.equipmentName}</h3>
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {term.status === "signed" ? "Assinado" : "Pendente"}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{term.equipmentModel}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Serial</p>
                          <p className="text-white font-mono">{term.serialNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Data de Assinatura</p>
                          <p className="text-white">
                            {new Date(term.signedDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-all">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Work Contracts */}
          {activeTab === "contracts" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-cyan-400" />
                Contratos de Trabalho
              </h2>
              {workContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">{contract.contractType}</h3>
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {contract.status === "signed" ? "Assinado" : "Pendente"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Data de Início</p>
                          <p className="text-white">
                            {new Date(contract.startDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Data de Assinatura</p>
                          <p className="text-white">
                            {new Date(contract.signedDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-all">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Training Certificates */}
          {activeTab === "certificates" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-cyan-400" />
                Certificados de Treinamentos
              </h2>
              {trainingCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">{cert.trainingTitle}</h3>
                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {cert.status === "issued" ? "Emitido" : "Pendente"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Data de Conclusão</p>
                          <p className="text-white">
                            {new Date(cert.completedDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Código do Certificado</p>
                          <p className="text-white font-mono">{cert.certificateCode}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-all">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 text-cyan-400 hover:bg-white/20 transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="glassmorphic rounded-lg p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Total de Equipamentos</p>
              <p className="text-4xl font-bold text-cyan-400">{equipmentTerms.length}</p>
            </div>
            <div className="glassmorphic rounded-lg p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Contratos Assinados</p>
              <p className="text-4xl font-bold text-cyan-400">{workContracts.length}</p>
            </div>
            <div className="glassmorphic rounded-lg p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Certificados Obtidos</p>
              <p className="text-4xl font-bold text-cyan-400">{trainingCertificates.length}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
