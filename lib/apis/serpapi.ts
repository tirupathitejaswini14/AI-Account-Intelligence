export async function searchCompanyNews(companyName: string) {
  const apiKey = process.env.SERPAPI_KEY
  
  if (!apiKey) {
    console.warn('SERPAPI_KEY is not set. Skipping news search.')
    return []
  }

  try {
    const query = encodeURIComponent(`${companyName} company news OR press release OR acquisition`)
    const response = await fetch(`https://serpapi.com/search.json?q=${query}&tbm=nws&api_key=${apiKey}`)
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Return top 3 news items
    return (data.news_results || []).slice(0, 3).map((item: any) => ({
      title: item.title,
      source: item.source,
      date: item.date,
      link: item.link,
      snippet: item.snippet
    }))
  } catch (error) {
    console.error('Error fetching company news:', error)
    return []
  }
}
