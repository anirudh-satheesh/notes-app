// ======================================
// Puter Module
// Handles authentication and cloud storage
// ======================================

const DATABASE_KEY = "notes-app:database";


// ======================================
// Authentication
// ======================================

/**
 * Check if the user is signed in
 */
export async function isSignedIn() {
    return await puter.auth.isSignedIn();
}


/**
 * Sign in to Puter
 */
export async function signIn() {
    return await puter.auth.signIn();
}


/**
 * Sign out from Puter
 */
export async function signOut() {
    return await puter.auth.signOut();
}


// ======================================
// Cloud Storage
// ======================================

/**
 * Save database to Puter KV Store
 * @param {Object} database
 */
export async function saveCloudNotes(database) {

    await puter.kv.set(
        DATABASE_KEY,
        JSON.stringify(database)
    );

}


/**
 * Load database from Puter KV Store
 * @returns {Object}
 */
export async function loadCloudNotes() {

    const data = await puter.kv.get(DATABASE_KEY);

    if (!data) {

        return {
            notes: [],
            categories: [
                {
                    id: "general",
                    name: "General"
                }
            ],
            settings: {}
        };

    }

    try {

        return JSON.parse(data);

    }

    catch (err) {

        console.error("Failed to parse cloud database:", err);

        return {
            notes: [],
            categories: [
                {
                    id: "general",
                    name: "General"
                }
            ],
            settings: {}
        };

    }

}