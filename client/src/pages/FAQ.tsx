import { useState, useEffect } from 'react';
import { Search, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-react';

const FAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchFAQs();
  }, [selectedCategory]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const url = selectedCategory
        ? `/api/faqs?category=${selectedCategory}`
        : '/api/faqs';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const data = await response.json();
      setFaqs(data);

      // Extrair categorias únicas
      const uniqueCategories = Array.from(new Set(data.map((faq: any) => faq.category))).filter(Boolean);
      setCategories(uniqueCategories as string[]);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchFAQs();
      return;
    }

    try {
      const response = await fetch(`/api/faqs/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search FAQs');
      const data = await response.json();
      setFaqs(data);
    } catch (err) {
      console.error('Error searching FAQs:', err);
    }
  };

  const handleExpandFAQ = async (faqId: number) => {
    setExpandedId(expandedId === faqId ? null : faqId);
    if (expandedId !== faqId) {
      try {
        await fetch(`/api/faqs/${faqId}/view`, { method: 'POST' });
      } catch (err) {
        console.error('Error incrementing FAQ views:', err);
      }
    }
  };

  const handleUseful = async (faqId: number, isUseful: boolean) => {
    try {
      const response = await fetch(`/api/faqs/${faqId}/useful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useful: isUseful }),
      });
      if (!response.ok) throw new Error('Failed to update useful count');
      fetchFAQs();
    } catch (err) {
      console.error('Error updating useful count:', err);
    }
  };

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Carregando FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Perguntas Frequentes</h1>
          <p className="text-slate-400">Encontre respostas para as dúvidas mais comuns</p>
        </div>

        {/* Busca */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex gap-2 items-center">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar na FAQ..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Categorias */}
        {categories.length > 0 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-lg transition ${
                !selectedCategory
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedCategory === category
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* FAQs */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => handleExpandFAQ(faq.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-700 transition text-left"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-cyan-500 transition ${
                      expandedId === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedId === faq.id && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-4">
                    <p className="text-slate-300 mb-4">{faq.answer}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400">
                        {faq.views || 0} visualizações
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUseful(faq.id, true)}
                          className="flex items-center gap-1 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                        >
                          <ThumbsUp size={16} />
                          Útil ({faq.useful || 0})
                        </button>
                        <button
                          onClick={() => handleUseful(faq.id, false)}
                          className="flex items-center gap-1 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                        >
                          <ThumbsDown size={16} />
                          Não útil
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">Nenhuma FAQ encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
