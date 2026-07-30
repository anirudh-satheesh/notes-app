// ===============================
// Utility Functions
// ===============================

// Register Service Worker

export async function registerServiceWorker() {

    if (!("serviceWorker" in navigator)) {
        return;
    }

    try {

        await navigator.serviceWorker.register("/service-worker.js?v=20260729-1");

        console.log("Service Worker Registered");

    }

    catch (error) {

        console.error("Service Worker Failed", error);

    }

}


// Simple ID Generator

export function generateId() {

    return crypto.randomUUID();

}


// Format Date

export function formatDate(date = new Date()) {

    return new Intl.DateTimeFormat("en-IN", {

        day: "2-digit",
        month: "short",
        year: "numeric"

    }).format(date);

}