import OpenAI from 'openai'

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'AccountIQ',
  }
})

export type AIAnalysisInput = {
  companyName: string
  domain?: string
  visitorData: any
  companyData: any
  techStack: any
  businessSignals: any
  // Pre-computed by deterministic engines (NOT just LLM wrapping)
  preComputedPersona: {
    persona: string
    confidence: number
    reasoning: string
  } | null
  preComputedIntent: {
    score: number
    stage: string
    signals: string[]
  } | null
}

export type AIAnalysisOutput = {
  intentScore: number | null
  intentStage: 'Awareness' | 'Evaluation' | 'Decision' | null
  likelyPersona: string | null
  personaConfidence: number | null
  aiSummary: string
  recommendedActions: string[]
  extractedBusinessSignals: string[]
  companyProfile: {
    industry: string
    estimatedSize: string
    headquarters: string
    businessModel: string
    keyProducts: string[]
    leadershipMentions: string[]
  }
  visitorProfileAnalysis: {
    segments: string[]
    behaviours: string[]
    attributes: string[]
    insights: string[]
  } | null
}

// Deterministic fallback: generates visitor profile from pre-computed data when LLM returns null
function generateFallbackVisitorProfile(input: AIAnalysisInput): AIAnalysisOutput['visitorProfileAnalysis'] {
  const pages: string[] = input.visitorData?.pages_visited ?? []
  if (pages.length === 0 && !input.preComputedPersona && !input.preComputedIntent) return null

  const segments: string[] = []
  const behaviours: string[] = []
  const attributes: string[] = []
  const insights: string[] = []

  // Derive segments from persona
  if (input.preComputedPersona?.persona) {
    segments.push(input.preComputedPersona.persona)
  }

  // Derive segments from page patterns
  const hasHighIntent = pages.some(p => ['/pricing', '/demo', '/enterprise', '/contact', '/get-started'].includes(p))
  const hasTechnical = pages.some(p => ['/docs', '/api', '/security', '/compliance'].includes(p))
  const hasResearch = pages.some(p => ['/blog', '/case-studies', '/about'].includes(p))

  if (hasHighIntent) segments.push('Active Evaluator')
  if (hasTechnical) segments.push('Technical Buyer')
  if (hasResearch) segments.push('Research Phase Visitor')
  if (pages.includes('/pricing') && pages.includes('/enterprise')) segments.push('Enterprise Prospect')

  // Derive behaviours from pages
  if (pages.includes('/pricing')) behaviours.push('Reviewed pricing page')
  if (pages.includes('/demo')) behaviours.push('Requested product demo')
  if (pages.includes('/enterprise')) behaviours.push('Explored enterprise tier')
  if (pages.includes('/case-studies')) behaviours.push('Read customer case studies')
  if (pages.includes('/docs') || pages.includes('/api')) behaviours.push('Explored technical documentation')
  if (pages.includes('/security') || pages.includes('/compliance')) behaviours.push('Evaluated security & compliance')
  if (pages.includes('/blog')) behaviours.push('Browsed blog content')
  if (pages.includes('/about')) behaviours.push('Visited about/company page')
  if (pages.includes('/contact') || pages.includes('/get-started')) behaviours.push('Initiated contact or sign-up')

  const dwellTime = input.visitorData?.dwell_time_seconds ?? 0
  if (dwellTime > 180) behaviours.push(`Deep engagement — ${Math.floor(dwellTime / 60)}+ minutes on site`)
  else if (dwellTime > 60) behaviours.push(`Moderate engagement — ${Math.floor(dwellTime / 60)}m ${dwellTime % 60}s on site`)

  const visits = input.visitorData?.visits_this_week ?? 0
  if (visits >= 3) behaviours.push(`Repeat visitor — ${visits} visits this week`)

  // Derive attributes from persona + pages
  if (input.preComputedPersona?.persona) {
    const p = input.preComputedPersona.persona.toLowerCase()
    if (p.includes('executive') || p.includes('c-level')) attributes.push('Likely C-level executive')
    else if (p.includes('manager') || p.includes('vp')) attributes.push('Likely VP or Manager level')
    else if (p.includes('engineer') || p.includes('developer') || p.includes('technical')) attributes.push('Technical decision maker')
    else attributes.push(`Likely role: ${input.preComputedPersona.persona}`)
    
    if (input.preComputedPersona.confidence >= 70) attributes.push('High-confidence persona match')
  }
  if (hasTechnical) attributes.push('Technical evaluator profile')
  if (hasHighIntent && !hasTechnical) attributes.push('Business decision maker profile')

  const ref = input.visitorData?.referral_source
  if (ref === 'linkedin') attributes.push('Sourced from LinkedIn')
  else if (ref === 'google') attributes.push('Found via organic search')
  else if (ref === 'direct') attributes.push('Direct/bookmark visitor — likely returning')

  // Generate insights from intent data
  if (input.preComputedIntent) {
    const score = input.preComputedIntent.score
    const stage = input.preComputedIntent.stage
    if (score >= 7) insights.push(`High purchase intent (${score}/10) — prioritize for immediate outreach`)
    else if (score >= 4) insights.push(`Moderate intent (${score}/10) — nurture with targeted content`)
    else insights.push(`Early-stage interest (${score}/10) — add to awareness campaigns`)

    if (stage === 'Decision') insights.push('Visitor is in Decision stage — ready for sales conversation')
    else if (stage === 'Evaluation') insights.push('Visitor is in Evaluation stage — share comparison content and case studies')
    else insights.push('Visitor is in Awareness stage — provide educational content')
  }

  if (pages.includes('/pricing') && pages.includes('/case-studies')) {
    insights.push('Strong buying signal: pricing + case studies combo indicates ROI evaluation')
  }
  if (pages.includes('/pricing') && pages.includes('/enterprise')) {
    insights.push('Enterprise deal potential: explored both pricing and enterprise tiers')
  }
  if (visits >= 3 && hasHighIntent) {
    insights.push('Highly engaged repeat visitor on high-intent pages — likely close to purchase')
  }

  return {
    segments: Array.from(new Set(segments)),
    behaviours: Array.from(new Set(behaviours)),
    attributes: Array.from(new Set(attributes)),
    insights: Array.from(new Set(insights)),
  }
}

export async function analyzeAccountData(input: AIAnalysisInput): Promise<AIAnalysisOutput> {
  try {
    const prompt = `You are an expert B2B sales intelligence analyst at a top-tier ABM platform. Analyze the following account data and return a comprehensive, structured JSON intelligence profile.

IMPORTANT: Base your analysis ONLY on the data provided below. Do NOT make up or hallucinate company locations, industries, or details. If data is not available, use "Unknown".

## INPUT DATA

### Company: ${input.companyName}
Company Metadata: ${JSON.stringify(input.companyData, null, 2)}
Detected Tech Stack: ${JSON.stringify(input.techStack, null, 2)}
Recent Business Signals / News: ${JSON.stringify(input.businessSignals, null, 2)}

### Scraped Website Content (from the company's actual website)
Website Title: ${input.companyData?.websiteTitle || 'Not available'}
Website Description: ${input.companyData?.description || 'Not available'}
Website Content Snippet: ${input.companyData?.websiteSnippet || 'Not available'}

### Pre-Scraped Leadership (from /about, /team, /leadership pages + Wikipedia — USE THESE DIRECTLY)
${input.companyData?.leadershipHints?.length > 0
  ? input.companyData.leadershipHints.join(', ')
  : 'None found via scraping. Only include names you can directly attribute from the data above.'}

### Visitor Behavior (if available)
Visitor Data: ${JSON.stringify(input.visitorData, null, 2)}

### Pre-Computed Analysis (from deterministic scoring engine)
${input.preComputedPersona && input.preComputedIntent ? `Our system already computed these — use them as a STARTING POINT but adjust if your deeper analysis disagrees:
- Persona Inference: ${input.preComputedPersona.persona} (confidence: ${input.preComputedPersona.confidence}%, reasoning: ${input.preComputedPersona.reasoning})
- Intent Score: ${input.preComputedIntent.score}/10 (stage: ${input.preComputedIntent.stage})
- Intent Signals: ${input.preComputedIntent.signals.join('; ')}` : `None available. This is a manual company search without visitor tracking data. Return null for persona and intent scores.`}

## YOUR TASK

1. **Validate or adjust** the pre-computed persona and intent score based on the full data picture. If no visitor behavior is provided, intentScore should be null, intentStage should be null, likelyPersona should be null, and personaConfidence should be null.
2. **Write a 2-3 sentence AI Summary** that a sales rep can read in 10 seconds to understand this account. Include: who they are, what they likely need, and why now.
3. **Recommend exactly 3 concrete sales actions.** Be SPECIFIC — don't say "follow up". Say things like "Reach out to VP Engineering about their API integration needs", "Send mortgage industry case study", "Add to enterprise outbound cadence targeting fintech companies".
4. **Extract a company profile** with industry, estimated size, business model, key products, and any leadership names mentioned in the data.
5. **Conduct a Visitor Profile Analysis** deriving relevant details specifically based on the visitor behavior (if available). Generate:
   - **Segments**: Categorize the user (e.g., Enterprise Evaluator, Documentation Reader, Technical Buyer).
   - **Behaviours**: Key actions inferred from page views and time on site (e.g., Deeply read pricing, Scanned case studies).
   - **Attributes**: Likely seniority or role based on pages (e.g., C-level, Engineer).
   - **Insights**: Actionable takeaways about their intent or product interest.
   *If no visitor behavior data is provided, leave these arrays empty.*

## OUTPUT FORMAT
Return a JSON object with EXACTLY these fields (no markdown, no extra text):
{
  "intentScore": number (0.0-10.0),
  "intentStage": "Awareness" | "Evaluation" | "Decision",
  "likelyPersona": string,
  "personaConfidence": number (0-100),
  "aiSummary": string (2-3 sentences),
  "recommendedActions": [string, string, string],
  "extractedBusinessSignals": [string, ...],
  "companyProfile": {
    "industry": string,
    "estimatedSize": string (e.g. "100-500 employees" - ESTIMATE THIS IF NOT PROVIDED),
    "headquarters": string (e.g. "San Francisco, CA" - INFER THIS FROM NAME OR ESTIMATE),
    "businessModel": string (e.g. "B2B SaaS", "Marketplace"),
    "keyProducts": [string, ...],
    "leadershipMentions": [string, ...]
  },
  "visitorProfileAnalysis": {
    "segments": [string, ...] (e.g. "Enterprise Evaluator", "Technical Buyer", "Pricing Researcher"),
    "behaviours": [string, ...] (e.g. "Deeply reviewed pricing page", "Compared enterprise tiers"),
    "attributes": [string, ...] (e.g. "Likely C-level or VP", "Technical decision maker"),
    "insights": [string, ...] (e.g. "High purchase intent based on repeated pricing visits", "Interested in enterprise features")
  }
}`

    const response = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2500,
    })

    const rawResponseText = response.choices[0]?.message?.content || '{}'
    console.log("LLM Raw Response:", rawResponseText)
    
    // Safety parsing: Claude/OpenRouter sometimes wraps in markdown ticks
    let cleanJsonStr = rawResponseText.trim()
    if (cleanJsonStr.startsWith("```json")) {
      cleanJsonStr = cleanJsonStr.replace(/^```json/, "").replace(/```$/, "")
    }
    if (cleanJsonStr.startsWith("```")) {
      cleanJsonStr = cleanJsonStr.replace(/^```/, "").replace(/```$/, "")
    }
    
    let jsonResult: any
    try {
      jsonResult = JSON.parse(cleanJsonStr.trim())
    } catch (parseError) {
      console.error('Failed to parse LLM JSON response:', parseError, '\nRaw:', cleanJsonStr)
      throw new Error('LLM returned invalid JSON')
    }
    
    // Ensure all required fields exist with fallbacks
    return {
      intentScore: jsonResult.intentScore ?? input.preComputedIntent?.score ?? null,
      intentStage: jsonResult.intentStage ?? input.preComputedIntent?.stage ?? null,
      likelyPersona: jsonResult.likelyPersona ?? input.preComputedPersona?.persona ?? null,
      personaConfidence: jsonResult.personaConfidence ?? input.preComputedPersona?.confidence ?? null,
      aiSummary: jsonResult.aiSummary ?? 'Unable to generate summary.',
      recommendedActions: jsonResult.recommendedActions ?? ['Contact the account', 'Research further', 'Add to pipeline'],
      extractedBusinessSignals: Array.isArray(jsonResult.extractedBusinessSignals) ? jsonResult.extractedBusinessSignals : [],
      companyProfile: {
        industry: jsonResult.companyProfile?.industry ?? 'Unknown',
        estimatedSize: jsonResult.companyProfile?.estimatedSize ?? 'Unknown',
        headquarters: jsonResult.companyProfile?.headquarters ?? 'Unknown',
        businessModel: jsonResult.companyProfile?.businessModel ?? 'Unknown',
        keyProducts: jsonResult.companyProfile?.keyProducts ?? [],
        leadershipMentions: jsonResult.companyProfile?.leadershipMentions ?? [],
      },
      visitorProfileAnalysis: jsonResult.visitorProfileAnalysis ? {
        segments: Array.isArray(jsonResult.visitorProfileAnalysis.segments) ? jsonResult.visitorProfileAnalysis.segments : [],
        behaviours: Array.isArray(jsonResult.visitorProfileAnalysis.behaviours) ? jsonResult.visitorProfileAnalysis.behaviours : [],
        attributes: Array.isArray(jsonResult.visitorProfileAnalysis.attributes) ? jsonResult.visitorProfileAnalysis.attributes : [],
        insights: Array.isArray(jsonResult.visitorProfileAnalysis.insights) ? jsonResult.visitorProfileAnalysis.insights : [],
      } : generateFallbackVisitorProfile(input)
    }
  } catch (error: any) {
    console.error('Error calling AI orchestration via OpenRouter:', error)
    console.error('OpenRouter error details:', JSON.stringify({ msg: error.message, stack: error.stack }, null, 2))
    
    // AI failed — return ONLY real data, no fake data
    const estHQ = input.companyData?.headquarters || input.companyData?.location || null

    return {
      intentScore: input.preComputedIntent?.score || null,
      intentStage: (input.preComputedIntent?.stage as 'Awareness' | 'Evaluation' | 'Decision') || null,
      likelyPersona: input.preComputedPersona?.persona || null,
      personaConfidence: input.preComputedPersona?.confidence || null,
      aiSummary: input.companyData?.description || `${input.companyName} — additional company details require AI enrichment which is temporarily unavailable.`,
      recommendedActions: [
        `Research ${input.companyName} on LinkedIn to identify key decision makers`,
        `Visit ${input.domain || input.companyName.toLowerCase() + '.com'} to understand their product offerings`,
        `Add ${input.companyName} to your prospecting list for manual outreach`
      ],
      // Business signals come from external sources (news, SerpAPI) — not visitor behavior
      extractedBusinessSignals: Array.isArray(input.businessSignals)
        ? input.businessSignals.filter((s: any) => typeof s === 'string' && s.length > 0)
        : [],
      companyProfile: {
        industry: 'Unknown',
        estimatedSize: 'Unknown',
        headquarters: estHQ || 'Unknown',
        businessModel: 'Unknown',
        keyProducts: [],
        leadershipMentions: input.companyData?.leadershipHints ?? [],
      },
      visitorProfileAnalysis: generateFallbackVisitorProfile(input)
    }
  }
}
