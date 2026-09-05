import { getValidIdToken } from '../firebase';
import type {
  ConversationMessage,
  StructuredMemoryDraft,
  ContextRecoveryResult,
  ThenVsNowResult,
  Memory
} from '../types';

async function authenticatedFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidIdToken();

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errorDetail;
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorDetail || `API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * Send a message in a multi-turn conversation with Gemini during memory recording
 */
export async function sendMemoryChatMessage(
  history: Array<{ role: 'user' | 'model'; content: string }>,
  message: string,
  title?: string
): Promise<{ reply: string }> {
  return authenticatedFetch<{ reply: string }>('/api/memory/chat', {
    method: 'POST',
    body: JSON.stringify({ history, message, title })
  });
}

/**
 * Synthesize a full conversation into a structured memory
 */
export async function synthesizeMemory(
  history: Array<{ role: 'user' | 'model'; content: string }>,
  notes?: string
): Promise<{ summary: StructuredMemoryDraft }> {
  return authenticatedFetch<{ summary: StructuredMemoryDraft }>('/api/memory/synthesize', {
    method: 'POST',
    body: JSON.stringify({ history, notes })
  });
}

/**
 * Context Recovery query against user memories
 */
export async function recoverContext(
  query: string,
  memories: Memory[]
): Promise<{ recovery: ContextRecoveryResult }> {
  return authenticatedFetch<{ recovery: ContextRecoveryResult }>('/api/context-recovery', {
    method: 'POST',
    body: JSON.stringify({ query, memories })
  });
}

/**
 * Compare two memories (Then vs Now)
 */
export async function runThenVsNowComparison(
  thenMemory: Memory,
  nowMemory: Memory
): Promise<{ comparison: ThenVsNowResult }> {
  return authenticatedFetch<{ comparison: ThenVsNowResult }>('/api/then-vs-now', {
    method: 'POST',
    body: JSON.stringify({ thenMemory, nowMemory })
  });
}
