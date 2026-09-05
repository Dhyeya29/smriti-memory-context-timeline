import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Tag,
  CheckCircle2,
  Feather,
  Calendar,
  Compass
} from 'lucide-react';
import type { Memory, ContextRecoveryResult } from '../types';
import { recoverContext } from '../services/api';

interface ContextRecoveryViewProps {
  memories: Memory[];
  onOpenMemory: (memory: Memory) => void;
  onNavigateToRecord: () => void;
  initialQuery?: string;
}

export const ContextRecoveryView: React.FC<ContextRecoveryViewProps> = ({
  memories,
  onOpenMemory,
  onNavigateToRecord,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ContextRecoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestions = [
    'Why did I stop working on this project?',
    'How did my goals change between decisions?',
    'What happened before this major career decision?',
    'How did this situation evolve over time?',
    'What trade-offs was I making that I might have forgotten?'
  ];

  const handleRunQuery = async (queryToRun?: string) => {
    const q = (queryToRun || query).trim();
    if (!q) return;

    if (memories.length === 0) {
      setError('You need at least one recorded reflection in your journal to look back.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await recoverContext(q, memories);
      setResult(res.recovery);
    } catch (err: any) {
      console.error('Context recovery error:', err);
      setError(err.message || 'Failed to recover context. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMemoryById = (id: string): Memory | undefined => {
    return memories.find((m) => m.id === id);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#E8E1D5]">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#A35C42] mb-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>Look Back & Reflect</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#222E26]">
          Recover Context
        </h1>
        <p className="text-sm sm:text-base text-[#685A4C] font-serif italic mt-1 max-w-2xl leading-relaxed">
          "Sometimes we remember the moment, but forget why it mattered."
        </p>
      </div>

      {memories.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-[#DCD3C4] bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F0E6] text-[#A35C42] mb-3">
            <Feather className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#243329]">
            No journal entries to look back on yet
          </h3>
          <p className="text-xs sm:text-sm text-[#736556] max-w-md mx-auto mt-1 mb-5 font-serif italic">
            Once you record a few decisions or life turning points, Smriti can connect the dots and remind you of the motivations you once held.
          </p>
          <button
            onClick={onNavigateToRecord}
            className="rounded-2xl bg-[#1E3A2F] px-5 py-2.5 text-xs font-semibold text-[#FAF8F5] shadow-xs hover:bg-[#284E3F] transition-colors cursor-pointer"
          >
            Write Your First Entry
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Query Bar Card */}
          <div className="paper-card-warm rounded-3xl p-6 sm:p-8 shadow-xs border border-[#E8E1D5]">
            <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#5D5043] mb-2">
              What question would you like to ask your past self?
            </label>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#9C8F7F]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunQuery();
                  }}
                  placeholder="e.g., Why did I walk away from that role? What was my mindset then?"
                  className="w-full rounded-2xl border border-[#DFD6C7] bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#2D261F] placeholder:text-[#9F9384] focus:border-[#1E3A2F] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] shadow-2xs transition-all"
                />
              </div>

              <button
                onClick={() => handleRunQuery()}
                disabled={isLoading || !query.trim()}
                id="run-recovery-btn"
                className="flex items-center justify-center space-x-2 rounded-2xl bg-[#1E3A2F] px-6 py-2.5 text-xs font-semibold text-[#FAF8F5] shadow-xs hover:bg-[#284E3F] disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[#E6C594]" />
                <span>{isLoading ? 'Reflecting...' : 'Look Back'}</span>
              </button>
            </div>

            {/* Inquiries Pills */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[11px] font-medium text-[#8C8072] mr-1">Gentle inquiries:</span>
              {sampleQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(sq);
                    handleRunQuery(sq);
                  }}
                  className="rounded-xl border border-[#E0D7C9] bg-white px-3 py-1 text-[11px] text-[#5D5043] hover:bg-[#F7F3EA] hover:border-[#C9BFA0] transition-colors cursor-pointer"
                >
                  "{sq}"
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 rounded-2xl bg-[#FBF1F1] border border-[#ECD1D1] p-4 text-xs text-[#823B47]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#A34757]" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="rounded-3xl border border-[#E8E1D5] bg-white p-12 text-center shadow-xs">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-[#1E3A2F] border-t-[#E6C594] mb-4"></div>
              <h3 className="font-serif text-lg font-bold text-[#243329]">
                Reading Through Your Journal Archives
              </h3>
              <p className="text-xs text-[#706253] font-serif italic max-w-sm mx-auto mt-1 leading-relaxed">
                Consulting your {memories.length} personal journal records to reconstruct your original reasoning and mindset.
              </p>
            </div>
          )}

          {/* Context Recovery Results Card */}
          {result && !isLoading && (
            <div className="paper-card rounded-3xl p-6 sm:p-9 shadow-sm border border-[#E8E1D5] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE8DC] pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-xl bg-[#F3ECE0] flex items-center justify-center text-[#8C6430]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-[#8C6430]">
                      Reconstructed Rationale
                    </h2>
                    <p className="text-xs text-[#6F6355] font-serif italic">Query: "{query}"</p>
                  </div>
                </div>

                <span className="text-[11px] text-[#2C6E49] font-medium bg-[#EEF5F0] px-3 py-1 rounded-full border border-[#D5E6DA]">
                  Grounded in your private journal entries
                </span>
              </div>

              {/* Synthesized Answer */}
              <div>
                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#574B3E] mb-2.5 flex items-center space-x-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#A35C42]" />
                  <span>The Context As You Wrote It</span>
                </h3>
                <div className="rounded-2xl bg-[#FCFAF7] p-6 border border-[#EAE3D6] text-sm sm:text-base text-[#2C241D] leading-relaxed whitespace-pre-line font-serif shadow-2xs">
                  {result.answer}
                </div>
              </div>

              {/* Key Insights */}
              {result.keyInsights && result.keyInsights.length > 0 && (
                <div>
                  <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#574B3E] mb-2.5">
                    What You Were Seeing at the Time
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.keyInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#EAE3D6] bg-white p-4 text-xs text-[#3E3328] flex items-start space-x-2.5 shadow-2xs"
                      >
                        <CheckCircle2 className="h-4 w-4 text-[#C5A059] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cited Connected Journal Fragments */}
              {result.citedMemoryIds && result.citedMemoryIds.length > 0 && (
                <div className="pt-2 border-t border-[#EFE8DC]">
                  <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#574B3E] mb-3 flex items-center space-x-1.5">
                    <Feather className="h-3.5 w-3.5 text-[#244237]" />
                    <span>Journal Fragments Connected to This Rationale ({result.citedMemoryIds.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {result.citedMemoryIds.map((memId) => {
                      const memory = getMemoryById(memId);
                      if (!memory) return null;

                      return (
                        <div
                          key={memId}
                          onClick={() => onOpenMemory(memory)}
                          className="cursor-pointer group rounded-2xl border border-[#E8E1D5] bg-[#FAF8F5] p-4.5 hover:border-[#C7BDB0] hover:bg-white transition-all shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#786C5F] mb-1">
                            <span className="font-semibold text-[#244237]">{memory.category}</span>
                            <span className="font-serif italic">{memory.approximateDate}</span>
                          </div>
                          <h4 className="font-serif text-sm font-bold text-[#222E26] group-hover:text-[#1E3A2F] flex items-center justify-between">
                            <span>{memory.title}</span>
                            <ExternalLink className="h-3.5 w-3.5 text-[#9C8F7F] group-hover:text-[#1E3A2F]" />
                          </h4>
                          <p className="mt-1.5 text-xs text-[#63574A] line-clamp-2 leading-relaxed">
                            {memory.whatHappened}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
