export async function getCompanyLogo(domain: string) {
  if (!domain) return null
  
  // Logo.dev API — high-quality company logos
  const cleanDomain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0]
  return `https://img.logo.dev/${cleanDomain}?token=pk_KrI8kf_6TRSChTxR4HOomA&size=128&format=png`
}
