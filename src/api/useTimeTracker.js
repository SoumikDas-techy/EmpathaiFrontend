import { useEffect, useRef } from 'react';

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

let flushed = false;

export default function useTimeTracker(userId) {
    const lastSyncRef = useRef(Date.now());
    const intervalRef = useRef(null);
    const userIdRef = useRef(userId);
    userIdRef.current = userId;

    useEffect(() => {
        if (!userId) return;

        lastSyncRef.current = Date.now();

        function flush() {
            const now = Date.now();
            const seconds = Math.floor((now - lastSyncRef.current) / 1000);
            if (seconds > 0) {
                lastSyncRef.current = now;
                sendTimeSpent(userIdRef.current, seconds);
            }
        }

        function guardedFlush() {
            if (flushed) return;
            flushed = true;
            flush();
            setTimeout(() => { flushed = false; }, 2000);
        }

        intervalRef.current = setInterval(flush, 60000);

        const handleVisibilityOrHide = () => {
            if (document.visibilityState === 'hidden') guardedFlush();
        };

        const handlePageHide = () => guardedFlush();

        document.addEventListener('visibilitychange', handleVisibilityOrHide);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            clearInterval(intervalRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityOrHide);
            window.removeEventListener('pagehide', handlePageHide);
            flush();
        };
    }, [userId]);
}