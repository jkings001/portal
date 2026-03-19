/**
 * DashboardSearch.tsx
 * Barra de busca unificada para o Dashboard.
 * Busca documentos e módulos do portal com lógica de permissão server-side.
 * Visual: glassmorphic escuro, ícone lupa, placeholder descritivo, dropdown animado.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, FileText, Link2, Loader2, X, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface SearchResult {
  id: number | string;
  type: 'document' | 'module';
  title: string;
  description: string | null;
  category: string | null;
  url: string;
  icon?: string;
  tags?: string[];
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function getAuthToken(): string | null {
  try {
    const keys = ['authToken', 'token', 'jwt', 'access_token'];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) return val;
    }
    // Tentar extrair de objeto JSON salvo
    const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.token) return user.token;
    }
  } catch {}
  return null;
}

export default function DashboardSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca ao digitar (debounced)
  const fetchResults = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=all`, {
        headers,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Search failed');
      const data: SearchResponse = await res.json();
      setResults(data.results || []);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  // Navegação por teclado
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery('');
    navigate(result.url);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  // Separar resultados por tipo
  const documents = results.filter(r => r.type === 'document');
  const modules = results.filter(r => r.type === 'module');

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Campo de busca */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: open || query
            ? '1px solid rgba(0,229,255,0.45)'
            : '1px solid rgba(255,255,255,0.10)',
          boxShadow: open || query
            ? '0 0 0 3px rgba(0,229,255,0.08), 0 4px 24px rgba(0,0,0,0.3)'
            : '0 2px 12px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0" />
        ) : (
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(0,229,255,0.7)' }} />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Pesquisar chamados, políticas, termos..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/35"
          style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 p-0.5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
          style={{
            background: 'rgba(8,14,28,0.97)',
            border: '1px solid rgba(0,229,255,0.18)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,255,0.06)',
            backdropFilter: 'blur(20px)',
            maxHeight: '420px',
            overflowY: 'auto',
          }}
        >
          {results.length === 0 && !loading && (
            <div className="px-5 py-6 text-center text-white/40 text-sm">
              Nenhum resultado encontrado para <span className="text-cyan-400">"{query}"</span>
            </div>
          )}

          {/* Seção: Documentos */}
          {documents.length > 0 && (
            <div>
              <div
                className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(0,229,255,0.55)' }}
              >
                <FileText className="inline w-3.5 h-3.5 mr-1.5 mb-0.5" />
                Documentos
              </div>
              {documents.map((result, idx) => {
                const globalIdx = idx;
                const isActive = activeIndex === globalIdx;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors duration-100"
                    style={{
                      background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent',
                      borderLeft: isActive ? '2px solid rgba(0,229,255,0.6)' : '2px solid transparent',
                    }}
                  >
                    <div
                      className="mt-0.5 p-1.5 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(0,229,255,0.12)' }}
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/90 truncate">{result.title}</div>
                      {result.description && (
                        <div className="text-xs text-white/40 truncate mt-0.5">{result.description}</div>
                      )}
                      {(result.category || (result.tags && result.tags.length > 0)) && (
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {result.category && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(0,229,255,0.1)', color: 'rgba(0,229,255,0.7)' }}
                            >
                              {result.category}
                            </span>
                          )}
                          {result.tags?.filter(t => t !== result.category).map(tag => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Seção: Módulos / Links */}
          {modules.length > 0 && (
            <div className={documents.length > 0 ? 'border-t border-white/5' : ''}>
              <div
                className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(139,92,246,0.65)' }}
              >
                <Link2 className="inline w-3.5 h-3.5 mr-1.5 mb-0.5" />
                Módulos do Portal
              </div>
              {modules.map((result, idx) => {
                const globalIdx = documents.length + idx;
                const isActive = activeIndex === globalIdx;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-100"
                    style={{
                      background: isActive ? 'rgba(139,92,246,0.08)' : 'transparent',
                      borderLeft: isActive ? '2px solid rgba(139,92,246,0.6)' : '2px solid transparent',
                    }}
                  >
                    <div
                      className="p-1.5 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(139,92,246,0.12)' }}
                    >
                      <Link2 className="w-3.5 h-3.5" style={{ color: 'rgba(139,92,246,0.8)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/90 truncate">{result.title}</div>
                      {result.description && (
                        <div className="text-xs text-white/40 truncate mt-0.5">{result.description}</div>
                      )}
                      {result.category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                          style={{ background: 'rgba(139,92,246,0.12)', color: 'rgba(139,92,246,0.7)' }}
                        >
                          {result.category}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Rodapé com dica de teclado */}
          {results.length > 0 && (
            <div
              className="px-4 py-2 flex items-center gap-3 text-xs border-t"
              style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}
            >
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/40">↑↓</kbd> navegar</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/40">Enter</kbd> abrir</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white/40">Esc</kbd> fechar</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
