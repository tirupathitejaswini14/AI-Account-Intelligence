import * as cheerio from 'cheerio'

const SCRAPE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

// Title/role keywords used to find leadership names
const LEADERSHIP_TITLES = [
  'CEO', 'Chief Executive', 'CTO', 'Chief Technology', 'CFO', 'Chief Financial',
  'COO', 'Chief Operating', 'CPO', 'Chief Product', 'CMO', 'Chief Marketing',
  'President', 'Founder', 'Co-Founder', 'Co-founder', 'Cofounder',
  'Chairman', 'Managing Director', 'General Manager', 'VP ', 'Vice President',
  'Head of', 'Director of',
]

/**
 * Extract person names from text using common leadership title patterns.
 * Handles: "CEO John Smith", "John Smith, CEO", "founded by Jane Doe"
 */
function extractNamesFromText(text: string): string[] {
  const names = new Set<string>()

  // Pattern 1: Title followed by Name — "CEO John Smith" / "Founder: Jane Doe"
  const titleFirstPattern = /(?:CEO|CTO|CFO|COO|CPO|CMO|President|Founder|Co-Founder|Chairman|Managing\s+Director)\s*[:\-–]?\s*([A-Z][a-z]{1,20}\s+[A-Z][a-z]{1,25}(?:\s+[A-Z][a-z]{1,20})?)/g
  let m
  while ((m = titleFirstPattern.exec(text)) !== null) {
    const name = m[1].trim()
    if (name.split(' ').length >= 2) names.add(name)
  }

  // Pattern 2: Name followed by title — "John Smith, CEO" / "Jane Doe (Founder)"
  const nameFirstPattern = /([A-Z][a-z]{1,20}\s+[A-Z][a-z]{1,25}(?:\s+[A-Z][a-z]{1,20})?)\s*[,\(]\s*(?:CEO|CTO|CFO|COO|CPO|CMO|President|Founder|Co-Founder|Chairman|Managing\s+Director|VP\s+\w+)/g
  while ((m = nameFirstPattern.exec(text)) !== null) {
    const name = m[1].trim()
    if (name.split(' ').length >= 2) names.add(name)
  }

  // Pattern 3: "founded by Name" / "led by Name"
  const foundedPattern = /(?:founded|co-founded|led|started|created)\s+by\s+([A-Z][a-z]{1,20}\s+[A-Z][a-z]{1,25})/gi
  while ((m = foundedPattern.exec(text)) !== null) {
    const name = m[1].trim()
    if (name.split(' ').length >= 2) names.add(name)
  }

  // Filter out false positives (common non-name title-case phrases)
  const BLACKLIST = new Set([
    'New York', 'San Francisco', 'Los Angeles', 'United States', 'North America',
    'South America', 'United Kingdom', 'European Union', 'Middle East',
  ])

  return Array.from(names).filter(n => !BLACKLIST.has(n)).slice(0, 8)
}

/**
 * Extract leadership from JSON-LD structured data embedded in HTML
 */
function extractFromJsonLd($: cheerio.CheerioAPI): string[] {
  const names: string[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}')
      const items = Array.isArray(json) ? json : [json]
      for (const item of items) {
        // Person directly
        if (item['@type'] === 'Person' && item.name) names.push(item.name)
        // Organization with founder/member
        if (item.founder) {
          const f = Array.isArray(item.founder) ? item.founder : [item.founder]
          for (const p of f) names.push(typeof p === 'string' ? p : p.name || '')
        }
        if (item.employee) {
          const e = Array.isArray(item.employee) ? item.employee : [item.employee]
          for (const p of e) if (p.name) names.push(p.name)
        }
        if (item.member) {
          const ms = Array.isArray(item.member) ? item.member : [item.member]
          for (const p of ms) if (p.name) names.push(p.name)
        }
      }
    } catch {}
  })
  return names.filter(Boolean).slice(0, 8)
}

/**
 * Scrape a team/about/leadership page to find people names and titles
 */
async function scrapeLeadershipPage(url: string): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(url, { signal: controller.signal, headers: SCRAPE_HEADERS, redirect: 'follow' })
    clearTimeout(timeout)

    if (!response.ok) return []
    const html = await response.text()
    const $ = cheerio.load(html)

    const found: string[] = []

    // 1. JSON-LD structured data (most reliable)
    found.push(...extractFromJsonLd($))

    // 2. Team/person card selectors (common patterns across company sites)
    const cardSelectors = [
      '[class*="team"] [class*="name"]',
      '[class*="team"] h3', '[class*="team"] h4',
      '[class*="leader"] [class*="name"]',
      '[class*="leader"] h3', '[class*="leader"] h4',
      '[class*="person"] [class*="name"]',
      '[class*="person"] h3', '[class*="person"] h4',
      '[class*="member"] h3', '[class*="member"] h4',
      '[class*="people"] h3', '[class*="people"] h4',
      '[class*="staff"] h3', '[class*="staff"] h4',
      '[class*="executive"] h3', '[class*="executive"] h4',
      '[class*="board"] h3', '[class*="board"] h4',
      '[itemprop="name"]',
    ]

    for (const sel of cardSelectors) {
      $(sel).each((_, el) => {
        const text = $(el).text().trim()
        // Valid person names: 2-4 words, each capitalised, not too long
        if (/^[A-Z][a-z]{1,20}(\s[A-Z][a-z]{0,20}){1,3}$/.test(text)) {
          found.push(text)
        }
      })
      if (found.length >= 8) break
    }

    // 3. Full-text regex extraction as final fallback
    $('script, style, noscript').remove()
    const bodyText = $('body').text().replace(/\s+/g, ' ')
    found.push(...extractNamesFromText(bodyText))

    // Deduplicate and limit
    return [...new Set(found.filter(Boolean))].slice(0, 8)
  } catch {
    return []
  }
}

/**
 * Try multiple pages to find leadership information for a domain.
 * Runs in parallel across candidate pages.
 */
export async function scrapeLeadership(domain: string): Promise<string[]> {
  const candidatePages = [
    `/about`, `/team`, `/leadership`, `/company`, `/about-us`,
    `/our-team`, `/people`, `/management`, `/executives`,
  ]

  const results = await Promise.allSettled(
    candidatePages.map(path => scrapeLeadershipPage(`https://${domain}${path}`))
  )

  const all: string[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  const deduped = [...new Set(all)].slice(0, 8)
  console.log(`[Leadership] Found ${deduped.length} people for ${domain}: ${deduped.join(', ')}`)
  return deduped
}

/**
 * Extract leadership names from Wikipedia article text.
 * Wikipedia reliably mentions founders and CEOs in the intro paragraph.
 */
export function extractLeadershipFromWikipedia(wikiText: string | null | undefined): string[] {
  if (!wikiText) return []
  return extractNamesFromText(wikiText).slice(0, 5)
}

/**
 * Scrape the company homepage for description, location, and meta info.
 */
export async function scrapeCompanyWebsite(domain: string): Promise<{
  title: string | null
  metaDescription: string | null
  aboutText: string | null
  locationHints: string[]
  industryHints: string[]
  bodySnippet: string | null
}> {
  const result = {
    title: null as string | null,
    metaDescription: null as string | null,
    aboutText: null as string | null,
    locationHints: [] as string[],
    industryHints: [] as string[],
    bodySnippet: null as string | null,
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`https://${domain}`, {
      signal: controller.signal,
      headers: SCRAPE_HEADERS,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`[WebScraper] ${domain} returned status ${response.status}`)
      return result
    }

    const html = await response.text()
    console.log(`[WebScraper] Fetched ${domain}: ${html.length} bytes`)
    const $ = cheerio.load(html)

    result.title = $('title').first().text().trim() || null
    result.metaDescription =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="twitter:description"]').attr('content')?.trim() ||
      null

    console.log(`[WebScraper] Title: ${result.title}`)
    console.log(`[WebScraper] Meta: ${result.metaDescription?.slice(0, 80)}`)

    // Location: scan footer and address tags before removing them
    const locationText = ($('footer').text() || '') + ' ' + ($('address').text() || '')
    const cityPattern = /(?:Abu\s*Dhabi|Dubai|Riyadh|Mumbai|Bangalore|Bengaluru|Delhi|Hyderabad|Chennai|Pune|London|Manchester|New\s*York|San\s*Francisco|Los\s*Angeles|Chicago|Seattle|Austin|Boston|Denver|Miami|Toronto|Vancouver|Berlin|Paris|Amsterdam|Singapore|Hong\s*Kong|Tokyo|Sydney|Melbourne|Tel\s*Aviv|Zurich|Stockholm|Copenhagen|São\s*Paulo|Mexico\s*City|Lagos|Nairobi|Cairo|Johannesburg|Jakarta|Bangkok|Seoul|Taipei|Kuala\s*Lumpur|Ho\s*Chi\s*Minh)/gi

    const footerLocs = locationText.match(cityPattern) || []
    result.locationHints.push(...footerLocs.slice(0, 3))

    $('script, style, noscript, iframe, svg').remove()
    const fullBodyText = $('body').text().replace(/\s+/g, ' ').trim()

    const bodyLocs = fullBodyText.match(cityPattern) || []
    for (const loc of bodyLocs.slice(0, 5)) {
      if (!result.locationHints.some(h => h.toLowerCase() === loc.toLowerCase())) {
        result.locationHints.push(loc)
      }
    }

    const hqMatches = fullBodyText.match(/(?:headquartered|based|located)\s+in\s+([A-Z][a-zA-Z\s,]+?)(?:\.|,|\s+and\s|\s+with\s)/g) || []
    for (const match of hqMatches.slice(0, 2)) {
      const clean = match.replace(/^(?:headquartered|based|located)\s+in\s+/i, '').replace(/[.,]$/, '').trim()
      if (clean.length > 2 && clean.length < 50) result.locationHints.unshift(clean)
    }

    $('nav, footer, header').remove()
    const heroSelectors = ['h1', 'h2', '.hero', '[class*="hero"]', 'main p', '.about', '[class*="about"]', 'p']
    const aboutParts: string[] = []
    for (const sel of heroSelectors) {
      $(sel).each((_, el) => {
        const text = $(el).text().trim()
        if (text.length > 20 && text.length < 500 && !aboutParts.includes(text)) {
          aboutParts.push(text)
        }
      })
      if (aboutParts.length >= 5) break
    }
    result.aboutText = aboutParts.slice(0, 5).join(' ') || null
    result.bodySnippet = fullBodyText.slice(0, 1500) || null

    $('[itemtype*="Organization"] [itemprop="address"]').each((_, el) => {
      result.locationHints.push($(el).text().trim())
    })

    console.log(`[WebScraper] Locations: ${JSON.stringify(result.locationHints)}`)
  } catch (err: any) {
    console.warn(`[WebScraper] Failed for ${domain}:`, err.message)
  }

  return result
}
