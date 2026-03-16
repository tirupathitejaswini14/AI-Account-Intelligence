/**
 * Smart industry detection from website text content.
 * Scans actual website text for industry-specific keywords
 * and returns the best-matching industry.
 */
export function detectIndustryFromText(text: string): string {
  if (!text) return 'Unknown'
  
  const lower = text.toLowerCase()
  
  const industryKeywords: Record<string, string[]> = {
    'AI / Machine Learning': ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'nlp', 'computer vision', 'ai-powered', 'generative ai'],
    'Marketing Technology': ['marketing automation', 'crm', 'email marketing', 'lead generation', 'marketing engine', 'campaign management', 'customer engagement', 'martech'],
    'Financial Services': ['banking', 'investment', 'brokerage', 'securities', 'asset management', 'wealth management', 'capital market', 'trading', 'financial advisory'],
    'Fintech': ['fintech', 'digital payments', 'neobank', 'lending platform', 'payment processing', 'blockchain', 'cryptocurrency', 'digital wallet'],
    'Real Estate': ['real estate', 'property', 'mortgage', 'realty', 'housing', 'rental', 'commercial property', 'residential'],
    'Healthcare': ['healthcare', 'medical', 'health tech', 'clinical', 'patient', 'pharma', 'biotech', 'telemedicine', 'health insurance'],
    'E-Commerce': ['e-commerce', 'ecommerce', 'online store', 'marketplace', 'retail tech', 'shopping', 'storefront'],
    'SaaS': ['saas', 'software as a service', 'cloud platform', 'subscription software', 'cloud-based'],
    'Cybersecurity': ['cybersecurity', 'security platform', 'threat detection', 'data protection', 'infosec', 'vulnerability'],
    'EdTech': ['education', 'learning platform', 'edtech', 'online learning', 'lms', 'e-learning', 'student'],
    'Automotive Technology': ['automotive', 'vehicle', 'dealership', 'car dealer', 'automobile', 'fleet management'],
    'Insurance': ['insurance', 'insurtech', 'underwriting', 'claims', 'policyholder', 'risk management'],
    'Logistics': ['logistics', 'supply chain', 'shipping', 'freight', 'delivery', 'warehouse', 'fulfillment'],
    'HR Technology': ['hr tech', 'human resources', 'recruitment', 'talent', 'payroll', 'workforce', 'hiring'],
    'Gaming': ['gaming', 'game development', 'esports', 'game studio', 'interactive entertainment'],
    'Media & Entertainment': ['media', 'entertainment', 'streaming', 'content creation', 'publishing', 'broadcast'],
    'Construction': ['construction', 'building', 'infrastructure', 'architecture', 'engineering'],
    'Agriculture': ['agriculture', 'farming', 'agritech', 'crop', 'livestock'],
    'Energy': ['energy', 'renewable', 'solar', 'wind power', 'oil and gas', 'utility'],
    'Telecommunications': ['telecom', 'telecommunications', 'mobile network', 'connectivity', '5g'],
    'Professional Services': ['consulting', 'advisory', 'professional services', 'management consulting'],
    'Technology': ['technology', 'software', 'platform', 'digital transformation', 'developer tools'],
  }

  let bestMatch = 'Technology'
  let bestScore = 0

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    let score = 0
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length // longer matches = more specific = higher weight
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = industry
    }
  }

  return bestScore > 0 ? bestMatch : 'Unknown'
}

/**
 * Generate a proper AI summary from scraped website data
 * when the LLM is unavailable.
 */
export function generateSummaryFromScrapedData(
  companyName: string,
  description: string | null,
  headquarters: string | null,
  industry: string,
  intentStage: string | null,
  intentScore: number | null
): string {
  const parts: string[] = []
  
  // Sentence 1: Who they are
  if (description && description.length > 20) {
    // Use first sentence of description
    const firstSentence = description.split(/[.!]/).filter(s => s.trim().length > 10)[0]
    if (firstSentence) {
      parts.push(firstSentence.trim() + '.')
    } else {
      parts.push(`${companyName} is a ${industry !== 'Unknown' ? industry.toLowerCase() : 'B2B'} company${headquarters && headquarters !== 'Unknown Location' ? ` based in ${headquarters}` : ''}.`)
    }
  } else {
    parts.push(`${companyName} is a ${industry !== 'Unknown' ? industry.toLowerCase() : 'B2B'} company${headquarters && headquarters !== 'Unknown Location' ? ` based in ${headquarters}` : ''}.`)
  }

  // Sentence 2: What their browsing behavior indicates
  if (intentStage) {
    parts.push(`Recent browsing behavior indicates ${intentStage.toLowerCase()}-stage interest in enterprise solutions.`)
  }

  // Sentence 3: Purchase intent assessment
  if (intentScore !== null && intentScore >= 7) {
    parts.push('Multiple visits to pricing and product pages suggest strong purchase intent.')
  } else if (intentScore !== null && intentScore >= 4) {
    parts.push('Engagement patterns suggest active research and growing interest.')
  } else {
    parts.push('Initial engagement signals suggest early-stage awareness.')
  }

  return parts.join(' ')
}
