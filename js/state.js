// ======================================
// Application State
// ======================================

const defaultDatabase = {
    notes: [],
    categories: [
        {
            id: "general",
            name: "General"
        }
    ],
    settings: {}
};

export const state = {
    database: structuredClone(defaultDatabase),
    selectedNote: null,
    selectedCategoryId: "general"
};