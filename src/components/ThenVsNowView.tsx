import React, { useState } from 'react';
import {
  GitCompare,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Calendar,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  Feather,
  Compass,
  Lightbulb,
  Split
} from 'lucide-react';
import type { Memory, ThenVsNowResult } from '../types';
import { runThenVsNowComparison } from '../services/api';

interface ThenVsNowViewProps {
  memories: Memory[];
  preSelectedMemory?: Memory | null;
  onNavigateToRecord: () => void;
}

export const ThenVsNowView: React.FC<ThenVsNowViewProps> = ({
  memories,
  preSelectedMemory,
  onNavigateToRecord
}) => {
  // Sort memories chronologically (oldest to newest)
  const chronologicalMemories = [...memories].sort((a, b) => a.createdAt - b.createdAt);

  const [thenMemoryId, setThenMemoryId] = useState<string>(
    preSelectedMemory ? preSelectedMemory.id : chronologicalMemories[0]?.id || ''
  );
  const [nowMemoryId, setNowMemoryId] = useState<string>(
    chronologicalMemories.length > 1
      ? chronologicalMemories[chronologicalMemories.length - 1]?.id
      : ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ThenVsNowResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const thenMemory = memories.find((m) => m.id === thenMemoryId);
  const nowMemory = memories.find((m) => m.id === nowMemoryId);

  const handleCompare = async () => {
    if (!thenMemory || !nowMemory) {
      setError('Please select two distinct journal entries to compare.');
      return;
    }

    if (thenMemory.id === nowMemory.id) {
      setError('Please select two different journal entries for a meaningful Then & Now comparison.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await runThenVsNowComparison(thenMemory, nowMemory);
      setResult(res.comparison);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to generate comparison. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#E8E1D5]">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#A35C42] mb-1.5">
          <Split className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>Longitudinal Growth & Mindset</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#222E26]">
          Then & Now
        </h1>
        <p className="text-xs sm:text-sm text-[#6E5F51] font-serif italic mt-1 max-w-2xl leading-relaxed">
          Open two chapters of your life side-by-side. See how your goals, mindset, and wisdom have evolved across time.
        </p>
      </div>

      {memories.length < 2 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-[#DCD3C4] bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F0E6] text-[#A35C42] mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#243329]">
            At least two journal entries required
          </h3>
          <p className="text-xs sm:text-sm text-[#736556] font-serif italic max-w-md mx-auto mt-1 mb-5">
            You currently have {memories.length} entry preserved. Add another turning point or reflection to compare your trajectory.
          </p>
          <button
            onClick={onNavigateToRecord}
            className="rounded-2xl bg-[#1E3A2F] px-5 py-2.5 text-xs font-semibold text-[#FAF8F5] shadow-xs hover:bg-[#284E3F] transition-colors cursor-pointer"
          >
            Write Another Entry
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          {/* Two-Column Open-Book Selectors */}
          <div className="paper-card-warm rounded-3xl p-6 sm:p-8 shadow-xs border border-[#E8E1D5]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Center dividing spine on desktop */}
              <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[#E5DCD0]"></div>

              {/* LEFT: THEN SELECTOR */}
              <div className="space-y-3 md:pr-4">
                <div className="flex items-center space-x-2">
                  <span className="rounded-lg bg-[#EFE9DF] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#574B3E] border border-[#DFD5C6]">
                    Page 1: THEN (The Past)
                  </span>
                </div>

                <select
                  value={thenMemoryId}
                  onChange={(e) => setThenMemoryId(e.target.value)}
                  className="w-full rounded-xl border border-[#DCD2C3] bg-white px-3.5 py-2.5 text-xs font-medium text-[#2E251E] focus:outline-none focus:border-[#1E3A2F]"
                >
                  {memories.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.approximateDate ? `[${m.approximateDate}] ` : ''}{m.title}
                    </option>
                  ))}
                </select>

                {thenMemory && (
                  <div className="rounded-2xl bg-white p-4 border border-[#EAE2D5] text-xs text-[#5C4F41] space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#244237]">
                      <span>{thenMemory.category}</span>
                      <span className="font-serif italic text-[#8A7D6F]">{thenMemory.approximateDate}</span>
                    </div>
                    <p className="line-clamp-2 italic text-[#44382C] font-serif">"{thenMemory.whatHappened}"</p>
                  </div>
                )}
              </div>

              {/* RIGHT: NOW SELECTOR */}
              <div className="space-y-3 md:pl-4">
                <div className="flex items-center space-x-2">
                  <span className="rounded-lg bg-[#EBF2EC] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#244237] border border-[#D5E4D8]">
                    Page 2: NOW (The Present)
                  </span>
                </div>

                <select
                  value={nowMemoryId}
                  onChange={(e) => setNowMemoryId(e.target.value)}
                  className="w-full rounded-xl border border-[#DCD2C3] bg-white px-3.5 py-2.5 text-xs font-medium text-[#2E251E] focus:outline-none focus:border-[#1E3A2F]"
                >
                  {memories.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.approximateDate ? `[${m.approximateDate}] ` : ''}{m.title}
                    </option>
                  ))}
                </select>

                {nowMemory && (
                  <div className="rounded-2xl bg-white p-4 border border-[#EAE2D5] text-xs text-[#5C4F41] space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#244237]">
                      <span>{nowMemory.category}</span>
                      <span className="font-serif italic text-[#8A7D6F]">{nowMemory.approximateDate}</span>
                    </div>
                    <p className="line-clamp-2 italic text-[#44382C] font-serif">"{nowMemory.whatHappened}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compare Trigger Button */}
            <div className="mt-8 flex justify-center pt-4 border-t border-[#EDE5D8]">
              <button
                onClick={handleCompare}
                disabled={isLoading || !thenMemoryId || !nowMemoryId || thenMemoryId === nowMemoryId}
                id="run-compare-btn"
                className="flex items-center space-x-2.5 rounded-2xl bg-[#1E3A2F] px-8 py-3 text-xs sm:text-sm font-semibold text-[#FAF8F5] shadow-xs hover:bg-[#284E3F] disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[#E6C594]" />
                <span>{isLoading ? 'Comparing Chapters...' : 'Compare Trajectory Across Time'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 rounded-2xl bg-[#FBF1F1] border border-[#ECD1D1] p-4 text-xs text-[#823B47]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#A34757]" />
              <span>{error}</span>
            </div>
          )}

          {/* Open-Book Comparison Layout */}
          {result && !isLoading && (
            <div className="paper-card rounded-3xl p-6 sm:p-10 shadow-sm border border-[#E8E1D5] space-y-8">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE8DC] pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#222E26]">
                    Chapter Comparison
                  </h2>
                  <p className="text-xs sm:text-sm text-[#706253] font-serif italic mt-0.5">
                    Contrasting "{thenMemory?.title}" with "{nowMemory?.title}"
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[#244237] bg-[#EEF5F0] px-3 py-1 rounded-full border border-[#D5E6DA]">
                  Synthesized Trajectory
                </span>
              </div>

              {/* Side-by-Side Open Book Pages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[#E8E1D5]"></div>

                {/* LEFT: THEN */}
                <div className="rounded-3xl border border-[#E8E1D5] bg-[#FCFAF7] p-6 space-y-5 shadow-2xs">
                  <div className="border-b border-[#EFE8DC] pb-3">
                    <span className="rounded-lg bg-[#EFE9DF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5E5142]">
                      THEN
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#222E26] mt-2">
                      {thenMemory?.title}
                    </h3>
                    <p className="text-xs text-[#8A7D6F] font-serif italic">{thenMemory?.approximateDate}</p>
                  </div>

                  <div>
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#695B4D] mb-1.5 flex items-center space-x-1">
                      <Compass className="h-3.5 w-3.5 text-[#A35C42]" />
                      <span>Goals at the Time</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[#3D3328]">
                      {result.thenSummary.goals.map((g, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-[#A35C42] font-bold">•</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#695B4D] mb-1.5">
                      Context & Pressures
                    </h4>
                    <p className="text-xs text-[#44382C] leading-relaxed bg-white p-3.5 rounded-2xl border border-[#EAE2D5] font-serif">
                      {result.thenSummary.context}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#695B4D] mb-1.5">
                      Challenges Faced
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[#3D3328]">
                      {result.thenSummary.challenges.map((c, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-[#8C3A46] font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* RIGHT: NOW */}
                <div className="rounded-3xl border border-[#D5E4D8] bg-[#F4F8F5] p-6 space-y-5 shadow-2xs">
                  <div className="border-b border-[#DDECE0] pb-3">
                    <span className="rounded-lg bg-[#244237] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FAF8F5]">
                      NOW
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#1E3A2F] mt-2">
                      {nowMemory?.title}
                    </h3>
                    <p className="text-xs text-[#4D6D5C] font-serif italic">{nowMemory?.approximateDate}</p>
                  </div>

                  <div>
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#244237] mb-1.5 flex items-center space-x-1">
                      <TrendingUp className="h-3.5 w-3.5 text-[#244237]" />
                      <span>Current Direction</span>
                    </h4>
                    <p className="text-xs text-[#1E3A2F] leading-relaxed bg-white p-3.5 rounded-2xl border border-[#D2E2D5] font-serif font-medium">
                      {result.nowSummary.currentDirection}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#244237] mb-1.5">
                      Progress Achieved
                    </h4>
                    <p className="text-xs text-[#294235] leading-relaxed bg-white p-3.5 rounded-2xl border border-[#D2E2D5] font-serif">
                      {result.nowSummary.progress}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#244237] mb-1.5">
                      New Challenges
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[#244237]">
                      {result.nowSummary.newChallenges.map((nc, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="text-[#C5A059] font-bold">•</span>
                          <span>{nc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Below: What Stayed the Same, What Changed, What You Learned */}
              <div className="space-y-5 pt-4 border-t border-[#EFE8DC]">
                {/* 1. What Changed (Key Inflections) */}
                <div className="rounded-3xl border border-[#EFE5D1] bg-[#FAF7EF] p-6 sm:p-7 shadow-2xs">
                  <div className="flex items-center space-x-2 text-[#8A6324] text-xs font-serif font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="h-4 w-4 text-[#C5A059]" />
                    <span>What Changed (Mindset Inflection & Trajectory Shifts)</span>
                  </div>

                  <ul className="space-y-2 text-xs sm:text-sm text-[#3E3120] font-serif">
                    {result.whatChanged.importantChanges.map((change, i) => (
                      <li key={i} className="flex items-start space-x-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#2C6E49] shrink-0 mt-0.5" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-[#ECE0C7]">
                    <div className="rounded-2xl bg-white p-4 border border-[#EAE0CB]">
                      <h5 className="text-[11px] font-bold text-[#8A6324] uppercase tracking-wider mb-1 font-serif">
                        Mindset Shift
                      </h5>
                      <p className="text-xs text-[#524434] leading-relaxed font-serif">
                        {result.whatChanged.mindsetShift}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 border border-[#EAE0CB]">
                      <h5 className="text-[11px] font-bold text-[#6B5E4F] uppercase tracking-wider mb-1 font-serif">
                        Unforeseen Developments
                      </h5>
                      <p className="text-xs text-[#524434] leading-relaxed font-serif">
                        {result.whatChanged.unforeseenDevelopments}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Lessons & Reflection */}
                <div className="rounded-3xl border border-[#E8E1D5] bg-[#FCFAF7] p-6 text-xs text-[#5C4F41] flex items-start space-x-3">
                  <Lightbulb className="h-5 w-5 text-[#C5A059] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-serif font-bold text-sm text-[#243329]">Reflection on Your Journey</span>
                    <p className="leading-relaxed font-serif italic text-xs sm:text-sm text-[#685A4D]">
                      Every turning point was a step in shaping your clarity. Looking back from where you stand today shows that what felt like uncertainty was actually the beginning of your current strength.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
