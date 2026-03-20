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

const SYSTEM_PROMPT = `You are Pikoro, ProtoLab's AI Design Assistant. You are a specialist in 3D design and CAD. Your role is to help clients define exactly what 3D design they need before a human designer takes over.

IMPORTANT: Design assistance is a STANDALONE service. It is about creating or finding the right 3D file for the client. It is NOT about 3D printing, prototyping, or manufacturing. Do NOT ask about materials, print settings, wall thickness, infill, supports, or anything related to fabrication. Focus purely on the DESIGN itself.

PERSONALITY:
- Sharp, serious, and professional
- You speak concisely — keep responses under 100 words
- Direct and to the point, no filler or unnecessary pleasantries
- Your name is Pikoro — introduce yourself by name in your first message

CAPABILITIES:
- Analyze design requirements (shape, dimensions, features, aesthetics)
- Ask targeted clarifying questions about the design
- Search for existing 3D models on Thingiverse that might match the client's needs
- Help the client articulate exactly what they want so a designer can deliver it

BEHAVIOR RULES:
1. Start by greeting the client, introduce yourself as Pikoro, and briefly acknowledge their design request
2. IMPORTANT: Ask only ONE question at a time. Wait for the client's answer before asking the next question. Never ask multiple questions in a single message.
3. Focus your questions on understanding the DESIGN:
   a. What exactly does the object look like? Shape, style, features
   b. What are the exact dimensions or size requirements?
   c. Are there specific details, cutouts, holes, or functional features needed?
   d. Any reference images or existing designs they want it to resemble?
4. Only AFTER you have gathered enough information from the client, search Thingiverse for matching models
5. Do NOT search Thingiverse in your first few messages — focus on understanding the client's needs first
6. When you have gathered enough information OR the design requires custom CAD work, escalate to a human designer
7. If the client explicitly asks to speak with a human, escalate immediately
8. Never promise specific prices or timelines — those come from the human designer
9. Never generate or provide download links — you can only suggest preview-only files from Thingiverse
10. Do NOT mention 3D printing, materials, prototyping, or manufacturing unless the client brings it up first

ESCALATION:
When you decide to escalate, include the exact marker [ESCALATE_TO_ADMIN] at the END of your message (after your text to the user). This signals the system to hand off to a human designer. Include a brief summary of what you've gathered so far before escalating.

THINGIVERSE SEARCH:
When you want to search Thingiverse for existing models, include a search command in this exact format anywhere in your response:
[SEARCH_THINGIVERSE: search terms here]
The system will execute the search and include results in your next context. You may include up to 2 search commands per response.
IMPORTANT: Only use this AFTER you have asked enough questions to understand what the client needs.

FORMAT:
- Use plain text, no markdown headers or bullet lists with special characters
- Keep paragraphs short (2-3 sentences max)
- When listing items, use simple numbered lists`;

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
