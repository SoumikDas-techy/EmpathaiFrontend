
import { useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:8081';

async function sendTimeSpent(userId, seconds) {
    if (!userId || seconds <= 0) return;

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
        await fetch(`${API_BASE}/api/users/${userId}/time-spent`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ seconds }),
            keepalive: true,           // crucial for background sends
        });
    } catch (err) {
        console.warn('Time-spent sync failed:', err);
        // Do NOT throw — analytics should never break the app
    }
}

export default function useTimeTracker(userId) {
    const lastSyncRef = useRef(Date.now());
    const intervalRef = useRef(null);

    const flush = useCallback(async () => {
        const now = Date.now();
        const secondsSinceLastSync = Math.floor((now - lastSyncRef.current) / 1000);

        if (secondsSinceLastSync > 0) {
            lastSyncRef.current = now;
            await sendTimeSpent(userId, secondsSinceLastSync);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        lastSyncRef.current = Date.now();

        // Auto-sync every 60 seconds while active
        intervalRef.current = setInterval(flush, 60_000);

        // Better unload handling: visibilitychange + pagehide
        const handleVisibilityOrHide = () => {
            if (document.visibilityState === 'hidden' ||
                (typeof document.visibilityState === 'undefined' && document.hidden)) {
                flush();
            }
        };

        const handlePageHide = () => {
            flush();   // final flush when page is being discarded
        };

        document.addEventListener('visibilitychange', handleVisibilityOrHide);
        window.addEventListener('pagehide', handlePageHide);   // modern alternative to beforeunload

        // Final flush on unmount (in-app navigation / logout)
        return () => {
            clearInterval(intervalRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityOrHide);
            window.removeEventListener('pagehide', handlePageHide);
            flush();
        };
    }, [userId, flush]);
}