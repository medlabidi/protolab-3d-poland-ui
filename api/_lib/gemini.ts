// api/_lib/gemini.ts — Google Gemini API helper for AI Design Assistant

const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.5-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  maxTokens: 1024,
};

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GeminiRequest {
  contents: GeminiMessage[];
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

const SYSTEM_PROMPT = `You are Pikoro, ProtoLab's AI Design Assistant. You are a specialist in 3D design and CAD. Your role is to help clients define exactly what 3D design they need — either by finding an existing model or by gathering enough detail for a human designer.

IMPORTANT: Design assistance is a STANDALONE service. It is about creating or finding the right 3D file for the client. It is NOT about 3D printing, prototyping, or manufacturing. Do NOT ask about materials, print settings, wall thickness, infill, supports, or anything related to fabrication. Focus purely on the DESIGN itself.

PERSONALITY:
- Sharp, serious, and professional
- You speak concisely — keep responses under 100 words
- Direct and to the point, no filler or unnecessary pleasantries
- Your name is Pikoro — introduce yourself by name in your first message
- Communicate like a human design consultant, not a search engine

CONVERSATION FLOW:
Follow these phases strictly in order.

PHASE 1 — UNDERSTAND (first 2-4 messages):
1. Greet the client, introduce yourself as Pikoro, acknowledge their request
2. Ask ONE question at a time. Never multiple questions in one message.
3. Focus on understanding the design:
   - What does the object look like? Shape, style, features
   - What are the dimensions or size?
   - Any specific details, cutouts, holes, or functional features?
   - Any reference images or designs it should resemble?

PHASE 2 — SUGGEST (after gathering enough info):
1. Search Thingiverse and present results as numbered suggestions
2. Say something like: "I found a few designs that might match what you described. Take a look and tell me which one is closest to your idea."
3. The thumbnails will be shown automatically — just reference them by number
4. Ask the client: "Which one is closest to what you have in mind?"

PHASE 3 — REFINE (after client picks one):
1. Ask: "What's missing from this design? What would you change?"
2. Take their feedback and search again with refined terms
3. Present the new results and ask: "Is this getting closer to your idea?"
4. If YES — keep refining. Ask for more details, search again if needed.
5. If NO or the client seems frustrated — escalate to a human designer immediately. Say something like: "I think this needs a custom approach. Let me connect you with one of our designers who can create exactly what you need."

PHASE 4 — ESCALATE:
Escalate when ANY of these happen:
- The client says the suggestions are not close after 2 rounds
- The design clearly needs custom CAD work from scratch
- The client asks to speak with a human
- You have gathered enough detail for a designer to work from
When escalating, summarize everything you've learned about the design so the designer has full context.

RULES:
- Never promise specific prices or timelines
- Never provide download links — files are preview-only
- Do NOT mention 3D printing, materials, or manufacturing unless the client brings it up
- If the client explicitly asks to speak with a human at any point, escalate immediately

ESCALATION:
When you decide to escalate, include the exact marker [ESCALATE_TO_ADMIN] at the END of your message (after your text to the user).

THINGIVERSE SEARCH:
To search, include this exact format in your response:
[SEARCH_THINGIVERSE: search terms here]
The system will execute the search and attach thumbnail results to your message. You may include up to 2 search commands per response.
Only search AFTER Phase 1 is complete.

FORMAT:
- Plain text only, no markdown headers
- Short paragraphs (2-3 sentences max)
- Number suggestions (1, 2, 3) when presenting search results`;

/**
 * Build design context string from order data
 */
export function buildDesignContext(order: {
  file_name?: string;
  idea_description?: string;
  usage_type?: string;
  approximate_dimensions?: string;
  desired_material?: string;
  attached_files?: any[];
}): string {
  const parts = [
    `[DESIGN REQUEST CONTEXT]`,
    `Project title: ${order.file_name || 'Untitled'}`,
    `Description: ${order.idea_description || 'No description provided'}`,
    `Intended use: ${order.usage_type || 'Not specified'}`,
    `Approximate dimensions: ${order.approximate_dimensions || 'Not specified'}`,
    `Desired material: ${order.desired_material || 'Not specified'}`,
  ];

  if (order.attached_files && order.attached_files.length > 0) {
    parts.push(`Reference files attached: ${order.attached_files.map((f: any) => f.name).join(', ')}`);
  } else {
    parts.push(`Reference files: None`);
  }

  parts.push('', 'Please greet the client and help them refine this design request.');

  return parts.join('\n');
}

/**
 * Build Gemini conversation history from database messages
 */
export function buildGeminiHistory(
  messages: Array<{ sender_type: string; message: string }>,
  designContext: string
): GeminiMessage[] {
  const history: GeminiMessage[] = [];

  // First message: design context as a user turn
  history.push({
    role: 'user',
    parts: [{ text: designContext }],
  });

  // Map conversation messages to Gemini roles
  for (const msg of messages) {
    if (msg.sender_type === 'user') {
      // Merge consecutive same-role messages (Gemini requires alternating roles)
      const last = history[history.length - 1];
      if (last && last.role === 'user') {
        last.parts[0].text += '\n\n' + msg.message;
      } else {
        history.push({
          role: 'user',
          parts: [{ text: msg.message }],
        });
      }
    } else if (msg.sender_type === 'system') {
      // AI's own previous messages
      const last = history[history.length - 1];
      if (last && last.role === 'model') {
        last.parts[0].text += '\n\n' + msg.message;
      } else {
        history.push({
          role: 'model',
          parts: [{ text: msg.message }],
        });
      }
    }
    // 'engineer' messages are skipped — once escalated, AI is out of the loop
  }

  // Gemini requires the last message to be 'user' role
  // If it's 'model', the conversation context is still valid for generateContent
  // but we should ensure it ends with user for proper turn-taking
  return history;
}

/**
 * Generate AI response using Gemini API
 */
export async function generateAIResponse(
  conversationHistory: GeminiMessage[]
): Promise<{ text: string; shouldEscalate: boolean; thingiverseSearches: string[] }> {
  if (!GEMINI_CONFIG.apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const requestBody: GeminiRequest = {
    contents: conversationHistory,
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      maxOutputTokens: GEMINI_CONFIG.maxTokens,
      temperature: 0.7,
    },
  };

  const url = `${GEMINI_CONFIG.baseUrl}/models/${GEMINI_CONFIG.model}:generateContent?key=${GEMINI_CONFIG.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GEMINI] API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = (await response.json()) as GeminiResponse;

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini returned no candidates');
  }

  let text = data.candidates[0].content.parts.map(p => p.text).join('');

  // Extract escalation marker
  const shouldEscalate = text.includes('[ESCALATE_TO_ADMIN]');
  text = text.replace('[ESCALATE_TO_ADMIN]', '').trim();

  // Extract Thingiverse search commands
  const searchRegex = /\[SEARCH_THINGIVERSE:\s*(.+?)\]/g;
  const thingiverseSearches: string[] = [];
  let match;
  while ((match = searchRegex.exec(text)) !== null) {
    thingiverseSearches.push(match[1].trim());
  }
  // Remove search commands from the visible text
  text = text.replace(searchRegex, '').trim();

  console.log('[GEMINI] Response generated:', {
    length: text.length,
    shouldEscalate,
    searchCount: thingiverseSearches.length,
    tokenUsage: data.usageMetadata,
  });

  return { text, shouldEscalate, thingiverseSearches };
}
