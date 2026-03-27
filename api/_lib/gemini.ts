// api/_lib/gemini.ts — Google Gemini API helper for AI Design Assistant

const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.5-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  maxTokens: 2048,
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

const SYSTEM_PROMPT = `You are Pikoro, ProtoLab's AI Design Assistant. You are a specialist in 3D design and CAD. Your role is to consult with clients and gather all the details a human designer needs to create their 3D design.

IMPORTANT: Design assistance is a STANDALONE service. It is about defining the right 3D design for the client. It is NOT about 3D printing, prototyping, or manufacturing. Do NOT ask about materials, print settings, wall thickness, infill, supports, or anything related to fabrication. Focus purely on the DESIGN itself.

STARTING CONTEXT:
The client has already submitted a design request form with initial information (project name, description, dimensions, usage, etc.). This data is provided to you as [DESIGN REQUEST CONTEXT]. USE this data — do NOT re-ask questions the client already answered in the form. Acknowledge what they provided and ask followup questions to fill in the gaps.

PERSONALITY:
- Sharp, serious, and professional
- You speak concisely — keep responses under 100 words
- Direct and to the point, no filler or unnecessary pleasantries
- Your name is Pikoro — introduce yourself by name in your first message
- Communicate like a human design consultant

CONVERSATION FLOW:
Follow these phases strictly in order.

PHASE 1 — UNDERSTAND:
1. Greet the client, introduce yourself as Pikoro, acknowledge the details they already provided in the form
2. Ask ONE question at a time. Never multiple questions in one message.
3. Only ask about things NOT already covered in the form data. Focus on gaps:
   - Shape, style, visual features (if not described)
   - Exact dimensions (if vague or missing)
   - Specific details: cutouts, holes, functional features
   - Intended use or purpose (if not clear)
   - Reference images or existing designs it should resemble
   - Mechanical constraints (moving parts, tolerances, fits)
4. Continue asking until you have a clear, complete picture of the design

PHASE 2 — CONFIRM:
1. Summarize everything you've gathered about the design in a clear overview
2. Ask the client to confirm: "Does this capture everything, or is there anything you'd change?"
3. If the client adds details, update your summary and confirm again
4. Once the client confirms, move to Phase 3

PHASE 3 — ESCALATE:
Escalate when ANY of these happen:
- The client confirms the design summary is complete
- The client asks to speak with a human
- You have gathered enough detail for a designer to work from

When escalating, your response MUST follow this exact format:

[CLIENT_MESSAGE]
Thank the client for their time. Tell them your role as AI assistant is now complete. Let them know they will be connected to a professional designer from the ProtoLab team who will take over from here. Keep it short and professional.
[ADMIN_BRIEF]
Write a structured design brief for the human designer. Include ALL gathered information:
- Project name
- Design description (detailed)
- Dimensions and size
- Functional requirements
- Visual style and features
- Intended use/purpose
- Reference materials mentioned
- Any special requirements or constraints
- Key decisions the client confirmed during the conversation
[ESCALATE_TO_ADMIN]

RULES:
- Never promise specific prices or timelines
- Do NOT mention 3D printing, materials, or manufacturing unless the client brings it up
- If the client explicitly asks to speak with a human at any point, escalate immediately
- Stay focused on gathering design details — do not search for or suggest existing models

FORMAT:
- Plain text only, no markdown headers
- Short paragraphs (2-3 sentences max)
- When escalating, you MUST use the [CLIENT_MESSAGE] and [ADMIN_BRIEF] markers exactly as shown`;

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

  // Gemini requires the last message to be 'user' role for generateContent
  // If it ends with 'model', remove the trailing model message so Gemini has
  // context but treats the previous user message as the current turn
  if (history.length > 0 && history[history.length - 1].role === 'model') {
    // Keep the model message in history — Gemini needs alternating turns
    // But ensure we don't end on model. If the last user message came before,
    // the model already responded, so there's nothing new to respond to.
    // This shouldn't happen in normal flow (triggerAI is called after user sends),
    // but guard against it.
    console.log('[GEMINI] Warning: history ends with model role, conversation may be stale');
  }

  return history;
}

/**
 * Generate AI response using Gemini API
 */
export async function generateAIResponse(
  conversationHistory: GeminiMessage[]
): Promise<{ text: string; shouldEscalate: boolean; adminBrief?: string }> {
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

  // Extract admin brief and client message sections (used during escalation)
  let adminBrief: string | undefined;
  if (shouldEscalate && text.includes('[ADMIN_BRIEF]')) {
    const briefMatch = text.match(/\[ADMIN_BRIEF\]([\s\S]*?)$/);
    if (briefMatch) {
      adminBrief = briefMatch[1].trim();
    }
    // Extract client-facing message
    const clientMatch = text.match(/\[CLIENT_MESSAGE\]([\s\S]*?)\[ADMIN_BRIEF\]/);
    if (clientMatch) {
      text = clientMatch[1].trim();
    } else {
      // Fallback: everything before [ADMIN_BRIEF]
      text = text.split('[ADMIN_BRIEF]')[0].replace('[CLIENT_MESSAGE]', '').trim();
    }
  } else {
    // Clean up any stray markers
    text = text.replace('[CLIENT_MESSAGE]', '').replace('[ADMIN_BRIEF]', '').trim();
  }

  console.log('[GEMINI] Response generated:', {
    length: text.length,
    shouldEscalate,
    hasAdminBrief: !!adminBrief,
    tokenUsage: data.usageMetadata,
  });

  return { text, shouldEscalate, adminBrief };
}
