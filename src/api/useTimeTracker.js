import { useEffect, useRef, useCallback } from 'react';

async function sendTimeSpent(userId, seconds) {
    if (!userId || seconds <= 0) return;

    try {
        const token = localStorage.getItem('access_token') || '';
        await fetch('/api/users/' + userId + '/time-spent', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: 'Bearer ' + token }),
            },
            body: JSON.stringify({ seconds }),
            keepalive: true,
        });
    } catch (err) {
        console.warn('Time-spent sync failed:', err);
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

        // Auto-sync every 60 seconds
        intervalRef.current = setInterval(flush, 60000);

        const handleVisibilityOrHide = () => {
            if (document.visibilityState === 'hidden') {
                flush();
            }
        };

        const handlePageHide = () => {
            flush();
        };

        document.addEventListener('visibilitychange', handleVisibilityOrHide);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            clearInterval(intervalRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityOrHide);
            window.removeEventListener('pagehide', handlePageHide);
            flush();
        };
    }, [userId, flush]);
}