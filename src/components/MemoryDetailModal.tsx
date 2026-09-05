import React, { useState } from 'react';
import {
  X,
  Calendar,
  Tag,
  MessageSquare,
  Sparkles,
  GitCompare,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Compass,
  BookOpen,
  Feather,
  Clock
} from 'lucide-react';
import type { Memory } from '../types';

interface MemoryDetailModalProps {
  memory: Memory;
  onClose: () => void;
  onCompare: (memory: Memory) => void;
  onAskContextRecovery: (initialQuery: string) => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  memory,
  onClose,
  onCompare,
  onAskContextRecovery
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#241F1A]/60 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#FAF8F5] shadow-2xl border border-[#E0D6C8] overflow-hidden">
        {/* Journal Header */}
        <div className="flex items-start justify-between p-6 sm:p-7 border-b border-[#EAE1D5] bg-[#F7F3EB]">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="rounded-lg bg-[#EAE2D5] px-2.5 py-0.5 text-xs font-semibold text-[#544638]">
                {memory.category}
              </span>
              {memory.approximateDate && (
                <span className="text-xs text-[#7A6D5E] flex items-center space-x-1 font-serif italic">
                  <Calendar className="h-3.5 w-3.5 text-[#A35C42]" />
                  <span>{memory.approximateDate}</span>
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#222E26]">
              {memory.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#887A6B] hover:bg-[#EAE1D5] hover:text-[#2A231C] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switchers: Journal Entry vs Interview Dialogue */}
        <div className="flex border-b border-[#EAE1D5] bg-white px-6 sm:px-7">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 text-xs font-serif font-bold tracking-wide border-b-2 mr-6 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#7F7162] hover:text-[#382D22]'
            }`}
          >
            Crystallized Journal Record
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center space-x-1.5 py-3 text-xs font-serif font-bold tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === 'transcript'
                ? 'border-[#1E3A2F] text-[#1E3A2F]'
                : 'border-transparent text-[#7F7162] hover:text-[#382D22]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#A35C42]" />
            <span>Original Dialogue ({memory.conversation?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-sm text-[#382E25] space-y-6">
          {activeTab === 'summary' ? (
            <div className="space-y-6">
              {/* 1. What Happened */}
              <div>
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#736453] mb-1.5 flex items-center space-x-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#A35C42]" />
                  <span>1. What Happened</span>
                </h3>
                <p className="text-[#2C231A] leading-relaxed bg-white p-5 rounded-2xl border border-[#E8DFD3] font-serif shadow-2xs">
                  {memory.whatHappened || 'No narrative recorded.'}
                </p>
              </div>

              {/* 2. Important Context */}
              <div>
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#736453] mb-1.5 flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#8C6D38]" />
                  <span>2. Important Context (Environment & Pressures)</span>
                </h3>
                <p className="text-[#2C231A] leading-relaxed bg-white p-5 rounded-2xl border border-[#E8DFD3] font-serif shadow-2xs">
                  {memory.importantContext || 'No background context recorded.'}
                </p>
              </div>

              {/* 3. Goals or Decisions */}
              <div>
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#244237] mb-1.5 flex items-center space-x-1.5">
                  <Compass className="h-3.5 w-3.5 text-[#2C6E49]" />
                  <span>3. Goals or Decisions Involved</span>
                </h3>
                <p className="text-[#1A3328] leading-relaxed bg-[#F4F8F5] p-5 rounded-2xl border border-[#D5E4D8] font-serif font-medium shadow-2xs">
                  {memory.goalsOrDecisions || 'No explicit decision specified.'}
                </p>
              </div>

              {/* 4. What Changed */}
              <div className="rounded-2xl border border-[#EFE5D1] bg-[#FAF7EF] p-5 shadow-2xs">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#8A6324] mb-1.5 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>4. What Changed (Inflection & Mindset Shift)</span>
                </h3>
                <p className="text-[#3A2B15] leading-relaxed font-serif">
                  {memory.whatChanged || 'None recorded.'}
                </p>
              </div>

              {/* 5. What Remains Unclear */}
              <div className="rounded-2xl border border-[#F0DFDF] bg-[#FAF5F5] p-5 shadow-2xs">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#8C3A46] mb-1.5 flex items-center space-x-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-[#A34757]" />
                  <span>5. What Remains Unclear</span>
                </h3>
                <p className="text-[#4E242B] leading-relaxed font-serif">
                  {memory.whatRemainsUnclear || 'No unresolved questions noted.'}
                </p>
              </div>

              {/* Key Lessons */}
              {memory.keyLessons && memory.keyLessons.length > 0 && (
                <div>
                  <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#736453] mb-2 flex items-center space-x-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-[#C5A059]" />
                    <span>Key Lessons & Insights</span>
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#43372B] bg-white p-5 rounded-2xl border border-[#E8DFD3] shadow-2xs">
                    {memory.keyLessons.map((lesson, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-[#C5A059] font-bold">•</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {memory.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-[#EFE9DF] px-2.5 py-1 text-xs font-medium text-[#5B4E41] border border-[#E2D8CA]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Original Dialogue Transcript */
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F7F3EB] border border-[#E8DFD3] p-4 text-xs text-[#6F604F] font-serif italic flex items-center space-x-2">
                <Feather className="h-4 w-4 text-[#A35C42] shrink-0" />
                <span>The multi-turn dialogue conducted with Smriti to uncover and crystallize this memory.</span>
              </div>

              {memory.conversation && memory.conversation.length > 0 ? (
                memory.conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-white border border-[#E8E1D5] text-[#2C241D] font-serif shadow-2xs'
                          : 'bg-[#F4F7F4] border border-[#DCE6DE] text-[#244237]'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1 font-semibold text-[11px] opacity-75">
                        <span>{msg.role === 'user' ? 'You' : 'Smriti'}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#8A7D6F] italic">No dialogue preserved for this entry.</p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6 border-t border-[#EAE1D5] bg-[#F7F3EB]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onCompare(memory)}
              className="flex items-center space-x-1.5 rounded-xl border border-[#D5CAB9] bg-white px-3.5 py-2 text-xs font-semibold text-[#544638] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            >
              <GitCompare className="h-3.5 w-3.5 text-[#7F7162]" />
              <span>Compare in Then & Now</span>
            </button>

            <button
              onClick={() =>
                onAskContextRecovery(`What led up to my decision in "${memory.title}" and how did it unfold?`)
              }
              className="flex items-center space-x-1.5 rounded-xl border border-[#D5E4D8] bg-[#EEF5F0] px-3.5 py-2 text-xs font-semibold text-[#244237] hover:bg-[#E3EFE6] transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>Look Back with Smriti</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-[#1E3A2F] px-5 py-2 text-xs font-semibold text-[#FAF8F5] hover:bg-[#284E3F] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
