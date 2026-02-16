'use client';
import React, { useState, useCallback } from 'react';
import SplashScreen from './SplashScreen';

export default function ClientShell({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);

    const handleFinish = useCallback(() => {
        setShowSplash(false);
    }, []);

    return (
        <>
            {showSplash && <SplashScreen onFinish={handleFinish} />}
            <div style={{ display: showSplash ? 'none' : 'contents' }}>
                {children}
            </div>
        </>
    );
}
