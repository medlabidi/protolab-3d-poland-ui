// api/_lib/gemini.ts — Google Gemini API helper for AI Design Assistant (with Groq fallback)

const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.0-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  maxTokens: 2048,
};

const GROQ_CONFIG = {
  apiKey: process.env.GROQ_API_KEY || '',
  model: 'llama-3.3-70b-versatile',
  baseUrl: 'https://api.groq.com/openai/v1',
  maxTokens: 2048,
};

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
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

interface MessageWithAttachments {
  sender_type: string;
  message: string;
  attachments?: any[];
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB limit for inline_data

/**
 * Fetch an image from a URL and return base64 data + mime type.
 * Returns null if the image can't be fetched or is too large.
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[GEMINI] Failed to fetch image:', url, response.status);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mimeType = IMAGE_MIME_TYPES.find(m => contentType.includes(m)) || 'image/jpeg';

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMAGE_SIZE) {
      console.log('[GEMINI] Image too large, skipping:', url, buffer.length);
      return null;
    }

    return { data: buffer.toString('base64'), mimeType };
  } catch (err) {
    console.error('[GEMINI] Error fetching image:', url, err);
    return null;
  }
}

/**
 * Check if a file is an image based on its mime_type or name
 */
function isImageFile(file: any): boolean {
  if (file.mime_type && IMAGE_MIME_TYPES.some(m => file.mime_type.includes(m))) return true;
  if (file.type && IMAGE_MIME_TYPES.some(m => file.type.includes(m))) return true;
  const name = (file.name || file.original_name || '').toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp)$/.test(name);
}

const SYSTEM_PROMPT = `You are Pikoro, ProtoLab's AI Design Assistant. You are a specialist in 3D design and CAD. Your role is to consult with clients and gather all the details a human designer needs to create their 3D design.

IMPORTANT: Design assistance is a STANDALONE service. It is about defining the right 3D design for the client. It is NOT about 3D printing, prototyping, or manufacturing. Do NOT ask about materials, print settings, wall thickness, infill, supports, or anything related to fabrication. Focus purely on the DESIGN itself.

STARTING CONTEXT:
The client has already submitted a design request form with initial information (project name, description, dimensions, usage, etc.). This data is provided to you as [DESIGN REQUEST CONTEXT]. USE this data — do NOT re-ask questions the client already answered in the form. Acknowledge what they provided and ask followup questions to fill in the gaps.

IMAGES:
You can see images! When the client uploads reference images (either in the initial form or during the conversation), they will appear inline. Analyze them carefully — describe what you see and use the visual details to inform the design discussion. If the image is a reference for the design, acknowledge it and note relevant visual elements (shape, proportions, style, features).

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
The FIRST line of the brief MUST be one of these classification tags:
[DECORATIVE] — use this if the design is a decorative object: figurines, statues, ornamental items, display pieces, artistic models, trophies, decorative accessories, miniatures, sculptures
[FUNCTIONAL] — use this if the design is a functional/mechanical object: enclosures, brackets, gears, tools, mounts, cases, parts with tolerances, mechanical components, structural items

Then write a structured design brief for the human designer. Include ALL gathered information:
- Project name
- Design description (detailed)
- Dimensions and size
- Functional requirements
- Visual style and features
- Intended use/purpose
- Reference materials mentioned (note: reference images are attached for the designer to see)
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
 * Build design context string from order data.
 * Returns both the text context and any image URLs from attached files.
 */
export function buildDesignContext(order: {
  file_name?: string;
  idea_description?: string;
  usage_type?: string;
  approximate_dimensions?: string;
  desired_material?: string;
  attached_files?: any[];
}): { text: string; imageUrls: string[] } {
  const parts = [
    `[DESIGN REQUEST CONTEXT]`,
    `Project title: ${order.file_name || 'Untitled'}`,
    `Description: ${order.idea_description || 'No description provided'}`,
    `Intended use: ${order.usage_type || 'Not specified'}`,
    `Approximate dimensions: ${order.approximate_dimensions || 'Not specified'}`,
    `Desired material: ${order.desired_material || 'Not specified'}`,
  ];

  const imageUrls: string[] = [];

  if (order.attached_files && order.attached_files.length > 0) {
    const imageFiles = order.attached_files.filter(isImageFile);
    const otherFiles = order.attached_files.filter(f => !isImageFile(f));

    if (imageFiles.length > 0) {
      parts.push(`Reference images attached: ${imageFiles.length} image(s) — see below`);
      imageUrls.push(...imageFiles.map((f: any) => f.url).filter(Boolean));
    }
    if (otherFiles.length > 0) {
      parts.push(`Other files attached: ${otherFiles.map((f: any) => f.name).join(', ')}`);
    }
    if (imageFiles.length === 0 && otherFiles.length === 0) {
      parts.push(`Reference files attached: ${order.attached_files.map((f: any) => f.name).join(', ')}`);
    }
  } else {
    parts.push(`Reference files: None`);
  }

  parts.push('', 'Please greet the client and help them refine this design request.');

  return { text: parts.join('\n'), imageUrls };
}

/**
 * Build Gemini conversation history from database messages.
 * Now includes image attachments as inline_data parts.
 */
export async function buildGeminiHistory(
  messages: MessageWithAttachments[],
  designContext: { text: string; imageUrls: string[] }
): Promise<GeminiMessage[]> {
  const history: GeminiMessage[] = [];

  // First message: design context + form reference images as a user turn
  const contextParts: GeminiPart[] = [{ text: designContext.text }];

  // Fetch and include form reference images
  for (const url of designContext.imageUrls) {
    const imgData = await fetchImageAsBase64(url);
    if (imgData) {
      contextParts.push({ inline_data: { mime_type: imgData.mimeType, data: imgData.data } });
    }
  }

  history.push({ role: 'user', parts: contextParts });

  // Map conversation messages to Gemini roles
  for (const msg of messages) {
    // Extract image URLs from attachments
    const imageAttachments: string[] = [];
    if (msg.attachments && Array.isArray(msg.attachments)) {
      for (const att of msg.attachments) {
        if (att.url && isImageFile(att)) {
          imageAttachments.push(att.url);
        }
      }
    }

    if (msg.sender_type === 'user') {
      const userParts: GeminiPart[] = [{ text: msg.message || '(image attached)' }];

      // Fetch conversation images inline
      for (const url of imageAttachments) {
        const imgData = await fetchImageAsBase64(url);
        if (imgData) {
          userParts.push({ inline_data: { mime_type: imgData.mimeType, data: imgData.data } });
        }
      }

      // Merge consecutive user messages
      const last = history[history.length - 1];
      if (last && last.role === 'user') {
        last.parts.push({ text: '\n\n' + (msg.message || '') });
        // Add images from this message too
        for (const part of userParts) {
          if ('inline_data' in part) last.parts.push(part);
        }
      } else {
        history.push({ role: 'user', parts: userParts });
      }
    } else if (msg.sender_type === 'system') {
      // AI's own previous messages (text only — model doesn't send images)
      const last = history[history.length - 1];
      if (last && last.role === 'model') {
        last.parts.push({ text: '\n\n' + msg.message });
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
  if (history.length > 0 && history[history.length - 1].role === 'model') {
    console.log('[GEMINI] Warning: history ends with model role, conversation may be stale');
  }

  return history;
}

/**
 * Convert Gemini message history to OpenAI/Groq chat format (text only, images dropped).
 */
function geminiToGroqMessages(
  systemPrompt: string,
  history: GeminiMessage[]
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  for (const msg of history) {
    const textParts = msg.parts
      .filter((p): p is { text: string } => 'text' in p)
      .map(p => p.text);
    if (textParts.length > 0) {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: textParts.join('\n'),
      });
    }
  }
  return messages;
}

/**
 * Call Groq API as fallback when Gemini is rate-limited.
 */
async function callGroq(
  systemPrompt: string,
  history: GeminiMessage[],
  maxTokens: number,
  temperature: number,
): Promise<string> {
  const messages = geminiToGroqMessages(systemPrompt, history);

  const response = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_CONFIG.model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[GROQ] API error:', response.status, errText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate AI response using Gemini API, with Groq fallback on rate limit
 */
export async function generateAIResponse(
  conversationHistory: GeminiMessage[]
): Promise<{ text: string; shouldEscalate: boolean; adminBrief?: string; model?: string }> {
  if (!GEMINI_CONFIG.apiKey && !GROQ_CONFIG.apiKey) {
    throw new Error('No AI API key configured (set GEMINI_API_KEY or GROQ_API_KEY)');
  }

  let text: string | null = null;
  let model: string = 'unknown';

  // Try Gemini first (if key available)
  if (GEMINI_CONFIG.apiKey) {
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

    if (response.ok) {
      const data = (await response.json()) as GeminiResponse;
      if (data.candidates && data.candidates.length > 0) {
        text = data.candidates[0].content.parts.map(p => p.text).join('');
        model = `Gemini ${GEMINI_CONFIG.model}`;
        console.log('[GEMINI] Response generated, length:', text.length);
      }
    } else {
      const errorText = await response.text();
      console.error('[GEMINI] API error:', response.status, errorText);
      if (response.status !== 429) {
        // Non-rate-limit error with no Groq fallback → throw
        if (!GROQ_CONFIG.apiKey) {
          throw new Error(`Gemini API error: ${response.status}`);
        }
      }
    }
  }

  // Fallback to Groq if Gemini failed or was rate-limited
  if (text === null && GROQ_CONFIG.apiKey) {
    console.log('[GROQ] Using Groq fallback...');
    text = await callGroq(SYSTEM_PROMPT, conversationHistory, GROQ_CONFIG.maxTokens, 0.7);
    model = `Groq ${GROQ_CONFIG.model}`;
    console.log('[GROQ] Fallback response generated, length:', text.length);
  }

  if (text === null) {
    throw new Error('AI rate limit reached and no fallback available.');
  }

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

  console.log('[AI] Final response:', {
    length: text.length,
    shouldEscalate,
    hasAdminBrief: !!adminBrief,
  });

  return { text, shouldEscalate, adminBrief, model };
}
