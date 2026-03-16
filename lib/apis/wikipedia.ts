export async function searchWikipedia(companyName: string) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="${encodeURIComponent(companyName)} company"&utf8=&format=json`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const firstResult = data.query?.search?.[0]
    
    if (!firstResult) return null

    // Fetch the actual page extract for the top result
    const pageId = firstResult.pageid
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&pageids=${pageId}&format=json`
    const extractResponse = await fetch(extractUrl)
    const extractData = await extractResponse.json()
    
    const pages = extractData.query?.pages
    if (pages && pages[pageId]) {
       return {
         title: pages[pageId].title,
         extract: pages[pageId].extract,
         snippet: firstResult.snippet.replace(/<\/?[^>]+(>|$)/g, "") // remove HTML
       }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching Wikipedia data:', error)
    return null
  }
}
