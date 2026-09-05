import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  subscribeToUserMemories,
  deleteUserMemory,
  saveUserMemory,
  checkRedirectResult
} from './firebase';
import type { AuthenticatedUser, Memory } from './types';
import { Navbar, type ActiveTab } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { TimelineView } from './components/TimelineView';
import { RecordMemoryView } from './components/RecordMemoryView';
import { ContextRecoveryView } from './components/ContextRecoveryView';
import { ThenVsNowView } from './components/ThenVsNowView';
import { MemoryDetailModal } from './components/MemoryDetailModal';

export default function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // App Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');

  // Memories State
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  // Detail Modal & Cross-Component Linking
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [preSelectedCompareMemory, setPreSelectedCompareMemory] = useState<Memory | null>(null);
  const [contextRecoveryInitialQuery, setContextRecoveryInitialQuery] = useState<string>('');

  // Listen to Firebase Auth state and check for resolved redirects
  useEffect(() => {
    // Safely check if returning from any redirect flow without throwing
    checkRedirectResult().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
      } else {
        setUser(null);
        setMemories([]);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user's memories when authenticated
  useEffect(() => {
    if (!user) return;

    setIsLoadingMemories(true);
    setMemoryError(null);

    const unsubscribe = subscribeToUserMemories(
      user.uid,
      (fetchedMemories) => {
        setMemories(fetchedMemories);
        setIsLoadingMemories(false);
      },
      (err) => {
        console.error('Failed to subscribe to memories:', err);
        setMemoryError('Could not load memories from Cloud Firestore.');
        setIsLoadingMemories(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in window was closed.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Popups are blocked by your browser in this preview frame. Please allow popups or use "Open in New Tab".');
      } else if (err.code === 'auth/unauthorized-domain') {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setAuthError(`Domain unauthorized: "${hostname}" must be added to Firebase Console > Authentication > Settings > Authorized domains.`);
      } else if (err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
        setAuthError('Cross-origin authentication was blocked in this preview iframe (browser cookie/storage restrictions). Please use "Open in New Tab" to sign in.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setActiveTab('timeline');
      setSelectedMemory(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!user) return;
    try {
      await deleteUserMemory(user.uid, memoryId);
      if (selectedMemory?.id === memoryId) {
        setSelectedMemory(null);
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert('Could not delete memory: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCompareFromTimeline = (memory: Memory) => {
    setPreSelectedCompareMemory(memory);
    setSelectedMemory(null);
    setActiveTab('then-vs-now');
  };

  const handleOpenContextRecovery = (query: string) => {
    setContextRecoveryInitialQuery(query);
    setSelectedMemory(null);
    setActiveTab('recovery');
  };

  // Seed sample starter memories to help user immediately experience Smriti's power
  const handleSeedStarterMemories = async () => {
    if (!user) return;
    const now = Date.now();

    const sample1: Partial<Memory> = {
      id: `mem_sample_1_${now}`,
      userId: user.uid,
      title: 'Deciding to leave BigTech to build open-source tools',
      approximateDate: 'April 2024',
      category: 'Career',
      whatHappened: 'Formally handed in resignation as Staff Engineer after 4 years at enterprise cloud company. Transitioned to independent open-source research and software craft.',
      importantContext: 'Experiencing severe cognitive drag from 25+ hours of meetings per week. Had accumulated 14 months of emergency living runway. Spouse supported the experiment.',
      goalsOrDecisions: 'Chose intellectual autonomy over stock equity vesting cliff. Defined success as shipping 2 foundational developer tools within 12 months.',
      whatChanged: 'Shifted from optimizing for corporate hierarchy to sovereign scheduling and high-density creative output.',
      whatRemainsUnclear: 'Can independent sponsorship and micro-grants become self-sustaining before the 14-month runway burns down?',
      keyLessons: [
        'Cognitive sovereignty is worth more than incremental compensation after baseline safety.',
        'Having an explicit 12-month review date prevents perpetual anxiety.'
      ],
      tags: ['Career', 'Sovereignty', 'OpenSource', 'Risk'],
      conversation: [
        {
          id: '1',
          role: 'user',
          content: 'I finally gave notice at work yesterday to work on open-source.',
          timestamp: now - 86400000 * 2
        },
        {
          id: '2',
          role: 'model',
          content: 'That is a momentous decision. What was the exact moment or conversation that tipped you over the edge?',
          timestamp: now - 86400000 * 2 + 1000
        },
        {
          id: '3',
          role: 'user',
          content: 'I sat in an architecture review where 14 people argued about naming conventions for 2 hours. I realized my best cognitive hours were being eaten by corporate inertia.',
          timestamp: now - 86400000 * 2 + 2000
        }
      ],
      createdAt: now - 86400000 * 30,
      updatedAt: now - 86400000 * 30
    };

    const sample2: Partial<Memory> = {
      id: `mem_sample_2_${now}`,
      userId: user.uid,
      title: 'Halting the AI Newsletter after 18 weekly editions',
      approximateDate: 'November 2024',
      category: 'Projects',
      whatHappened: 'Decided to shut down the weekly newsletter despite growing to 3,400 active subscribers.',
      importantContext: 'Writing the newsletter felt reactive and shallow. Every Sunday was consumed by panic-reading Twitter and summarizing other people’s news.',
      goalsOrDecisions: 'Shut it down completely instead of monetizing with low-quality sponsored ads or using automated scrapers.',
      whatChanged: 'Reclaimed my Sundays; eliminated the underlying dread of weekly deadlines. Freed up energy for deep codebase building.',
      whatRemainsUnclear: 'Could the audience have been gently converted to long-form monthly essays instead of total shutdown?',
      keyLessons: [
        'An audience that requires low-integrity curation to sustain is a liability, not an asset.',
        'It is better to quit early than let resentment poison your creative energy.'
      ],
      tags: ['Creative', 'Newsletter', 'Boundaries', 'Projects'],
      conversation: [
        {
          id: '1',
          role: 'user',
          content: 'I decided to kill the newsletter today even though subscriber count was at an all-time high.',
          timestamp: now - 86400000 * 5
        },
        {
          id: '2',
          role: 'model',
          content: 'Stopping something when the vanity metrics look great takes real clarity. What were you sacrificing to keep publishing it?',
          timestamp: now - 86400000 * 5 + 1000
        }
      ],
      createdAt: now - 86400000 * 10,
      updatedAt: now - 86400000 * 10
    };

    try {
      await saveUserMemory(user.uid, sample1.id!, sample1);
      await saveUserMemory(user.uid, sample2.id!, sample2);
    } catch (err) {
      console.error('Failed to seed memories:', err);
    }
  };

  // Initial loading screen while checking auth
  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] text-[#2C241D]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1E3A2F] border-t-[#C5A059] mx-auto"></div>
          <p className="font-serif text-sm font-semibold tracking-wide text-[#5C4F41]">
            Opening Smriti Journal...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display Landing Page
  if (!user) {
    return (
      <LandingPage
        onSignIn={handleSignIn}
        isLoading={isSigningIn}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C241D] flex flex-col selection:bg-[#EAE0D2] selection:text-[#1E3A2F] font-sans">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
        memoryCount={memories.length}
      />

      {/* Main Dashboard Area */}
      <main className="flex-1 pb-16">
        {/* Helper banner if user has 0 memories to seed example data */}
        {memories.length === 0 && activeTab === 'timeline' && (
          <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-3xl bg-[#FAF6EE] border border-[#E8DFCE] p-5 text-xs text-[#524434] shadow-2xs">
              <div>
                <span className="font-serif font-bold text-sm text-[#243329]">Welcome to your private journal, {user.displayName || 'friend'}</span>
                <p className="text-[#6E6152] font-serif italic mt-0.5">
                  Begin by writing your first reflection or load sample memories to explore the timeline, Context Recovery, and Then & Now comparisons.
                </p>
              </div>
              <button
                onClick={handleSeedStarterMemories}
                className="shrink-0 rounded-2xl bg-[#1E3A2F] px-4 py-2 font-semibold text-[#FAF8F5] hover:bg-[#284E3F] transition-colors cursor-pointer shadow-2xs"
              >
                Load Sample Reflections
              </button>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            memories={memories}
            onSelectMemory={(m) => setSelectedMemory(m)}
            onStartNewMemory={() => setActiveTab('record')}
            onCompareWithMemory={handleCompareFromTimeline}
            onDeleteMemory={handleDeleteMemory}
            onOpenContextRecoveryWithQuery={handleOpenContextRecovery}
          />
        )}

        {activeTab === 'record' && (
          <RecordMemoryView
            userId={user.uid}
            onMemorySaved={(id) => {
              setActiveTab('timeline');
            }}
            onCancel={() => setActiveTab('timeline')}
          />
        )}

        {activeTab === 'recovery' && (
          <ContextRecoveryView
            memories={memories}
            onOpenMemory={(m) => setSelectedMemory(m)}
            onNavigateToRecord={() => setActiveTab('record')}
            initialQuery={contextRecoveryInitialQuery}
          />
        )}

        {activeTab === 'then-vs-now' && (
          <ThenVsNowView
            memories={memories}
            preSelectedMemory={preSelectedCompareMemory}
            onNavigateToRecord={() => setActiveTab('record')}
          />
        )}
      </main>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
          onCompare={handleCompareFromTimeline}
          onAskContextRecovery={handleOpenContextRecovery}
        />
      )}
    </div>
  );
}
