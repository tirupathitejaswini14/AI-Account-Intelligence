export async function getCompanyLogo(domain: string) {
  if (!domain) return null
  
  // Clearbit Logo API is free and doesn't require authentication for logos
  const cleanDomain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0]
  return `https://logo.clearbit.com/${cleanDomain}`
}
