// ======================================
// Storage Module
// ======================================

import {
    saveCloudNotes,
    loadCloudNotes
} from "./puter.js?v=20260729-2";

const BACKUP_KEY = "notes-app-backup";

const DEFAULT_DATABASE = {
    notes: [],
    categories: [
        {
            id: "general",
            name: "General"
        }
    ],
    settings: {}
};


// ======================================
// Local Backup
// ======================================

function saveBackup(database) {

    localStorage.setItem(
        BACKUP_KEY,
        JSON.stringify(database)
    );

}


function sanitizeDatabase(data) {
    if (!data || typeof data !== "object") {
        return structuredClone(DEFAULT_DATABASE);
    }

    const notes = Array.isArray(data.notes) ? data.notes : [];
    let categories = Array.isArray(data.categories) ? data.categories : [];

    if (categories.length === 0) {
        categories = [{ id: "general", name: "General" }];
    } else {
        const hasGeneral = categories.some(cat => cat.id === "general" || cat.name?.toLowerCase() === "general");
        if (!hasGeneral) {
            categories.unshift({ id: "general", name: "General" });
        }
    }

    return {
        notes,
        categories,
        settings: data.settings && typeof data.settings === "object" ? data.settings : {}
    };
}


function loadBackup() {

    const data = localStorage.getItem(BACKUP_KEY);

    if (!data) {
        return structuredClone(DEFAULT_DATABASE);
    }

    try {

        const database = JSON.parse(data);

        return sanitizeDatabase(database);

    }

    catch {

        return structuredClone(DEFAULT_DATABASE);

    }

}


// ======================================
// Database Initialization
// ======================================

export async function initializeDatabase() {

    const database = await loadDatabase();

    await saveDatabase(database);

    return database;

}


// ======================================
// Load Database
// ======================================

export async function loadDatabase() {

    try {

        const database = await loadCloudNotes();

        const mergedDatabase = sanitizeDatabase(database);

        saveBackup(mergedDatabase);

        console.log("Loaded database from Puter.");

        return mergedDatabase;

    }

    catch (error) {

        console.warn("Cloud unavailable. Using local backup.");

        return loadBackup();

    }

}


// ======================================
// Save Database
// ======================================

export async function saveDatabase(database) {

    saveBackup(database);

    try {

        await saveCloudNotes(database);

        console.log("Saved database to Puter.");

    }

    catch (error) {

        console.error(error);

        console.warn("Saved locally only.");

    }

}