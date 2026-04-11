import { apiRequest } from './apiClient'

const BASE = '/api/rewards'

// ── Badges (admin CRUD) ───────────────────────────────────────────────────────

export async function fetchBadges() {
  const res = await apiRequest(`${BASE}/badges`)
  if (!res.ok) throw new Error('Failed to fetch badges')
  return res.json()
}

export async function createBadge({ title, triggerType, triggerTitle, imageFile }) {
  const form = new FormData()
  form.append('title', title)
  form.append('triggerType', triggerType)
  form.append('triggerTitle', triggerTitle)
  if (imageFile) form.append('image', imageFile)

  const res = await apiRequest(`${BASE}/badges`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Failed to create badge')
  return res.json()
}

export async function updateBadge(id, { title, triggerType, triggerTitle, imageFile }) {
  const form = new FormData()
  form.append('title', title)
  form.append('triggerType', triggerType)
  form.append('triggerTitle', triggerTitle)
  if (imageFile) form.append('image', imageFile)

  const res = await apiRequest(`${BASE}/badges/${id}`, { method: 'PUT', body: form })
  if (!res.ok) throw new Error('Failed to update badge')
  return res.json()
}

export async function deleteBadge(id) {
  const res = await apiRequest(`${BASE}/badges/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete badge')
}

// ── Student Badges ────────────────────────────────────────────────────────────
// Uses apiRequest() (not raw fetch) so the Vite proxy routes correctly
// to the backend and the JWT Bearer token is automatically injected.
// The old code used raw fetch('http://localhost:8080/...') which:
//   1. Bypassed the Vite proxy → caused CORS errors in production
//   2. Did not attach the Authorization header → backend returned 403

export async function fetchStudentBadges(studentId) {
  const res = await apiRequest(`${BASE}/students/${studentId}/badges`)
  if (!res.ok) throw new Error(`Failed to fetch student badges (HTTP ${res.status})`)
  return res.json()
}

// ── Achievements (admin CRUD) ─────────────────────────────────────────────────

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