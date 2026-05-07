const POPULAR_TERMS_KEY = 'sos-popular-search-terms-v1'

function getHistoryKey(user) {
  return user?.id ? `sos-search-history-user-${user.id}` : 'sos-search-history-guest'
}

export function readHistory(user) {
  try {
    const raw = localStorage.getItem(getHistoryKey(user))
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(user, terms) {
  localStorage.setItem(getHistoryKey(user), JSON.stringify(terms))
}

export function readPopularTerms() {
  try {
    const raw = localStorage.getItem(POPULAR_TERMS_KEY)
    const parsed = JSON.parse(raw || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePopularTerms(popularMap) {
  localStorage.setItem(POPULAR_TERMS_KEY, JSON.stringify(popularMap))
}

export function updateSearchStats(user, query) {
  const keyword = query.trim()
  if (!keyword) {
    return
  }

  const currentHistory = readHistory(user)
  const nextHistory = [keyword, ...currentHistory.filter((item) => item !== keyword)].slice(0, 8)
  writeHistory(user, nextHistory)

  const popularMap = readPopularTerms()
  popularMap[keyword] = Number(popularMap[keyword] || 0) + 1
  writePopularTerms(popularMap)
}

export function listTopPopularTerms(limit = 8) {
  return Object.entries(readPopularTerms())
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit)
    .map(([term]) => term)
}
