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

// Map of tech name to category — also used as fallback in AccountCard for legacy data
export const TECH_CATEGORIES: Record<string, string> = Object.fromEntries(
  Object.entries(TECH_SIGNATURES).map(([name, { category }]) => [name, category])
)

// ─────────────────────────────────────────────────────────────────────────────
// BuiltWith scraper — returns { techName: category }
// ─────────────────────────────────────────────────────────────────────────────
export async function scrapeBuiltWith(domain: string): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const response = await fetch(`https://builtwith.com/${domain}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`[BuiltWith] ${domain} returned status ${response.status}`)
      return results
    }

    const html = await response.text()
    console.log(`[BuiltWith] Fetched builtwith.com/${domain}: ${html.length} bytes`)
    const $ = cheerio.load(html)

    // BuiltWith renders technologies in Bootstrap cards.
    // Each .card has a .card-header (category name) and tech links inside.
    $('.card').each((_, card) => {
      const category = $(card).find('.card-header').first().text().trim()
      if (!category) return

      $(card).find('a').each((_, el) => {
        const href = $(el).attr('href') || ''
        const name = $(el).text().trim()
        // Tech links on BuiltWith look like /tech/hubspot or /hub/analytics
        if ((href.includes('/tech/') || href.includes('/hub/')) && name.length > 1 && name.length < 80) {
          results[name] = category
        }
      })
    })

    // Fallback: BuiltWith sometimes uses a different layout with profile divs
    if (Object.keys(results).length === 0) {
      $('[class*="profile-group"], [class*="tech-group"]').each((_, group) => {
        const category = $(group).find('h3, h4, h5').first().text().trim() || 'Technology'
        $(group).find('a').each((_, el) => {
          const name = $(el).text().trim()
          if (name.length > 1 && name.length < 80) {
            results[name] = category
          }
        })
      })
    }

    // Second fallback: grab any tech links with their nearest heading
    if (Object.keys(results).length === 0) {
      $('a[href*="/tech/"]').each((_, el) => {
        const name = $(el).text().trim()
        if (!name || name.length < 2 || name.length > 80) return
        // Walk up the DOM to find the nearest section heading
        const heading =
          $(el).closest('[class*="card"], [class*="group"], section, article')
            .find('h2, h3, h4, h5')
            .first()
            .text()
            .trim() || 'Technology'
        results[name] = heading
      })
    }

    console.log(`[BuiltWith] Detected ${Object.keys(results).length} technologies for ${domain}`)
  } catch (err: any) {
    console.warn(`[BuiltWith] Failed for ${domain}:`, err.message)
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Signature-based detection from the company's own homepage HTML
// Returns Record<string, string> (tech → category) — same shape as BuiltWith
// ─────────────────────────────────────────────────────────────────────────────
export async function detectTechStack(domain: string): Promise<Record<string, string>> {
  if (!domain) return {}

  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) return {}

    const html = await response.text()
    const detected: Record<string, string> = {}

    for (const [tech, { patterns, category }] of Object.entries(TECH_SIGNATURES)) {
      if (patterns.some(regex => regex.test(html))) {
        detected[tech] = category
      }
    }

    return detected
  } catch (error) {
    console.error(`Error detecting tech stack for ${domain}:`, error)
    return {}
  }
}
