/**
 * Deterministic Intent Scoring Engine
 * 
 * Scores 0–10 how likely a visitor is to buy.
 * Uses a weighted formula based on concrete signals.
 * This runs BEFORE the LLM — the AI then validates/adjusts.
 */

type IntentResult = {
  score: number          // 0.0 to 10.0
  stage: 'Awareness' | 'Evaluation' | 'Decision'
  signals: string[]      // Human-readable list of what contributed
}

// Signal weight configs
const WEIGHTS = {
  // Visit frequency (per week)
  VISITS_LOW: 0.5,      // 1 visit
  VISITS_MED: 1.5,      // 2-3 visits
  VISITS_HIGH: 3.0,     // 4+ visits

  // Dwell time thresholds (seconds)
  DWELL_SHORT: 0.5,     // < 30s (bounce)
  DWELL_MED: 1.0,       // 30s - 120s
  DWELL_LONG: 2.0,      // 120s - 300s
  DWELL_VERY_LONG: 3.0, // 300s+

  // High-intent page signals
  PRICING_PAGE: 2.5,
  DEMO_PAGE: 2.0,
  ENTERPRISE_PAGE: 2.0,
  CASE_STUDY_PAGE: 1.5,
  API_DOCS_PAGE: 1.0,
  SECURITY_PAGE: 1.5,
  
  // Low-intent page signals
  BLOG_PAGE: 0.3,
  CAREERS_PAGE: -0.5,
  
  // Referral source bonuses
  REFERRAL_LINKEDIN: 1.0,
  REFERRAL_GOOGLE: 0.5,
  REFERRAL_DIRECT: 0.8,
}

const HIGH_INTENT_PAGES = [
  { pattern: /pricing/i, weight: WEIGHTS.PRICING_PAGE, label: 'Pricing page visited' },
  { pattern: /demo/i, weight: WEIGHTS.DEMO_PAGE, label: 'Demo/trial page visited' },
  { pattern: /enterprise/i, weight: WEIGHTS.ENTERPRISE_PAGE, label: 'Enterprise page visited' },
  { pattern: /case-study|customer|success/i, weight: WEIGHTS.CASE_STUDY_PAGE, label: 'Case study page visited' },
  { pattern: /api|docs|sdk/i, weight: WEIGHTS.API_DOCS_PAGE, label: 'API/Docs page visited' },
  { pattern: /security|compliance|soc2/i, weight: WEIGHTS.SECURITY_PAGE, label: 'Security/compliance page visited' },
  { pattern: /blog/i, weight: WEIGHTS.BLOG_PAGE, label: 'Blog page visited (low intent)' },
  { pattern: /careers|jobs/i, weight: WEIGHTS.CAREERS_PAGE, label: 'Careers page visited (negative signal)' },
]

export function scoreIntent(input: {
  pages_visited?: string[]
  dwell_time_seconds?: number
  visits_this_week?: number
  referral_source?: string
}): IntentResult {
  const signals: string[] = []
  let rawScore = 0

  const {
    pages_visited = [],
    dwell_time_seconds = 0,
    visits_this_week = 0,
    referral_source = ''
  } = input

  // 1. Visit frequency scoring
  if (visits_this_week >= 4) {
    rawScore += WEIGHTS.VISITS_HIGH
    signals.push(`${visits_this_week} visits this week (high frequency)`)
  } else if (visits_this_week >= 2) {
    rawScore += WEIGHTS.VISITS_MED
    signals.push(`${visits_this_week} visits this week (moderate frequency)`)
  } else if (visits_this_week >= 1) {
    rawScore += WEIGHTS.VISITS_LOW
    signals.push(`${visits_this_week} visit this week (low frequency)`)
  }

  // 2. Dwell time scoring
  if (dwell_time_seconds > 300) {
    rawScore += WEIGHTS.DWELL_VERY_LONG
    signals.push(`${dwell_time_seconds}s dwell time (very high engagement)`)
  } else if (dwell_time_seconds > 120) {
    rawScore += WEIGHTS.DWELL_LONG
    signals.push(`${dwell_time_seconds}s dwell time (high engagement)`)
  } else if (dwell_time_seconds > 30) {
    rawScore += WEIGHTS.DWELL_MED
    signals.push(`${dwell_time_seconds}s dwell time (moderate)`)
  } else if (dwell_time_seconds > 0) {
    rawScore += WEIGHTS.DWELL_SHORT
    signals.push(`${dwell_time_seconds}s dwell time (bounced quickly)`)
  }

  // 3. Page-level intent signals
  for (const page of pages_visited) {
    for (const rule of HIGH_INTENT_PAGES) {
      if (rule.pattern.test(page)) {
        rawScore += rule.weight
        signals.push(rule.label)
        break
      }
    }
  }

  // 4. Referral source bonus
  const ref = referral_source.toLowerCase()
  if (ref.includes('linkedin')) {
    rawScore += WEIGHTS.REFERRAL_LINKEDIN
    signals.push('Referred from LinkedIn (professional intent)')
  } else if (ref.includes('google')) {
    rawScore += WEIGHTS.REFERRAL_GOOGLE
    signals.push('Referred from Google search')
  } else if (ref === 'direct' || ref === '') {
    rawScore += WEIGHTS.REFERRAL_DIRECT
    signals.push('Direct visit (brand awareness)')
  }

  // Clamp score to 0–10
  const score = Math.min(10, Math.max(0, Math.round(rawScore * 10) / 10))

  // Determine intent stage
  let stage: IntentResult['stage']
  if (score >= 7) {
    stage = 'Decision'
  } else if (score >= 4) {
    stage = 'Evaluation'
  } else {
    stage = 'Awareness'
  }

  return { score, stage, signals }
}
