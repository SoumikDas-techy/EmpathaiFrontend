import { apiRequest, getAccessToken } from './apiClient'

const BASE = '/api/rewards'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// ── Badges ────────────────────────────────────────────────────────────────────

export async function fetchBadges() {
  const res = await apiRequest(`${BASE}/badges`)
  if (!res.ok) throw new Error('Failed to fetch badges')
  return res.json()
}

export async function createBadge({ title, description, triggerType, triggerValue, triggerTitle, imageFile }) {
  const form = new FormData()
  form.append('title', title)
  if (description) form.append('description', description)
  form.append('triggerType', triggerType)
  form.append('triggerValue', triggerValue)
  if (triggerTitle) form.append('triggerTitle', triggerTitle)
  if (imageFile) form.append('image', imageFile)

  const res = await apiRequest(`${BASE}/badges`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Failed to create badge')
  return res.json()
}

export async function updateBadge(id, { title, description, triggerType, triggerValue, triggerTitle, imageFile }) {
  const form = new FormData()
  form.append('title', title)
  if (description) form.append('description', description)
  form.append('triggerType', triggerType)
  form.append('triggerValue', triggerValue)
  if (triggerTitle) form.append('triggerTitle', triggerTitle)
  if (imageFile) form.append('image', imageFile)

  const res = await apiRequest(`${BASE}/badges/${id}`, { method: 'PUT', body: form })
  if (!res.ok) throw new Error('Failed to update badge')
  return res.json()
}

export async function deleteBadge(id) {
  const res = await apiRequest(`${BASE}/badges/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete badge')
}

// ── Student Badges ─────────────────────────────────────────────────────────────
// GET /api/rewards/students/{studentId}/badges
// This endpoint is permitAll on the backend — no auth required.
// We intentionally do NOT send the Authorization header here because an expired
// or invalid JWT causes Spring Security to reject the request with 403 even on
// permitAll routes (the JWT filter throws, leaving the request unauthenticated,
// which then hits the anyRequest().authenticated() fallback).

export async function fetchStudentBadges(studentId) {
  const url = `${BASE_URL}${BASE}/students/${studentId}/badges`

  // First try: plain fetch with no token (the endpoint is public)
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })

  // If it works, great
  if (res.ok) return res.json()

  // If plain fetch fails (e.g. server requires auth after all), retry with token
  if (res.status === 401 || res.status === 403) {
    const token = getAccessToken()
    if (token) {
      const retryRes = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (retryRes.ok) return retryRes.json()
      throw new Error(`Failed to fetch student badges (HTTP ${retryRes.status})`)
    }
  }

  throw new Error(`Failed to fetch student badges (HTTP ${res.status})`)
}

// ── Achievements ──────────────────────────────────────────────────────────────

export async function fetchAchievements() {
  const res = await apiRequest(`${BASE}/achievements`)
  if (!res.ok) throw new Error('Failed to fetch achievements')
  return res.json()
}

export async function createAchievement({ title, description, imageFile }) {
  const form = new FormData()
  form.append('title', title)
  form.append('description', description)
  if (imageFile) form.append('image', imageFile)

  const res = await apiRequest(`${BASE}/achievements`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Failed to create achievement')
  return res.json()
}

export async function updateAchievement(id, { title, description, imageFile }) {
  const form = new FormData()
  form.append('title', title)
  form.append('description', description)
  if (imageFile) form.append('image', imageFile)

  const res = await apiRequest(`${BASE}/achievements/${id}`, { method: 'PUT', body: form })
  if (!res.ok) throw new Error('Failed to update achievement')
  return res.json()
}

export async function deleteAchievement(id) {
  const res = await apiRequest(`${BASE}/achievements/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete achievement')
}