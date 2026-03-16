import * as cheerio from 'cheerio'

// Tech signatures with categories for display
const TECH_SIGNATURES: Record<string, { patterns: RegExp[]; category: string }> = {
  'Google Analytics': { patterns: [/google-analytics\.com\/analytics\.js/i, /googletagmanager\.com\/gtag/i], category: 'Analytics' },
  'HubSpot': { patterns: [/js\.hs-scripts\.com/i, /js\.hs-analytics\.net/i], category: 'Marketing Automation' },
  'Salesforce': { patterns: [/cdn\.salesforce\.com/i], category: 'CRM' },
  'Marketo': { patterns: [/munchkin\.marketo\.net/i], category: 'Marketing Automation' },
  'Segment': { patterns: [/cdn\.segment\.com/i], category: 'Analytics' },
  'Intercom': { patterns: [/widget\.intercom\.io/i], category: 'Customer Support' },
  'Drift': { patterns: [/js\.driftt\.com/i], category: 'Sales Engagement' },
  'Shopify': { patterns: [/cdn\.shopify\.com/i], category: 'E-Commerce Platform' },
  'WordPress': { patterns: [/wp-content/i, /wp-includes/i], category: 'Website Platform' },
  'React': { patterns: [/_next\/static/i, /react-dom/i, /gatsby/i], category: 'Frontend Framework' },
  'Vue': { patterns: [/data-v-/i, /vue\.js/i], category: 'Frontend Framework' },
  'Stripe': { patterns: [/js\.stripe\.com/i], category: 'Payments' },
  'Mixpanel': { patterns: [/cdn\.mxpnl\.com/i], category: 'Analytics' },
  'Vercel': { patterns: [/_next\/static/i], category: 'Hosting' },
}

// Map of tech name to category for use in UI
export const TECH_CATEGORIES: Record<string, string> = Object.fromEntries(
  Object.entries(TECH_SIGNATURES).map(([name, { category }]) => [name, category])
)

export async function detectTechStack(domain: string) {
  if (!domain) return {}

  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`
    const response = await fetch(url, { 
      // Add standard headers to prevent basic blocks
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Fast timeout since this is just an extra signal
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) return {}
    
    const html = await response.text()
    const detected: Record<string, boolean> = {}
    
    // Check for script sources and HTML signatures
    for (const [tech, { patterns }] of Object.entries(TECH_SIGNATURES)) {
      detected[tech] = patterns.some(regex => regex.test(html))
    }
    
    return detected
  } catch (error) {
    console.error(`Error detecting tech stack for ${domain}:`, error)
    return {}
  }
}
