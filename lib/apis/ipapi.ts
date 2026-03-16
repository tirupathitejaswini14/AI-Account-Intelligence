export async function getIpInfo(ip: string) {
  try {
    // ip-api.com allows 45 requests per minute from an IP address
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch IP info: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.status === 'fail') {
      console.warn(`IP Lookup failed: ${data.message}`)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getIpInfo:', error)
    return null
  }
}
