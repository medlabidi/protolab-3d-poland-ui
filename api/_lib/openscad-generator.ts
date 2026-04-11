// api/_lib/openscad-generator.ts — OpenSCAD code generation for functional parts

const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.0-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  maxTokens: 16384,
};

const GROQ_CONFIG = {
  apiKey: process.env.GROQ_API_KEY || '',
  model: 'llama-3.3-70b-versatile',
  baseUrl: 'https://api.groq.com/openai/v1',
  maxTokens: 4096,
};

// --- Parameter types (adapted from CADAM) ---

export type ParameterType = 'string' | 'number' | 'boolean';

export interface ParameterRange {
  min?: number;
  max?: number;
  step?: number;
}

export interface ParameterOption {
  value: string | number;
  label: string;
}

export interface Parameter {
  name: string;
  displayName: string;
  value: string | boolean | number;
  defaultValue: string | boolean | number;
  type?: ParameterType;
  description?: string;
  range?: ParameterRange;
  options?: ParameterOption[];
}

// --- System prompt for OpenSCAD code generation ---

const OPENSCAD_SYSTEM_PROMPT = `You are a CAD engineer that creates OpenSCAD models for 3D printing.
Given a design brief for a functional part, generate OpenSCAD code that:

RULES:
- Is syntactically correct OpenSCAD and produces a manifold, 3D-printable object
- Uses parameterized variables declared at the TOP of the file before any modules
- All dimensions must be variables, never hard-coded numbers in geometry calls
- Include appropriate tolerances for functional parts (e.g. 0.2mm clearance for fits)
- Use $fn for resolution control, default $fn = 60
- Do NOT include color() calls
- Make sure all parts are connected as one solid 3D printable object using union/difference/intersection
- Orient the model for optimal 3D printing (flat base on XY plane)
- Add inline comments for parameter ranges where useful, e.g.: wall_thickness = 2; // [1:0.5:5]
- Keep designs simple and concise. Avoid overly complex geometry that requires hundreds of lines.
- Prefer built-in OpenSCAD primitives (cube, cylinder, sphere) and CSG operations over custom math.

OPENSCAD LANGUAGE RULES (CRITICAL):
- There is NO built-in PI constant. If you need pi, define it: PI = 3.14159265359;
- sin(), cos(), tan() take DEGREES, not radians. Do NOT convert to radians.
  Example: cos(20) gives cosine of 20 degrees. NEVER do cos(angle * PI / 180).
- atan2(y, x) returns degrees
- Use "for" loops, not "foreach"
- String concatenation uses str(): str("text", variable)
- Conditional assignment: x = condition ? val_a : val_b;
- Module calls do NOT use "new". Just: my_module();
- Boolean operators: && || ! (not "and" "or" "not")
- Exponentiation: pow(base, exp) or use ^
- Variables are single-assignment in each scope. Do NOT reassign variables.
- linear_extrude() and rotate_extrude() are built-in. Use them for 2D-to-3D.
- polygon() takes a vector of [x,y] points for 2D shapes.
- Do NOT use features from other languages (Python, JavaScript, etc.)

PARAMETER FORMAT:
- Declare all parameters at the top of the file
- Use descriptive variable names with underscores: bracket_width, hole_diameter
- Add a comment above each parameter describing what it does
- For range hints, use inline comment after semicolon: // [min:step:max]
- For option hints, use inline comment: // [val1, val2, val3]

EXAMPLE STRUCTURE:
// Width of the bracket
bracket_width = 40; // [20:5:100]
// Height of the bracket
bracket_height = 30; // [15:5:80]
// Wall thickness
wall_thickness = 3; // [1:0.5:6]
// Mounting hole diameter
hole_diameter = 5; // [3:0.5:10]
// Resolution
$fn = 60;

module bracket() {
    difference() {
        // main body
        cube([bracket_width, bracket_height, wall_thickness]);
        // mounting holes
        translate([10, bracket_height/2, -1])
            cylinder(h=wall_thickness+2, d=hole_diameter);
    }
}

bracket();

RESPONSE FORMAT:
Return ONLY raw OpenSCAD code. No markdown code fences, no explanations, no text before or after the code.
If the request is not about a 3D design, return only: 404`;

// --- Parse parameters from OpenSCAD code (ported from CADAM) ---

function convertType(rawValue: string): { value: string | number | boolean; type: ParameterType } {
  const trimmed = rawValue.trim();

  // Boolean
  if (trimmed === 'true') return { value: true, type: 'boolean' };
  if (trimmed === 'false') return { value: false, type: 'boolean' };

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { value: parseFloat(trimmed), type: 'number' };
  }

  // String (quoted)
  if (/^".*"$/.test(trimmed)) {
    return { value: trimmed.slice(1, -1), type: 'string' };
  }

  // Default to string
  return { value: trimmed, type: 'string' };
}

export function parseParameters(script: string): Parameter[] {
  // Only scan the top of the file — stop at first module or function definition
  const topSection = script.split(/^(module |function )/m)[0];

  const parameters: Parameter[] = [];
  const seen = new Set<string>();
  const lines = topSection.split('\n');

  const paramRegex = /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);[\t ]*(?:\/\/(.*))?$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(paramRegex);
    if (!match) continue;

    const [, name, rawValue, inlineComment] = match;
    if (seen.has(name)) continue;

    try {
      const { value, type } = convertType(rawValue);
      const param: Parameter = {
        name,
        displayName: name === '$fn' ? 'Resolution' : name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value,
        defaultValue: value,
        type,
      };

      // Parse description from comment on line above
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        if (prevLine.startsWith('//')) {
          param.description = prevLine.replace(/^\/\/\s*/, '');
        }
      }

      // Parse inline comment for range/options
      if (inlineComment) {
        const comment = inlineComment.trim();

        // Range: [min:step:max] or [min:max]
        const rangeMatch = comment.match(/^\[([^,\[\]]+):([^,\[\]]+)(?::([^,\[\]]+))?\]$/);
        if (rangeMatch) {
          if (rangeMatch[3] !== undefined) {
            // [min:step:max]
            param.range = {
              min: parseFloat(rangeMatch[1]),
              step: parseFloat(rangeMatch[2]),
              max: parseFloat(rangeMatch[3]),
            };
          } else {
            // [min:max]
            param.range = {
              min: parseFloat(rangeMatch[1]),
              max: parseFloat(rangeMatch[2]),
            };
          }
        }

        // Options: [val1, val2, val3]
        const optionsMatch = comment.match(/^\[([^\]]+)\]$/);
        if (optionsMatch && !rangeMatch) {
          const opts = optionsMatch[1].split(',').map(s => s.trim());
          param.options = opts.map(opt => {
            const colonIdx = opt.indexOf(':');
            if (colonIdx > -1) {
              return { value: opt.substring(0, colonIdx).trim(), label: opt.substring(colonIdx + 1).trim() };
            }
            const numVal = parseFloat(opt);
            return { value: isNaN(numVal) ? opt : numVal, label: opt };
          });
        }

        // Pure number = step value
        if (/^\d+(\.\d+)?$/.test(comment) && !rangeMatch && !optionsMatch) {
          param.range = { step: parseFloat(comment) };
        }
      }

      seen.add(name);
      parameters.push(param);
    } catch {
      // Skip parameters we can't parse
    }
  }

  return parameters;
}

// --- Apply parameter changes to OpenSCAD code (regex patching) ---

export function applyParameterChanges(
  code: string,
  updates: Array<{ name: string; value: string | number | boolean }>
): string {
  let result = code;
  for (const { name, value } of updates) {
    const escapedName = name.replace(/\$/g, '\\$');
    const regex = new RegExp(
      `^(${escapedName}\\s*=\\s*)([^;]+)(;.*)$`,
      'm'
    );
    const serialized = typeof value === 'string' ? `"${value}"` : String(value);
    result = result.replace(regex, `$1${serialized}$3`);
  }
  return result;
}

// --- Generate OpenSCAD code via Gemini ---

export async function generateOpenSCADCode(
  prompt: string
): Promise<{ code: string; parameters: Parameter[] }> {
  if (!GEMINI_CONFIG.apiKey && !GROQ_CONFIG.apiKey) {
    throw new Error('No AI API key configured (set GEMINI_API_KEY or GROQ_API_KEY)');
  }

  // Truncate prompt to avoid 413 payload errors on Groq
  const truncatedPrompt = prompt.length > 4000 ? prompt.substring(0, 4000) + '\n...(truncated)' : prompt;
  const userMessage = `Design brief for a functional 3D-printable part:\n\n${truncatedPrompt}`;
  let code: string | null = null;

  // Try Gemini first
  if (GEMINI_CONFIG.apiKey) {
    const url = `${GEMINI_CONFIG.baseUrl}/models/${GEMINI_CONFIG.model}:generateContent?key=${GEMINI_CONFIG.apiKey}`;
    const requestBody = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: OPENSCAD_SYSTEM_PROMPT }] },
      generationConfig: { maxOutputTokens: GEMINI_CONFIG.maxTokens, temperature: 0.3 },
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (response.ok) {
      const data: any = await response.json();
      if (data.candidates?.length > 0) {
        code = data.candidates[0].content.parts.map((p: any) => p.text).join('');
        console.log('[OPENSCAD] Gemini response, length:', code!.length);
      }
    } else {
      const errorText = await response.text();
      console.error('[OPENSCAD] Gemini API error:', response.status, errorText);
      if (response.status !== 429 && !GROQ_CONFIG.apiKey) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
    }
  }

  // Fallback to Groq
  if (code === null && GROQ_CONFIG.apiKey) {
    console.log('[OPENSCAD] Using Groq fallback...');
    const groqResponse = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_CONFIG.model,
        messages: [
          { role: 'system', content: OPENSCAD_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: GROQ_CONFIG.maxTokens,
        temperature: 0.3,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('[OPENSCAD] Groq API error:', groqResponse.status, errText);
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData: any = await groqResponse.json();
    code = groqData.choices?.[0]?.message?.content || '';
    console.log('[OPENSCAD] Groq fallback response, length:', code!.length);
  }

  if (code === null) {
    throw new Error('AI rate limit reached and no fallback available.');
  }

  // Robust cleanup: strip markdown fences, preamble text, trailing explanations
  // Handle various fence formats: ```openscad, ```scad, ```SCAD, ```OpenSCAD, plain ```
  code = code.replace(/^[\s\S]*?```(?:openscad|scad|OPENSCAD|SCAD)?\s*\n/i, '');
  code = code.replace(/\n```[\s\S]*$/, '');

  // If no fences were found but there's preamble text before the first variable/comment/module,
  // try to extract just the OpenSCAD code
  if (!code.match(/^[\s]*(?:\/\/|\/\*|\$|[a-zA-Z_][\w]*\s*=|module\s|function\s|use\s|include\s)/m)) {
    // Look for the first line that looks like OpenSCAD code
    const lines = code.split('\n');
    const codeStart = lines.findIndex(l =>
      /^(?:\/\/|\/\*|\$|[a-zA-Z_][\w]*\s*=|module\s|function\s|use\s|include\s|cube|sphere|cylinder|union|difference|intersection)/.test(l.trim())
    );
    if (codeStart > 0) {
      code = lines.slice(codeStart).join('\n');
    }
  }

  // Remove any trailing explanation text after the last semicolon or closing brace
  const lastSemiOrBrace = Math.max(code.lastIndexOf(';'), code.lastIndexOf('}'));
  if (lastSemiOrBrace > 0) {
    // Check if there's significant non-code text after the last code line
    const after = code.substring(lastSemiOrBrace + 1).trim();
    if (after.length > 5 && !after.match(/^[\s\/\*]/)) {
      code = code.substring(0, lastSemiOrBrace + 1);
    }
  }

  code = code.trim();

  if (code === '404') {
    throw new Error('Request is not about a 3D design');
  }

  const parameters = parseParameters(code);

  console.log('[OPENSCAD] Code generated:', {
    codeLength: code.length,
    parameterCount: parameters.length,
    paramNames: parameters.map(p => p.name),
    firstLines: code.split('\n').slice(0, 5).join(' | '),
  });

  return { code, parameters };
}
