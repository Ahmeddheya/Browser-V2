export function resolveToUrlOrSearch(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'about:blank';
  
  const looksLikeUrl = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}([:\/\?#].*)?$/i.test(trimmed);
  
  if (looksLikeUrl) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function generateTabTitle(url: string): string {
  if (url === 'about:blank') return 'New Tab';
  if (url.includes('google.com/search')) return 'Google Search';
  
  const domain = extractDomain(url);
  return domain.replace('www.', '').split('.')[0] || 'New Tab';
}