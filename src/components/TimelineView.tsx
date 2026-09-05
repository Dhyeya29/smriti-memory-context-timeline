import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Calendar,
  Sparkles,
  GitCompare,
  Trash2,
  ChevronRight,
  PlusCircle,
  PenLine,
  Feather,
  BookOpen
} from 'lucide-react';
import type { Memory } from '../types';

interface TimelineViewProps {
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  onStartNewMemory: () => void;
  onCompareWithMemory: (memory: Memory) => void;
  onDeleteMemory: (memoryId: string) => Promise<void>;
  onOpenContextRecoveryWithQuery?: (query: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  memories,
  onSelectMemory,
  onStartNewMemory,
  onCompareWithMemory,
  onDeleteMemory,
  onOpenContextRecoveryWithQuery
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = ['All', 'Career', 'Decisions', 'Projects', 'Personal', 'Health', 'Relationships', 'Milestone'];

  const getCategoryBadgeClass = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'career':
        return 'bg-[#EBF2EC] text-[#244237] border-[#D1E0D4]'; // sage
      case 'decisions':
        return 'bg-[#FAF4EB] text-[#7A5B28] border-[#EADFC7]'; // muted ochre
      case 'projects':
        return 'bg-[#F2F5F6] text-[#2C4A57] border-[#D5E1E6]'; // slate-sage
      case 'personal':
        return 'bg-[#FAF5F2] text-[#6E4E3B] border-[#EAE0D7]'; // earthy brown
      case 'health':
        return 'bg-[#F9F1F1] text-[#7D3D47] border-[#EED7D9]'; // dusty rose
      case 'relationships':
        return 'bg-[#FCF5F3] text-[#874A3D] border-[#EED9D3]'; // warm terracotta
      case 'milestone':
        return 'bg-[#F7F4EB] text-[#635520] border-[#E7E2CD]'; // muted gold
      default:
        return 'bg-[#F2EDE4] text-[#554A3E] border-[#E0D7C9]';
    }
  };

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        m.category?.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        m.title.toLowerCase().includes(q) ||
        m.whatHappened.toLowerCase().includes(q) ||
        m.whatChanged.toLowerCase().includes(q) ||
        m.importantContext.toLowerCase().includes(q) ||
        m.tags?.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [memories, searchQuery, selectedCategory]);

  const handleDelete = async (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you wish to remove this reflection from your journal?')) {
      return;
    }
    setDeletingId(memoryId);
    try {
      await onDeleteMemory(memoryId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & New Entry Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E1D5] gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#222E26]">
              My Personal Journey
            </span>
            <span className="rounded-full bg-[#EFE9DF] px-2.5 py-0.5 text-xs font-semibold text-[#66594C] border border-[#DFD6C9]">
              {memories.length} {memories.length === 1 ? 'reflection' : 'reflections'}
            </span>
          </div>
          <p className="text-xs text-[#736556] font-serif italic">
            A quiet chronological record of your decisions, inflection points, and what you learned.
          </p>
        </div>

        <button
          onClick={onStartNewMemory}
          id="timeline-new-memory-btn"
          className="inline-flex items-center space-x-2 rounded-2xl bg-[#1E3A2F] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#FAF8F5] shadow-xs hover:bg-[#284E3F] transition-all self-start sm:self-auto cursor-pointer"
        >
          <PenLine className="h-4 w-4 text-[#E6C594]" />
          <span>Write New Entry</span>
        </button>
      </div>

      {/* Filter and Search Bar with Paper Aesthetics */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9C8F7F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your reflections, lessons, or turning points..."
            className="w-full rounded-2xl border border-[#DFD6C7] bg-white pl-10 pr-4 py-2 text-xs text-[#2D261F] placeholder:text-[#9F9384] focus:border-[#1E3A2F] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1E3A2F] text-[#FAF8F5] shadow-2xs font-semibold'
                  : 'bg-white border border-[#E0D7C9] text-[#645749] hover:bg-[#F5F0E6]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Timeline Journey Stream */}
      <div className="mt-10">
        {memories.length === 0 ? (
          /* Empty state */
          <div className="rounded-3xl border border-dashed border-[#DCD3C4] bg-white p-10 sm:p-16 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0E6] text-[#A35C42]">
              <Feather className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-serif text-xl sm:text-2xl font-bold text-[#243329]">
              Your journal awaits its first story
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[#706253] font-serif italic leading-relaxed">
              Every turning point starts with a simple reflection. Capture a decision, a project you paused, or a change in your philosophy.
            </p>
            <div className="mt-6">
              <button
                onClick={onStartNewMemory}
                className="rounded-2xl bg-[#1E3A2F] px-6 py-3 text-xs sm:text-sm font-semibold text-[#FAF8F5] shadow-xs hover:bg-[#284E3F] transition-colors cursor-pointer"
              >
                Write Your First Reflection
              </button>
            </div>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E1D5] bg-white p-8 text-center text-xs text-[#7A6E60]">
            No reflections match "{searchQuery}" in category "{selectedCategory}".
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-7 before:absolute before:left-2 sm:before:left-3 before:top-4 before:bottom-4 before:w-[2px] before:bg-[#E5DDCF]">
            {filteredMemories.map((memory) => {
              const formattedDate = new Date(memory.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              const badgeColorClass = getCategoryBadgeClass(memory.category);

              return (
                <div key={memory.id} className="relative group">
                  {/* Timeline milestone node */}
                  <div className="absolute -left-6 sm:-left-8 top-5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#1E3A2F] bg-[#FAF8F5] shadow-2xs group-hover:bg-[#1E3A2F] transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A2F] group-hover:bg-[#FAF8F5]"></div>
                  </div>

                  {/* Tactile Paper Memory Card */}
                  <div
                    onClick={() => onSelectMemory(memory)}
                    className="cursor-pointer rounded-3xl border border-[#E8E1D5] bg-white p-5 sm:p-7 shadow-xs hover:border-[#D5CABA] hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EAE0] pb-3.5">
                      <div className="flex items-center space-x-2">
                        <span className={`rounded-lg px-2.5 py-0.5 text-xs font-medium border ${badgeColorClass}`}>
                          {memory.category}
                        </span>
                        {memory.approximateDate && (
                          <span className="text-xs text-[#7B6E5F] flex items-center space-x-1 font-serif italic">
                            <Calendar className="h-3 w-3 text-[#A35C42]" />
                            <span>{memory.approximateDate}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-[#8C8072]">
                        <span>Recorded {formattedDate}</span>
                      </div>
                    </div>

                    <h2 className="mt-3.5 font-serif text-xl sm:text-2xl font-bold text-[#222E26] group-hover:text-[#1E3A2F] transition-colors">
                      {memory.title}
                    </h2>

                    <p className="mt-2 text-xs sm:text-sm text-[#5D5144] line-clamp-2 leading-relaxed">
                      {memory.whatHappened}
                    </p>

                    {/* Turning Point / What Changed Callout */}
                    {memory.whatChanged && (
                      <div className="mt-4 rounded-2xl bg-[#FAF7EF] border border-[#EFE5D1] p-3 text-xs text-[#63491C]">
                        <span className="font-serif font-bold text-[10px] uppercase tracking-wider text-[#8A6324] block mb-1 flex items-center space-x-1">
                          <Sparkles className="h-3 w-3 text-[#C5A059]" />
                          <span>Turning Point & Mindset Shift</span>
                        </span>
                        <p className="line-clamp-2 leading-relaxed font-serif">{memory.whatChanged}</p>
                      </div>
                    )}

                    {/* Card Footer: Tags & Quick Actions */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F2ECE1] pt-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {memory.tags?.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-[#F5F0E6] px-2 py-0.5 text-[10px] font-medium text-[#645648] border border-[#E8DFD3]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompareWithMemory(memory);
                          }}
                          title="Place in Then & Now comparison"
                          className="flex items-center space-x-1 rounded-xl px-2.5 py-1 text-xs font-medium text-[#685A4C] hover:bg-[#F5F0E6] hover:text-[#243329] transition-colors"
                        >
                          <GitCompare className="h-3.5 w-3.5 text-[#887B6D]" />
                          <span className="hidden sm:inline">Compare</span>
                        </button>

                        <button
                          onClick={(e) => handleDelete(e, memory.id)}
                          disabled={deletingId === memory.id}
                          title="Remove from journal"
                          className="rounded-xl p-1.5 text-[#A39686] hover:bg-[#F9ECEC] hover:text-[#8C3A46] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <span className="flex items-center space-x-1 text-xs font-semibold text-[#1E3A2F] pl-2 group-hover:translate-x-0.5 transition-transform">
                          <span>Open Entry</span>
                          <ChevronRight className="h-3.5 w-3.5 text-[#1E3A2F]" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
