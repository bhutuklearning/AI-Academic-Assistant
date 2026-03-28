// Load environment variables before instantiating clients
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if .env file exists
const envPath = join(__dirname, '..', '.env');
const envExists = existsSync(envPath);

// Validate API key on startup (prefer OpenRouter key, fall back to legacy Gemini env var)
let API_KEY = (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || '').trim();
const MODEL = process.env.OPENROUTER_MODEL || process.env.GEMINI_MODEL || 'google/gemini-3-flash-preview';
const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const REFERRER = process.env.OPENROUTER_REFERRER || process.env.FRONTEND_URL || 'http://localhost';
const APP_TITLE = process.env.OPENROUTER_APP_TITLE || 'UniPrep Copilot';

const maskKey = (key) => {
  if (!key) return 'none';
  if (key.length <= 10) return `${key.substring(0, 3)}...`;
  return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
};

const buildHeaders = () => ({
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': REFERRER,
  'X-Title': APP_TITLE
});

if (API_KEY) {
  console.log(`✓ OpenRouter API key loaded: ${maskKey(API_KEY)}`);
  console.log(`✓ Using model: ${MODEL}`);

  // Test the API key on startup (async, don't block)
  setTimeout(async () => {
    try {
      const testResult = await testAPIKey();
      if (testResult.valid) {
        console.log('✓ OpenRouter API key verified and working');
      } else {
        console.error('\n❌ OpenRouter API key test FAILED:');
        console.error(`   Error: ${testResult.error}`);

        if (testResult.diagnostics) {
          console.error('\n📋 Key Diagnostics:');
          console.error(`   Length: ${testResult.diagnostics.keyLength} characters`);
          console.error(`   Starts with: ${testResult.diagnostics.keyPrefix}...`);
          if (testResult.diagnostics.hasSpaces) {
            console.error('   ⚠️  Key contains SPACES - remove them!');
          }
          if (testResult.diagnostics.hasQuotes) {
            console.error('   ⚠️  Key contains QUOTES - remove them from .env file!');
          }
          if (testResult.diagnostics.startsWithOpenRouterPrefix === false) {
            console.error('   ⚠️  Key does not start with "sk-or" (OpenRouter format).');
          }
        }

        console.error('\n🔧 How to Fix:');
        console.error('   1. Go to https://openrouter.ai/keys');
        console.error('   2. Create a new API key');
        console.error('   3. Copy the ENTIRE key (starts with sk-or...)');
        console.error('   4. Update backend/.env file: OPENROUTER_API_KEY=your-key-here');
        console.error('   5. NO quotes, NO spaces around = sign');
        console.error('   6. Restart the server\n');
      }
    } catch (err) {
      console.warn('⚠️  Could not test API key on startup:', err.message);
    }
  }, 2000);
} else {
  console.error('\n❌ ERROR: OPENROUTER_API_KEY not found in environment variables.');
  if (!envExists) {
    console.error(`   .env file not found at: ${envPath}`);
    console.error('   Please create a .env file in the backend directory.');
  } else {
    console.error(`   .env file exists at: ${envPath}`);
    try {
      const envContent = readFileSync(envPath, 'utf8');
      if (envContent.includes('OPENROUTER_API_KEY')) {
        console.error('   Found OPENROUTER_API_KEY in .env file, but key may be empty or commented out.');
      } else if (envContent.includes('GEMINI_API_KEY')) {
        console.error('   Found legacy GEMINI_API_KEY, but OpenRouter key is not set.');
      } else {
        console.error('   OPENROUTER_API_KEY is not set in the .env file.');
      }
    } catch (err) {
      console.error('   Could not read .env file.');
    }
  }
  console.error('\n   To fix this:');
  console.error('   1. Create or edit backend/.env file');
  console.error('   2. Add: OPENROUTER_API_KEY=your-openrouter-api-key');
  console.error('   3. (Optional) Override model with OPENROUTER_MODEL=google/gemini-3-flash-preview');
  console.error('   4. Make sure there are NO spaces around the = sign');
  console.error('   5. Do NOT use quotes around the API key value');
  console.error('   6. Restart the server\n');
}

/**
 * Test API key function with detailed diagnostics
 */
export async function testAPIKey() {
  if (!API_KEY) {
    return {
      valid: false,
      error: 'API key not configured. Set OPENROUTER_API_KEY in backend/.env',
      diagnostics: {
        keyLength: 0,
        keyPrefix: 'none',
        keyExists: false
      }
    };
  }

  // Diagnostic information
  const diagnostics = {
    keyLength: API_KEY.length,
    keyPrefix: API_KEY.substring(0, 10),
    keySuffix: API_KEY.substring(Math.max(API_KEY.length - 4, 0)),
    keyExists: true,
    hasSpaces: API_KEY.includes(' '),
    hasQuotes: API_KEY.includes('"') || API_KEY.includes("'"),
    startsWithOpenRouterPrefix: API_KEY.startsWith('sk-or')
  };

  // Check for common issues
  if (API_KEY.length < 20) {
    return {
      valid: false,
      error: 'API key is too short. OpenRouter keys start with "sk-or".',
      diagnostics
    };
  }

  if (diagnostics.hasSpaces) {
    return {
      valid: false,
      error: 'API key contains spaces. Remove all spaces from the key.',
      diagnostics
    };
  }

  if (diagnostics.hasQuotes) {
    return {
      valid: false,
      error: 'API key contains quotes. Remove quotes from your .env file.',
      diagnostics
    };
  }

  try {
    console.log('[API Test] Testing OpenRouter API key...');

    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          { role: 'user', content: "Say 'test' if you can read this." }
        ],
        max_tokens: 10
      },
      { headers: buildHeaders() }
    );

    const text = response.data?.choices?.[0]?.message?.content;

    if (text && text.length > 0) {
      return {
        valid: true,
        message: 'API key is valid and working via OpenRouter!',
        diagnostics,
        usage: response.data?.usage
      };
    }

    return {
      valid: false,
      error: 'Invalid response format from OpenRouter',
      diagnostics
    };
  } catch (error) {
    const statusCode = error.response?.status || null;
    const errorDetails = error.response?.data?.error?.message || error.message || 'Unknown error';
    const normalizedError = errorDetails.toLowerCase();

    if (statusCode === 401 || normalizedError.includes('unauthorized')) {
      return {
        valid: false,
        error: 'API key is invalid or missing scopes. Check your key at https://openrouter.ai/keys',
        diagnostics,
        statusCode,
        detailedError: errorDetails
      };
    }

    if (statusCode === 429) {
      return {
        valid: false,
        error: 'Rate limit or quota exceeded on OpenRouter.',
        diagnostics,
        statusCode,
        detailedError: errorDetails
      };
    }

    return {
      valid: false,
      error: errorDetails,
      diagnostics,
      statusCode: statusCode || 'unknown',
      fullError: error.message
    };
  }
}

/**
 * Chat function - forwards OpenAI-format messages to OpenRouter
 */
export async function chat(messages, options = {}) {
  if (!API_KEY) {
    const errorMsg = 'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in backend/.env (https://openrouter.ai/keys).';
    console.error(`\n❌ ${errorMsg}\n`);
    throw new Error(errorMsg);
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI] OpenRouter request with ${messages.length} messages`);
    }

    const payload = {
      model: MODEL,
      messages,
      stream: false
    };

    if (options.temperature !== undefined) {
      payload.temperature = options.temperature;
    }
    if (options.max_tokens !== undefined) {
      payload.max_tokens = options.max_tokens;
    }

    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      payload,
      { headers: buildHeaders() }
    );

    const data = response.data || {};
    return {
      choices: data.choices?.map((choice) => ({
        message: choice.message,
        finish_reason: choice.finish_reason
      })) || [],
      usage: data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  } catch (error) {
    const statusCode = error.response?.status || null;
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    const normalizedError = errorMessage.toLowerCase();

    console.error('\n❌ OpenRouter API Error:');
    console.error(`   Message: ${errorMessage}`);

    if (statusCode === 401 || normalizedError.includes('unauthorized')) {
      throw new Error(
        'OpenRouter API key is INVALID.\n\n' +
        'SOLUTION:\n' +
        '1. Go to https://openrouter.ai/keys\n' +
        '2. Create a NEW API key (starts with sk-or...)\n' +
        '3. Update backend/.env file: OPENROUTER_API_KEY=your-new-key-here\n' +
        '4. Make sure NO quotes, NO spaces around the = sign\n' +
        '5. Restart the server completely'
      );
    }

    if (statusCode === 429 || normalizedError.includes('rate limit')) {
      throw new Error('OpenRouter: Rate limit exceeded. Please try again later.');
    }

    throw new Error(`OpenRouter API error: ${errorMessage}`);
  }
}

/**
 * Base prompt template builder
 */
const buildBasePrompt = (userContext, styleProfile, contextData) => {
  let prompt = `You are an academic assistant helping university students prepare for exams and assignments.

User Context:
- University: ${userContext.university}
- Branch: ${userContext.branch}
- Semester: ${userContext.semester}
- Subject: ${userContext.subject}

Answer Style Profile:
- Sections: ${styleProfile.sections.join(', ')}
- Tone: ${styleProfile.tone}
${styleProfile.maxWordCount ? `- Max Word Count: ${styleProfile.maxWordCount}` : ''}
${styleProfile.instructions ? `- Additional Instructions: ${styleProfile.instructions}` : ''}

Relevant Context:
`;

  if (contextData.syllabus) {
    prompt += `\nSyllabus:\n${contextData.syllabus.substring(0, 2000)}\n`;
  }
  if (contextData.notes) {
    prompt += `\nNotes:\n${contextData.notes.substring(0, 2000)}\n`;
  }
  if (contextData.pyq) {
    prompt += `\nPast Year Questions:\n${contextData.pyq.substring(0, 2000)}\n`;
  }

  return prompt;
};

/**
 * Helper function to parse AI JSON responses, handling markdown code blocks
 */
const parseAIResponse = (response, fallbackStructure) => {
  try {
    let cleanedResponse = response.trim();
    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/^```\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
    cleanedResponse = cleanedResponse.replace(/```/g, '');
    cleanedResponse = cleanedResponse.trim();

    // Try to extract JSON if there's text before/after
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    return JSON.parse(cleanedResponse);
  } catch (parseError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to parse AI response as JSON. Using fallback structure.');
    }
    return fallbackStructure;
  }
};

/**
 * Generate study notes
 */
export const generateNotes = async (userContext, styleProfile, contextData, topic, depth, customPrompt = '') => {
  const basePrompt = buildBasePrompt(userContext, styleProfile, contextData);

  let prompt = `${basePrompt}

Generate comprehensive study notes on the topic: ${topic}

Depth Level: ${depth} (short/medium/detailed)

Requirements:
1. Follow the exact section structure: ${styleProfile.sections.join(', ')}
2. Maintain ${styleProfile.tone} tone throughout
3. Include relevant examples and key points
4. Ensure content aligns with the syllabus provided
${styleProfile.maxWordCount ? `5. Word count should be approximately ${styleProfile.maxWordCount}` : ''}

${customPrompt && customPrompt.trim() ? `\n IMPORTANT - USER-SPECIFIED REQUIREMENTS (MUST FOLLOW):\n${customPrompt}\n\nThese instructions are CRITICAL and must be strictly adhered to in the generated content.\n` : ''}

Output format as JSON:
{
  "sections": [
    {
      "title": "Section Name",
      "content": "Section content..."
    }
  ]
}`;

  try {
    const systemMessage = customPrompt && customPrompt.trim()
      ? "You are an expert academic assistant. Pay special attention to user-specified requirements marked as IMPORTANT. Always respond with valid JSON."
      : "You are an expert academic assistant. Always respond with valid JSON.";

    const completion = await chat([
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ], {
      temperature: 0.7,
      max_tokens: styleProfile.maxWordCount ? Math.min(styleProfile.maxWordCount * 2, 4000) : 3000
    });

    const response = completion.choices[0].message.content;

    // Use helper function to parse JSON
    const parsedResponse = parseAIResponse(response, {
      sections: [{
        title: 'Generated Content',
        content: response
      }]
    });

    return parsedResponse;
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Re-throw the original error if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw error;
    }
    throw new Error(`Failed to generate notes: ${error.message}`);
  }
};

/**
 * Generate report
 */
export const generateReport = async (userContext, styleProfile, contextData, topic, wordCount, requiredSections, customPrompt = '') => {
  const basePrompt = buildBasePrompt(userContext, styleProfile, contextData);

  let prompt = `${basePrompt}

Generate a detailed academic report on the topic: ${topic}

Requirements:
- Word Count: ${wordCount}
- Required Sections: ${requiredSections.join(', ')}
- Tone: ${styleProfile.tone}
- Follow academic writing standards

${customPrompt && customPrompt.trim() ? `\n IMPORTANT - USER-SPECIFIED REQUIREMENTS (MUST FOLLOW):\n${customPrompt}\n\nThese instructions are CRITICAL and must be strictly adhered to in the generated content.\n` : ''}

Output format as JSON:
{
  "title": "Report Title",
  "sections": [
    {
      "title": "Section Name",
      "content": "Section content..."
    }
  ],
  "references": ["Reference 1", "Reference 2"]
}`;

  try {
    const systemMessage = customPrompt && customPrompt.trim()
      ? "You are an expert academic writer. Pay special attention to user-specified requirements marked as IMPORTANT. Always respond with valid JSON."
      : "You are an expert academic writer. Always respond with valid JSON.";

    const completion = await chat([
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ], {
      temperature: 0.7,
      max_tokens: Math.min(wordCount * 2, 8000)
    });

    const response = completion.choices[0].message.content;

    // Use helper function to parse JSON
    const parsedResponse = parseAIResponse(response, {
      title: topic,
      sections: [{
        title: 'Content',
        content: response
      }],
      references: []
    });

    return parsedResponse;
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Re-throw the original error if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw error;
    }
    throw new Error(`Failed to generate report: ${error.message}`);
  }
};

/**
 * Generate PPT outline
 */
export const generatePPT = async (userContext, styleProfile, contextData, topic, slideCount, presentationType, customPrompt = '') => {
  const basePrompt = buildBasePrompt(userContext, styleProfile, contextData);

  let prompt = `${basePrompt}

Generate a PowerPoint presentation outline on the topic: ${topic}

Requirements:
- Number of Slides: ${slideCount}
- Presentation Type: ${presentationType}
- Tone: ${styleProfile.tone}

${customPrompt && customPrompt.trim() ? `\n IMPORTANT - USER-SPECIFIED REQUIREMENTS (MUST FOLLOW):\n${customPrompt}\n\nThese instructions are CRITICAL and must be strictly adhered to in the generated content.\n` : ''}

Output format as JSON:
{
  "title": "Presentation Title",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "content": "Main points...",
      "notes": "Speaker notes..."
    }
  ]
}`;

  try {
    const systemMessage = customPrompt && customPrompt.trim()
      ? "You are an expert presentation designer. Pay special attention to user-specified requirements marked as IMPORTANT. Always respond with valid JSON."
      : "You are an expert presentation designer. Always respond with valid JSON.";

    const completion = await chat([
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ], {
      temperature: 0.7,
      max_tokens: slideCount * 200
    });

    const response = completion.choices[0].message.content;

    // Use helper function to parse JSON
    const parsedResponse = parseAIResponse(response, {
      title: topic,
      slides: [{
        slideNumber: 1,
        title: topic,
        content: response,
        notes: ''
      }]
    });

    return parsedResponse;
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Re-throw the original error if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw error;
    }
    throw new Error(`Failed to generate PPT: ${error.message}`);
  }
};

/**
 * Generate exam blueprint
 */
export const generateExamBlueprint = async (userContext, contextData) => {
  const prompt = `You are an exam planning expert for university students.

User Context:
- University: ${userContext.university}
- Branch: ${userContext.branch}
- Semester: ${userContext.semester}
- Subject: ${userContext.subject}

Syllabus Context:
${contextData.syllabus ? contextData.syllabus.substring(0, 3000) : 'No syllabus provided'}

Generate a comprehensive exam blueprint/strategy.

Output format as JSON:
{
  "topics": [
    {
      "name": "Topic Name",
      "importance": "high/medium/low",
      "estimatedMarks": 20,
      "timeToStudy": "5 hours"
    }
  ],
  "strategy": "Overall exam strategy...",
  "focusAreas": ["Area 1", "Area 2"]
}`;

  try {
    const completion = await chat([
      { role: "system", content: "You are an expert exam strategist. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ], {
      temperature: 0.6,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;

    // Use helper function to parse JSON
    const parsedResponse = parseAIResponse(response, {
      topics: [],
      strategy: response,
      focusAreas: []
    });

    return parsedResponse;
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Re-throw the original error if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw error;
    }
    throw new Error(`Failed to generate exam blueprint: ${error.message}`);
  }
};

/**
 * Generate revision planner
 */
export const generateRevisionPlanner = async (userContext, contextData, examDate, hoursPerDay, blueprint) => {
  const prompt = `You are a study planning expert for university students.

User Context:
- University: ${userContext.university}
- Branch: ${userContext.branch}
- Semester: ${userContext.semester}
- Subject: ${userContext.subject}

Exam Date: ${examDate}
Hours available per day: ${hoursPerDay}

${blueprint ? `Blueprint: ${JSON.stringify(blueprint).substring(0, 1000)}` : ''}

Generate a day-by-day revision plan.

Output format as JSON:
{
  "days": [
    {
      "day": 1,
      "date": "2024-01-15",
      "topics": ["Topic 1", "Topic 2"],
      "tasks": ["Read notes", "Solve problems"],
      "hours": 4
    }
  ],
  "tips": ["Tip 1", "Tip 2"]
}`;

  try {
    const completion = await chat([
      { role: "system", content: "You are an expert study planner. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ], {
      temperature: 0.6,
      max_tokens: 3000
    });

    const response = completion.choices[0].message.content;

    // Use helper function to parse JSON
    const parsedResponse = parseAIResponse(response, {
      days: [],
      tips: []
    });

    return parsedResponse;
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Re-throw the original error if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw error;
    }
    throw new Error(`Failed to generate revision planner: ${error.message}`);
  }
};

/**
 * Generate rapid revision sheets
 */
export const generateRapidRevisionSheets = async (userContext, styleProfile, contextData, topics) => {
  const basePrompt = buildBasePrompt(userContext, styleProfile, contextData);

  const prompt = `${basePrompt}

Generate quick revision sheets for rapid learning.

Topics: ${topics.join(', ')}

Requirements:
- Key points only (bullet format)
- Important formulae
- Critical definitions
- Quick tips for exam

Output format as JSON:
{
  "keyPoints": ["Point 1", "Point 2"],
  "formulae": ["Formula 1", "Formula 2"],
  "definitions": ["Definition 1", "Definition 2"]
}`;

  try {
    const completion = await chat([
      { role: "system", content: "You are an expert academic assistant. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ], {
      temperature: 0.5,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;

    // Use helper function to parse JSON
    const parsedResponse = parseAIResponse(response, {
      keyPoints: [],
      formulae: [],
      definitions: []
    });

    return parsedResponse;
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Re-throw the original error if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw error;
    }
    throw new Error(`Failed to generate revision sheets: ${error.message}`);
  }
};

/**
 * Generate mock paper
 */
export const generateMockPaper = async (userContext, styleProfile, contextData, shortCount, longCount) => {
  const basePrompt = buildBasePrompt(userContext, styleProfile, contextData);

  const prompt = `${basePrompt}

Generate a mock exam paper.

Pattern:
- Short Answer Questions: ${shortCount}
- Long Answer Questions: ${longCount}

Requirements:
1. Questions should align with syllabus
2. Follow patterns from PYQs
3. Include outline answers in ${styleProfile.tone} tone
4. Follow ${styleProfile.sections.join(', ')} structure for answers

Output format as JSON:
{
  "questions": [
    {
      "type": "short",
      "question": "Question text",
      "answer": "Answer outline..."
    },
    {
      "type": "long",
      "question": "Question text",
      "answer": "Detailed answer..."
    }
  ]
}`;

  try {
    const completion = await chat([
      { role: "system", content: "You are an expert academic assistant. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ], {
      temperature: 0.7,
      max_tokens: 4000
    });

    const response = completion.choices[0].message.content;

    // Use helper function to parse JSON
    const parsedResponse = parseAIResponse(response, {
      questions: []
    });

    return parsedResponse;
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Re-throw the original error if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      throw error;
    }
    throw new Error(`Failed to generate mock paper: ${error.message}`);
  }
};
