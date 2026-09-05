import { GoogleGenAI, Type } from '@google/genai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import fs from 'fs';
import path from 'path';

let cachedApiKey: string | null = null;
let aiClientInstance: GoogleGenAI | null = null;

// Currently recommended Gemini models for modern text and reasoning:
// Defaults to gemini-3.6-flash (recommended by the Gemini API), with gemini-3.8-flash support
export const RECOMMENDED_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
export const FALLBACK_GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Retrieves the Gemini API key securely:
 * 1. Checks process.env.GEMINI_API_KEY (automatically populated or injected by Cloud Secret Manager / Cloud Run)
 * 2. Checks local dev configuration file (../.dev.env.json or ./.dev.env.json) if running in dev environment
 * 3. If specified, queries Google Cloud Secret Manager for a secret version
 * 4. Fallback to process.env.API_KEY
 */
export async function getGeminiApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  // 1. Direct environment variable (injected from Secret Manager in Cloud Run / AI Studio)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    cachedApiKey = process.env.GEMINI_API_KEY.trim();
    return cachedApiKey;
  }

  // 2. Dev environment secret file fallback
  try {
    const parentDevEnv = path.resolve(process.cwd(), '../.dev.env.json');
    if (fs.existsSync(parentDevEnv)) {
      const parsed = JSON.parse(fs.readFileSync(parentDevEnv, 'utf8'));
      if (parsed.GEMINI_API_KEY && typeof parsed.GEMINI_API_KEY === 'string') {
        cachedApiKey = parsed.GEMINI_API_KEY.trim();
        return cachedApiKey;
      }
    }
    const localDevEnv = path.resolve(process.cwd(), '.dev.env.json');
    if (fs.existsSync(localDevEnv)) {
      const parsed = JSON.parse(fs.readFileSync(localDevEnv, 'utf8'));
      if (parsed.GEMINI_API_KEY && typeof parsed.GEMINI_API_KEY === 'string') {
        cachedApiKey = parsed.GEMINI_API_KEY.trim();
        return cachedApiKey;
      }
    }
  } catch (err: any) {
    console.warn('Dev environment file lookup notice:', err.message);
  }

  // 3. Secret Manager lookup if secret name is configured
  const secretName = process.env.GEMINI_SECRET_NAME || process.env.GCP_SECRET_NAME;
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  if (secretName && projectId) {
    try {
      const client = new SecretManagerServiceClient();
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();
      if (payload) {
        cachedApiKey = payload.trim();
        return cachedApiKey;
      }
    } catch (err: any) {
      console.warn('Secret Manager retrieval note:', err.message);
    }
  }

  // 4. Fallback to process.env.API_KEY if present
  if (process.env.API_KEY) {
    cachedApiKey = process.env.API_KEY.trim();
    return cachedApiKey;
  }

  throw new Error('GEMINI_API_KEY is not configured in environment or Secret Manager.');
}

export async function getGeminiClient(): Promise<GoogleGenAI> {
  if (!aiClientInstance) {
    const apiKey = await getGeminiApiKey();
    aiClientInstance = new GoogleGenAI({ apiKey });
  }
  return aiClientInstance;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Extracts plain text from an Interaction response safely,
 * handling both .output_text and iterating steps.
 */
function extractInteractionText(interaction: any): string {
  if (interaction?.output_text && typeof interaction.output_text === 'string') {
    return interaction.output_text.trim();
  }
  let fullOutput = '';
  if (Array.isArray(interaction?.steps)) {
    for (const step of interaction.steps) {
      if (step.type === 'model_output' && Array.isArray(step.content)) {
        for (const item of step.content) {
          if (item.type === 'text' && item.text) {
            fullOutput += item.text;
          }
        }
      }
    }
  }
  return fullOutput.trim();
}

/**
 * Safely extracts and parses JSON from model output,
 * handling raw JSON or markdown-wrapped JSON code blocks.
 */
function parseJsonSafe<T>(rawText: string): T {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const codeBlockMatch =
      trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) ||
      trimmed.match(/([\{\[][\s\S]*[\}\]])/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
    throw new Error(`Failed to parse structured JSON from model response: ${trimmed.slice(0, 150)}`);
  }
}

/**
 * Multi-turn conversation helper for memory recording using the Interactions API
 */
export async function generateMemoryConversationReply(
  history: ChatMessage[],
  newMessage: string,
  userGivenTitle?: string
): Promise<string> {
  const ai = await getGeminiClient();

  const systemInstruction = `You are "Smriti", an empathetic, curious, and incisive personal biographer and context keeper.
Your mission is to help the user capture not just a superficial log of an event or decision, but the DEEP PERSONAL CONTEXT that people inevitably forget over time.

When the user describes an experience, decision, change, or event:
1. Validate what they shared warmly and concisely.
2. Ask 1 or 2 targeted, high-value follow-up questions that probe for:
   - The emotional baseline: How did you feel before and during this?
   - The unstated assumptions: What were you taking for granted that might prove wrong later?
   - The fork in the road: What alternatives did you reject, and why?
   - The trigger/context: What specific moment or catalyst pushed this decision/event?
   - The expected outcome: What did you hope or fear would happen next?
3. Keep your questions thoughtful, brief (1-3 short paragraphs max), and avoid overwhelming them.
4. Let the user answer at their own pace. Do not wrap up too quickly; encourage depth while respecting when they feel complete.`;

  const contextParts: string[] = [];
  if (userGivenTitle) {
    contextParts.push(`Topic/Title: "${userGivenTitle}"`);
  }

  if (history.length > 0) {
    const formattedHistory = history
      .map((m) => `${m.role === 'model' ? 'Smriti' : 'User'}: ${m.content}`)
      .join('\n\n');
    contextParts.push(`Conversation History:\n${formattedHistory}`);
  }

  contextParts.push(`User: ${newMessage}\n\nRespond as Smriti:`);
  const input = contextParts.join('\n\n');

  try {
    const interaction = await ai.interactions.create({
      model: RECOMMENDED_GEMINI_MODEL,
      input,
      system_instruction: systemInstruction,
      generation_config: {
        max_output_tokens: 1000,
      }
    });

    const reply = extractInteractionText(interaction);
    return reply || "I hear you. Could you tell me more about what led up to this moment?";
  } catch (err: any) {
    if (FALLBACK_GEMINI_MODEL && FALLBACK_GEMINI_MODEL !== RECOMMENDED_GEMINI_MODEL) {
      console.warn(`Interactions API retry with fallback model ${FALLBACK_GEMINI_MODEL}:`, err.message);
      const fallbackInteraction = await ai.interactions.create({
        model: FALLBACK_GEMINI_MODEL,
        input,
        system_instruction: systemInstruction,
        generation_config: {
          max_output_tokens: 1000,
        }
      });
      const fallbackReply = extractInteractionText(fallbackInteraction);
      return fallbackReply || "I hear you. Could you tell me more about what led up to this moment?";
    }
    throw err;
  }
}

/**
 * Generates the structured summary for a completed memory using the Interactions API
 */
export async function generateStructuredMemorySummary(
  history: ChatMessage[],
  userNotes?: string
): Promise<{
  title: string;
  approximateDate: string;
  category: string;
  whatHappened: string;
  importantContext: string;
  goalsOrDecisions: string;
  whatChanged: string;
  whatRemainsUnclear: string;
  keyLessons: string[];
  tags: string[];
}> {
  const ai = await getGeminiClient();

  const conversationTranscript = history
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const prompt = `Analyze this personal reflection and memory conversation between the user and Smriti.
Synthesize it into a structured personal context archive according to the required schema.

CONVERSATION TRANSCRIPT:
${conversationTranscript}

${userNotes ? `ADDITIONAL USER NOTES:\n${userNotes}` : ''}

Extract accurately and thoughtfully.
- whatHappened: A clear, objective narrative of the event, decision, or situation.
- approximateDate: The date, time period, season, or year extracted from the context (e.g., "October 2023", "Spring 2024", "Yesterday").
- importantContext: The background circumstances, constraints, emotional atmosphere, or external pressure.
- goalsOrDecisions: The specific decisions made, resolutions, or goals articulated.
- whatChanged: The turning point, mindset shift, or before-and-after change.
- whatRemainsUnclear: Open dilemmas, pending results, uncertainties, or unresolved questions for the future.
- keyLessons: 2 to 4 bullet points summarizing personal takeaways.
- tags: 3 to 6 keyword tags (e.g., ["Career", "Relocation", "Burnout", "Tech"]).
- category: One of: ["Career", "Personal", "Decisions", "Projects", "Health", "Relationships", "Milestone"].
- title: A compelling, memorable title (5-10 words).`;

  const responseFormat = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      approximateDate: { type: Type.STRING },
      category: { type: Type.STRING },
      whatHappened: { type: Type.STRING },
      importantContext: { type: Type.STRING },
      goalsOrDecisions: { type: Type.STRING },
      whatChanged: { type: Type.STRING },
      whatRemainsUnclear: { type: Type.STRING },
      keyLessons: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: [
      'title',
      'approximateDate',
      'category',
      'whatHappened',
      'importantContext',
      'goalsOrDecisions',
      'whatChanged',
      'whatRemainsUnclear',
      'keyLessons',
      'tags'
    ]
  };

  try {
    const interaction = await ai.interactions.create({
      model: RECOMMENDED_GEMINI_MODEL,
      input: prompt,
      response_format: responseFormat,
    });
    return parseJsonSafe(extractInteractionText(interaction));
  } catch (err: any) {
    if (FALLBACK_GEMINI_MODEL && FALLBACK_GEMINI_MODEL !== RECOMMENDED_GEMINI_MODEL) {
      console.warn(`Structured summary retry with fallback model ${FALLBACK_GEMINI_MODEL}:`, err.message);
      const fallbackInteraction = await ai.interactions.create({
        model: FALLBACK_GEMINI_MODEL,
        input: prompt,
        response_format: responseFormat,
      });
      return parseJsonSafe(extractInteractionText(fallbackInteraction));
    }
    throw err;
  }
}

/**
 * Context Recovery Engine using the Interactions API:
 * Answers complex questions about the user's personal past using exclusively their authenticated memories.
 */
export async function recoverUserContext(
  query: string,
  userMemories: any[]
): Promise<{
  answer: string;
  citedMemoryIds: string[];
  keyInsights: string[];
}> {
  const ai = await getGeminiClient();

  const formattedMemories = userMemories.map((m) => ({
    id: m.id,
    title: m.title,
    date: m.approximateDate || m.createdAt,
    category: m.category,
    whatHappened: m.whatHappened,
    importantContext: m.importantContext,
    goalsOrDecisions: m.goalsOrDecisions,
    whatChanged: m.whatChanged,
    whatRemainsUnclear: m.whatRemainsUnclear,
    keyLessons: m.keyLessons
  }));

  const systemInstruction = `You are Smriti's Context Recovery Engine.
The user is asking a reflective question to recover lost personal context from their own recorded history (e.g., "Why did I stop working on this?", "How did my goals change?", "What happened before this decision?").

RULES:
1. Base your answer EXCLUSIVELY on the provided authentic memories recorded by the user. Do not hallucinate outside events.
2. Structure your response clearly:
   - Direct synthesized answer addressing their question.
   - Chronological trajectory of events and mindset shifts.
   - The underlying rationale or catalyst as documented in their own words.
3. List the memory IDs that were directly relevant in "citedMemoryIds".
4. Provide 2-4 distilled "keyInsights".`;

  const prompt = `USER QUESTION: "${query}"

RECORDED PERSONAL MEMORIES (CHRONOLOGICAL ARCHIVE):
${JSON.stringify(formattedMemories, null, 2)}

Provide a thorough, grounded context recovery analysis in JSON format.`;

  const responseFormat = {
    type: Type.OBJECT,
    properties: {
      answer: { type: Type.STRING },
      citedMemoryIds: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      keyInsights: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ['answer', 'citedMemoryIds', 'keyInsights']
  };

  try {
    const interaction = await ai.interactions.create({
      model: RECOMMENDED_GEMINI_MODEL,
      input: prompt,
      system_instruction: systemInstruction,
      response_format: responseFormat,
    });
    return parseJsonSafe(extractInteractionText(interaction));
  } catch (err: any) {
    if (FALLBACK_GEMINI_MODEL && FALLBACK_GEMINI_MODEL !== RECOMMENDED_GEMINI_MODEL) {
      console.warn(`Context recovery retry with fallback model ${FALLBACK_GEMINI_MODEL}:`, err.message);
      const fallbackInteraction = await ai.interactions.create({
        model: FALLBACK_GEMINI_MODEL,
        input: prompt,
        system_instruction: systemInstruction,
        response_format: responseFormat,
      });
      return parseJsonSafe(extractInteractionText(fallbackInteraction));
    }
    throw err;
  }
}

/**
 * Then vs Now Comparison using the Interactions API:
 * Compares two selected memories or time periods.
 */
export async function compareThenVsNow(
  thenMemory: any,
  nowMemory: any
): Promise<{
  thenSummary: {
    goals: string[];
    context: string;
    challenges: string[];
  };
  nowSummary: {
    currentDirection: string;
    progress: string;
    newChallenges: string[];
  };
  whatChanged: {
    importantChanges: string[];
    mindsetShift: string;
    unforeseenDevelopments: string;
  };
}> {
  const ai = await getGeminiClient();

  const prompt = `Compare these two personal memory snapshots from the user's life:

--- "THEN" MEMORY ---
Title: ${thenMemory.title}
Date/Time: ${thenMemory.approximateDate}
Category: ${thenMemory.category}
What Happened: ${thenMemory.whatHappened}
Context: ${thenMemory.importantContext}
Goals/Decisions: ${thenMemory.goalsOrDecisions}
What Changed: ${thenMemory.whatChanged}
What Remained Unclear: ${thenMemory.whatRemainsUnclear}

--- "NOW" MEMORY ---
Title: ${nowMemory.title}
Date/Time: ${nowMemory.approximateDate}
Category: ${nowMemory.category}
What Happened: ${nowMemory.whatHappened}
Context: ${nowMemory.importantContext}
Goals/Decisions: ${nowMemory.goalsOrDecisions}
What Changed: ${nowMemory.whatChanged}
What Remained Unclear: ${nowMemory.whatRemainsUnclear}

Conduct a rigorous, empathetic, and insightful comparison across:
1. THEN:
   - Goals at the time
   - Context & baseline
   - Challenges faced back then
2. NOW:
   - Current direction
   - Concrete progress achieved
   - New challenges that emerged
3. WHAT CHANGED:
   - Important changes based on the user's recorded memories
   - Mindset or philosophical shift
   - Unforeseen developments or surprises`;

  const responseFormat = {
    type: Type.OBJECT,
    properties: {
      thenSummary: {
        type: Type.OBJECT,
        properties: {
          goals: { type: Type.ARRAY, items: { type: Type.STRING } },
          context: { type: Type.STRING },
          challenges: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['goals', 'context', 'challenges']
      },
      nowSummary: {
        type: Type.OBJECT,
        properties: {
          currentDirection: { type: Type.STRING },
          progress: { type: Type.STRING },
          newChallenges: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['currentDirection', 'progress', 'newChallenges']
      },
      whatChanged: {
        type: Type.OBJECT,
        properties: {
          importantChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
          mindsetShift: { type: Type.STRING },
          unforeseenDevelopments: { type: Type.STRING }
        },
        required: ['importantChanges', 'mindsetShift', 'unforeseenDevelopments']
      }
    },
    required: ['thenSummary', 'nowSummary', 'whatChanged']
  };

  try {
    const interaction = await ai.interactions.create({
      model: RECOMMENDED_GEMINI_MODEL,
      input: prompt,
      response_format: responseFormat,
    });
    return parseJsonSafe(extractInteractionText(interaction));
  } catch (err: any) {
    if (FALLBACK_GEMINI_MODEL && FALLBACK_GEMINI_MODEL !== RECOMMENDED_GEMINI_MODEL) {
      console.warn(`Then vs Now retry with fallback model ${FALLBACK_GEMINI_MODEL}:`, err.message);
      const fallbackInteraction = await ai.interactions.create({
        model: FALLBACK_GEMINI_MODEL,
        input: prompt,
        response_format: responseFormat,
      });
      return parseJsonSafe(extractInteractionText(fallbackInteraction));
    }
    throw err;
  }
}
