import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIpInfo } from '@/lib/apis/ipapi'
import { getCompanyLogo } from '@/lib/apis/clearbit'
import { searchWikipedia } from '@/lib/apis/wikipedia'
import { searchCompanyNews } from '@/lib/apis/serpapi'
import { detectTechStack, scrapeBuiltWith } from '@/lib/enrichment/techstack'
import { inferPersona } from '@/lib/enrichment/persona'
import { scoreIntent } from '@/lib/enrichment/intent'
import { analyzeAccountData } from '@/lib/enrichment/ai'
import { scrapeCompanyWebsite, scrapeLeadership, extractLeadershipFromWikipedia } from '@/lib/enrichment/webscraper'
import { detectIndustryFromText, generateSummaryFromScrapedData } from '@/lib/enrichment/classifier'

// ISPs and generic cloud providers — not B2B companies
const COMMON_ISPS = [
  'comcast', 'verizon', 'att', 'at&t', 'spectrum', 't-mobile', 'cox', 'charter',
  'centurylink', 'frontier', 'windstream', 'mediacom', 'suddenlink', 'optimum', 'xfinity',
  'google fiber', 'google llc', 'amazon.com', 'amazon technologies', 'microsoft corporation',
  'aws', 'azure', 'digitalocean', 'linode', 'hetzner', 'ovh', 'cloudflare', 'fastly', 'akamai',
  'reliance jio', 'jio', 'bharti airtel', 'airtel', 'bsnl', 'hathway', 'act fibernet', 'vodafone', 'idea cellular'
]

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Auth is optional for demo mode — if logged in (or called from /api/track), we save to DB
    let userId: string | null = null

    // Internal calls from /api/track pass the user ID via a trusted header
    const internalUserId = request.headers.get('x-internal-user-id')
    if (internalUserId) {
      userId = internalUserId
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null
      } catch {
        // Auth failed — continue in demo mode without saving to DB
      }
    }

    const body = await request.json()
    const { type, input, domain: customDomain } = body // type: 'visitor' | 'company', input: object | string
    
    // Default empty objects
    let visitorData: any = {}
    let companyMetadata: any = {}
    let techStackData: any = {}
    let businessSignalsData: any[] = []
    
    let companyName = ''
    let domain = customDomain ? customDomain.toLowerCase().trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : ''

    // ═══════════════════════════════════════════════
    // STEP 1: Company Identification
    // ═══════════════════════════════════════════════
    if (type === 'visitor') {
      if (!input || typeof input !== 'object') {
        return NextResponse.json({ error: 'Visitor input must be an object' }, { status: 400 })
      }
      if (!input.ip_address || typeof input.ip_address !== 'string') {
        return NextResponse.json({ error: 'ip_address is required for visitor type' }, { status: 400 })
      }
      visitorData = input
      const ipData = await getIpInfo(input.ip_address)
      
      let orgName = ipData?.org || ''
      // Clean org name: remove AS numbers like "AS14618 Amazon.com, Inc."
      orgName = orgName.replace(/^AS\d+\s+/i, '').trim()
      
      // Special case: If testing locally or from a private IP, mock a real company
      // so the user can test the intelligence pipeline without a corporate VPN.
      const isLocal = ipData?.query === '127.0.0.1' || ipData?.query === '::1' || 
                     /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ipData?.query || '') ||
                     !ipData;

      if (isLocal) {
        orgName = 'Stripe'
        domain = 'stripe.com'
        companyMetadata.note = 'MOCK LOCAHOST DATA: Showing Stripe as fallback for local testing'
      }

      const isISP = COMMON_ISPS.some(isp => orgName.toLowerCase().includes(isp))
      
      if (orgName && !isISP) {
        companyName = orgName
        companyMetadata.location = isLocal ? 'San Francisco, CA, United States' : [ipData.city, ipData.regionName, ipData.country].filter(Boolean).join(', ')
        companyMetadata.ip_resolved = true
      } else {
        // Graceful fallback for consumer IPs — still process with what we have
        companyName = 'Unknown Company'
        companyMetadata.is_unknown = true
        companyMetadata.ip_org = orgName || 'Unresolvable'
        companyMetadata.location = ipData ? [ipData.city, ipData.regionName, ipData.country].filter(Boolean).join(', ') : 'Unknown'
        companyMetadata.note = 'IP belongs to a consumer ISP or could not be resolved to a B2B entity. Enrichment based on visitor behavior only.'
      }

      // Log visitor if authenticated
      if (userId) {
        await supabase.from('visitors').insert({
          user_id: userId,
          ip_address: input.ip_address,
          visitor_id: input.visitor_id || null,
          pages_visited: input.pages_visited,
          dwell_time_seconds: input.dwell_time_seconds,
          visits_this_week: input.visits_this_week,
          referral_source: input.referral_source
        }).then(({ error }) => {
          if (error) console.warn('Failed to log visitor (non-blocking):', error.message)
        })
      }

    } else if (type === 'company') {
      companyName = (typeof input === 'string' ? input : input?.name || '').trim()
    } else {
      return NextResponse.json({ error: 'Invalid type. Must be "visitor" or "company".' }, { status: 400 })
    }

    if (!companyName) {
      return NextResponse.json({ error: 'Company name or visitor data required' }, { status: 400 })
    }

    // ═══════════════════════════════════════════════
    // STEP 2 & 3: Deterministic Inference & Scoring
    // ═══════════════════════════════════════════════
    if (type === 'company') {
      // Create a deterministic pseudo-random number (0.0 - 1.0) from the company name
      const cleanNameStr = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
      let hash = 0
      for (let i = 0; i < cleanNameStr.length; i++) hash = Math.imul(31, hash) + cleanNameStr.charCodeAt(i) | 0
      const seededRand = () => { hash = Math.imul(hash ^ (hash >>> 15), 0x735a2d97); return ((hash ^ (hash >>> 15)) >>> 0) / 4294967296 }
      
      const rand1 = seededRand(); const rand2 = seededRand(); const rand3 = seededRand()

      // Generate realistic mock visitor data that varies per company
      const possiblePages = [
        ['/pricing', '/enterprise'],
        ['/blog', '/about'],
        ['/docs', '/api'],
        ['/case-studies', '/pricing'],
        ['/demo', '/pricing', '/enterprise'],
        ['/docs', '/security', '/compliance'],
        ['/blog', '/case-studies'],
        ['/pricing', '/demo', '/roi-calculator']
      ]
      const possibleReferrals = ['linkedin', 'google', 'direct', 'twitter']
      
      visitorData = {
        pages_visited: possiblePages[Math.floor(rand1 * possiblePages.length)],
        dwell_time_seconds: Math.floor(rand2 * 300) + 15, // 15s to 315s
        visits_this_week: Math.floor(rand3 * 5) + 1, // 1 to 6 visits
        referral_source: possibleReferrals[Math.floor(seededRand() * possibleReferrals.length)]
      }
    }

    let pagesVisited = visitorData.pages_visited || []
    let dwellTime = visitorData.dwell_time_seconds || 0
    let visitsThisWeek = visitorData.visits_this_week || 0
    let referralSource = visitorData.referral_source || ''

    const personaResult = inferPersona(pagesVisited)
    
    const intentResult = scoreIntent({
      pages_visited: pagesVisited,
      dwell_time_seconds: dwellTime,
      visits_this_week: visitsThisWeek,
      referral_source: referralSource
    })

    // ═══════════════════════════════════════════════
    // STEP 4: Company Profile Enrichment (parallel)
    // ═══════════════════════════════════════════════
    if (!domain && !companyMetadata.is_unknown) {
      if (companyName.includes('.')) {
        // User typed a domain-like string or full URL (e.g., "https://www.autovrse.com/")
        let cleanDomain = companyName.toLowerCase().trim()
        
        // Strip protocols, www, and trailing paths/slashes
        cleanDomain = cleanDomain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]
        
        domain = cleanDomain
        companyName = cleanDomain.split('.')[0]
        companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1)
      } else {
        // Fallback guess
        domain = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      }
    }
    
    // Fire all enrichment calls in parallel for speed
    const [wikiData, newsData, logoUrl, techStack, builtWithStack, websiteData, leadershipFromPages] = await Promise.all([
      searchWikipedia(companyName).catch((e) => { console.warn('[ENRICH] Wikipedia fetch failed:', e.message); return null }),
      searchCompanyNews(companyName).catch((e) => { console.warn('[ENRICH] News fetch failed:', e.message); return [] }),
      domain ? getCompanyLogo(domain) : Promise.resolve(null),
      domain ? detectTechStack(`https://${domain}`).catch((e) => { console.warn('[ENRICH] TechStack detection failed:', e.message); return {} }) : Promise.resolve({}),
      domain ? scrapeBuiltWith(domain).catch((e) => { console.warn('[ENRICH] BuiltWith scrape failed:', e.message); return {} }) : Promise.resolve({}),
      domain ? scrapeCompanyWebsite(domain).catch((e) => { console.warn('[ENRICH] Website scrape failed:', e.message); return null }) : Promise.resolve(null),
      domain ? scrapeLeadership(domain).catch((e) => { console.warn('[ENRICH] Leadership scrape failed:', e.message); return [] }) : Promise.resolve([]),
    ])

    if (wikiData) {
      companyMetadata.description = wikiData.extract || wikiData.snippet
      if (companyMetadata.description) {
        const foundedMatch = companyMetadata.description.match(/founded\s+(?:in\s+)?(\d{4})/i)
        if (foundedMatch) companyMetadata.founded_year = parseInt(foundedMatch[1])

        const hqMatch = companyMetadata.description.match(/headquartered\s+in\s+([^.]+)/i)
        if (hqMatch && !companyMetadata.location) companyMetadata.headquarters = hqMatch[1].trim()
      }
    }

    // Merge leadership: scraped pages + Wikipedia text extraction (deduplicated)
    const leadershipFromWiki = extractLeadershipFromWikipedia(wikiData?.extract)
    const allLeadership = [...new Set([...leadershipFromPages, ...leadershipFromWiki])]
    if (allLeadership.length > 0) {
      companyMetadata.leadershipHints = allLeadership
      console.log(`[ENRICH] Leadership found: ${allLeadership.join(', ')}`)
    }

    // Use scraped website data to enrich metadata
    if (websiteData) {
      console.log(`[ENRICH] WebScraper returned data for ${domain}:`, 
        { title: websiteData.title, desc: websiteData.metaDescription?.slice(0, 80), locations: websiteData.locationHints, aboutLen: websiteData.aboutText?.length, snippetLen: websiteData.bodySnippet?.length })
      
      if (!companyMetadata.description && websiteData.metaDescription) {
        companyMetadata.description = websiteData.metaDescription
      }
      if (!companyMetadata.description && websiteData.aboutText) {
        companyMetadata.description = websiteData.aboutText
      }
      if (websiteData.locationHints.length > 0 && !companyMetadata.headquarters && !companyMetadata.location) {
        companyMetadata.headquarters = websiteData.locationHints[0]
      }
      // Store scraped data for AI prompt
      companyMetadata.websiteTitle = websiteData.title
      companyMetadata.websiteSnippet = websiteData.bodySnippet?.slice(0, 800)
    } else {
      console.log(`[ENRICH] WebScraper returned NULL for ${domain}`)
    }
    
    console.log(`[ENRICH] After scraping - description: ${companyMetadata.description?.slice(0,80)}, HQ: ${companyMetadata.headquarters}, location: ${companyMetadata.location}`)
    
    businessSignalsData = Array.isArray(newsData) ? newsData.map((n: any) => n.title || n) : []

    // Merge signature detection + BuiltWith — BuiltWith has more coverage, signature detection is fallback
    techStackData = { ...(techStack || {}), ...(builtWithStack || {}) }
    console.log(`[ENRICH] Tech stack: ${Object.keys(techStackData).length} technologies (${Object.keys(techStack || {}).length} signature + ${Object.keys(builtWithStack || {}).length} BuiltWith)`)

    // ═══════════════════════════════════════════════
    // STEP 5 & 6: AI Summary + Recommended Actions
    // ═══════════════════════════════════════════════
    const aiAnalysis = await analyzeAccountData({
      companyName,
      domain: domain || undefined,
      visitorData,
      companyData: companyMetadata,
      techStack: techStackData,
      businessSignals: businessSignalsData,
      preComputedPersona: personaResult,
      preComputedIntent: intentResult,
    })

    // ═══════════════════════════════════════════════
    // STEP 7: Save to Database (if authenticated)
    // ═══════════════════════════════════════════════
    
    // Detect industry from REAL scraped website content
    const scrapedText = [companyMetadata.description, companyMetadata.websiteSnippet, companyMetadata.websiteTitle].filter(Boolean).join(' ')
    const detectedIndustry = detectIndustryFromText(scrapedText)
    
    // Priority: AI result > scraped detection > fallback
    const enrichedIndustry = (aiAnalysis.companyProfile?.industry && aiAnalysis.companyProfile.industry !== 'Unknown' && aiAnalysis.companyProfile.industry !== 'Unknown Industry')
      ? aiAnalysis.companyProfile.industry
      : (detectedIndustry !== 'Unknown' ? detectedIndustry : null)
    
    const enrichedSize = (aiAnalysis.companyProfile?.estimatedSize && aiAnalysis.companyProfile.estimatedSize !== 'Unknown')
      ? aiAnalysis.companyProfile.estimatedSize
      : null
    
    const enrichedHQ = (aiAnalysis.companyProfile?.headquarters && aiAnalysis.companyProfile.headquarters !== 'Unknown' && aiAnalysis.companyProfile.headquarters !== 'Unknown Location')
      ? aiAnalysis.companyProfile.headquarters
      : (companyMetadata.headquarters || companyMetadata.location || null)

    // Generate a proper summary from scraped data if AI summary is generic/fallback
    const isAISummaryGeneric = !aiAnalysis.aiSummary || aiAnalysis.aiSummary.includes('mid-sized B2B company') || aiAnalysis.aiSummary.includes('Unknown') || aiAnalysis.aiSummary.includes('temporarily unavailable')
    const finalSummary = isAISummaryGeneric
      ? generateSummaryFromScrapedData(companyName, companyMetadata.description, enrichedHQ, enrichedIndustry || 'B2B', intentResult?.stage || null, intentResult?.score || null)
      : aiAnalysis.aiSummary

    console.log(`[ENRICH] FINAL VALUES - Industry: ${enrichedIndustry}, HQ: ${enrichedHQ}, DetectedIndustry: ${detectedIndustry}, AI Industry: ${aiAnalysis.companyProfile?.industry}, GenericSummary: ${isAISummaryGeneric}`)

    // Build the result object
    const accountResult: any = {
      id: crypto.randomUUID(),
      name: companyName,
      domain: domain || null,
      industry: enrichedIndustry,
      size: enrichedSize,
      description: companyMetadata.description || null,
      founded_year: companyMetadata.founded_year || null,
      logo_url: logoUrl || null,
      headquarters: enrichedHQ,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const enrichmentResult: any = {
      id: crypto.randomUUID(),
      account_id: accountResult.id,
      intent_score: aiAnalysis.intentScore,
      intent_stage: aiAnalysis.intentStage,
      likely_persona: aiAnalysis.likelyPersona,
      persona_confidence: aiAnalysis.personaConfidence,
      ai_summary: finalSummary,
      recommended_actions: aiAnalysis.recommendedActions,
      tech_stack: techStackData,
      business_signals: aiAnalysis.extractedBusinessSignals,
      raw_visitor_data: {
        ...visitorData,
        _meta: {
          preComputedPersona: personaResult,
          preComputedIntent: intentResult,
          companyProfile: aiAnalysis.companyProfile,
          visitorProfileAnalysis: aiAnalysis.visitorProfileAnalysis,
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // If authenticated (or called via internal API track), persist to Supabase
    if (userId) {
      try {
        // Create an admin client because server-to-server calls don't have auth cookies
        // We MUST bypass RLS to save the trackings to the user's account
        const { createClient: createAdminClient } = require('@supabase/supabase-js')
        const adminSupabase = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: accountData, error: accountError } = await adminSupabase
          .from('accounts')
          .insert({
            user_id: userId,
            name: companyName,
            domain: domain || null,
            industry: enrichedIndustry,
            size: enrichedSize,
            description: companyMetadata.description || null,
            founded_year: companyMetadata.founded_year || null,
            logo_url: logoUrl || null,
            headquarters: enrichedHQ
          })
          .select()
          .single()

        if (!accountError && accountData) {
          accountResult.id = accountData.id
          enrichmentResult.account_id = accountData.id

          const { data: enrichmentData, error: enrichmentError } = await adminSupabase
            .from('enrichments')
            .insert({
              account_id: accountData.id,
              user_id: userId,
              ...enrichmentResult,
            })
            .select()
            .single()

          if (enrichmentError) {
            console.warn('Enrichment insert failed (non-blocking):', enrichmentError.message)
          } else if (enrichmentData) {
            enrichmentResult.id = enrichmentData.id
          }
        }
      } catch (dbError: any) {
        console.warn('DB save failed (non-blocking):', dbError.message)
        // Pipeline still returns results even if DB save fails
      }
    }

    // Return combined result
    return NextResponse.json({
      ...accountResult,
      enrichments: [enrichmentResult]
    })

  } catch (error: any) {
    console.error('Enrichment API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
