import { initUI } from "./ui.js?v=20260730-4";
import { registerServiceWorker } from "./utils.js?v=20260730-4";
import { isSignedIn, signIn } from "./puter.js?v=20260730-4";
import { initializeDatabase } from "./storage.js?v=20260730-4";
import { state } from "./state.js?v=20260730-4";

document.addEventListener("DOMContentLoaded", async () => {

    puter.quiet = true;

    registerServiceWorker();

    try {

        let signedIn = false;

        try {
            signedIn = await isSignedIn();
        } catch (error) {
            console.warn("Puter sign-in check unavailable; continuing locally.", error);
        }

        if (!signedIn) {
            try {
                await signIn();
            } catch (error) {
                console.warn("Puter sign-in was skipped or canceled; continuing locally.", error);
            }
        }

        console.log("✅ Puter Ready");

        state.database = await initializeDatabase();
        console.log("Database initialized", state.database);

        await initUI();

    } catch (err) {

        console.error(err);

    }

});