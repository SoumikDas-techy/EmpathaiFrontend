import { apiGet, apiPost, apiDelete } from './apiClient.js';

// ── STUDENT GOALS ─────────────────────────────────────────────────────────────

// Get all active goals for a student
export async function getGoals(studentId) {
    const res = await apiGet(`/api/activities/goals/${studentId}`);
    return res.data;
}

// Save a new goal
export async function saveGoal(studentId, goalText, subjectTag, targetDate) {
    const res = await apiPost('/api/activities/goals', {
        studentId,
        goalText,
        subjectTag,
        targetDate
    });
    return res.data;
}

// Delete a goal
export async function deleteGoal(studentId, goalId) {
    await apiDelete(`/api/activities/goals/${studentId}/${goalId}`);
}