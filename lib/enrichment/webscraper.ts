import * as cheerio from 'cheerio'

/**
 * Scrape the company's actual website to extract real information
 * like their description, location, industry keywords, and about text.
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
    // Try to fetch the homepage
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`https://${domain}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
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

    // Extract title
    result.title = $('title').first().text().trim() || null

    // Extract meta description — try multiple selectors
    result.metaDescription = 
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="twitter:description"]').attr('content')?.trim() ||
      null

    console.log(`[WebScraper] Title: ${result.title}`)
    console.log(`[WebScraper] Meta Description: ${result.metaDescription}`)

    // Extract location from footer BEFORE removing it
    const footerHtml = $('footer').text() || ''
    const addressEl = $('address').text() || ''
    const locationText = footerHtml + ' ' + addressEl
    
    // Scan for city/country mentions in footer and address
    const cityPatterns = /(?:Abu\s*Dhabi|Dubai|Riyadh|Mumbai|Bangalore|Bengaluru|Delhi|Hyderabad|Chennai|Pune|London|Manchester|New\s*York|San\s*Francisco|Los\s*Angeles|Chicago|Seattle|Austin|Boston|Denver|Miami|Toronto|Vancouver|Berlin|Paris|Amsterdam|Singapore|Hong\s*Kong|Tokyo|Sydney|Melbourne|Tel\s*Aviv|Zurich|Stockholm|Copenhagen|São\s*Paulo|Mexico\s*City|Lagos|Nairobi|Cairo|Johannesburg|Jakarta|Bangkok|Seoul|Taipei|Kuala\s*Lumpur|Ho\s*Chi\s*Minh)/gi
    
    const footerLocations = locationText.match(cityPatterns)
    if (footerLocations) {
      result.locationHints.push(...footerLocations.slice(0, 3))
    }

    // Remove scripts, styles, nav, footer to get clean body text for OTHER purposes
    $('script, style, noscript, iframe, svg').remove()

    // Get body text BEFORE removing structural elements
    const fullBodyText = $('body').text().replace(/\s+/g, ' ').trim()

    // Extract location hints from full body text
    const bodyLocations = fullBodyText.match(cityPatterns)
    if (bodyLocations) {
      // Deduplicate with footer locations
      for (const loc of bodyLocations.slice(0, 5)) {
        if (!result.locationHints.some(h => h.toLowerCase() === loc.toLowerCase())) {
          result.locationHints.push(loc)
        }
      }
    }

    // Also try "headquartered in" / "based in" patterns
    const hqMatches = fullBodyText.match(/(?:headquartered|based|located)\s+in\s+([A-Z][a-zA-Z\s,]+?)(?:\.|,|\s+and\s|\s+with\s)/g)
    if (hqMatches) {
      for (const match of hqMatches.slice(0, 2)) {
        const clean = match.replace(/^(?:headquartered|based|located)\s+in\s+/i, '').replace(/[.,]$/, '').trim()
        if (clean.length > 2 && clean.length < 50) {
          result.locationHints.unshift(clean) // prioritize explicit HQ mentions
        }
      }
    }

    // Try to get key about/hero text from the page
    $('nav, footer, header').remove()
    const heroSelectors = [
      'h1', 'h2', '.hero', '[class*="hero"]', '[class*="banner"]',
      'main p', '.about', '[class*="about"]', '[class*="description"]',
      'p'
    ]

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

    // Get a clean body text snippet (first 1500 chars)
    result.bodySnippet = fullBodyText.slice(0, 1500) || null

    // Also check structured data for location
    $('[itemtype*="Organization"] [itemprop="address"]').each((_, el) => {
      result.locationHints.push($(el).text().trim())
    })

    console.log(`[WebScraper] Location hints: ${JSON.stringify(result.locationHints)}`)
    console.log(`[WebScraper] About text length: ${result.aboutText?.length || 0}`)
    console.log(`[WebScraper] Body snippet length: ${result.bodySnippet?.length || 0}`)

  } catch (err: any) {
    console.warn(`[WebScraper] Failed for ${domain}:`, err.message)
  }

  return result
}
