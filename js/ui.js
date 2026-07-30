// ======================================
// UI Module
// ======================================

import { saveDatabase } from "./storage.js?v=20260730-4";
import { state } from "./state.js?v=20260730-4";
import {
    initCategories,
    getFilteredNotes,
    setSearchQuery,
    getSearchQuery
} from "./categories.js?v=20260730-4";

const elements = {

    // Desktop
    notesListDesktop: document.getElementById("notesListDesktop"),
    noteTitleDesktop: document.getElementById("noteTitleDesktop"),
    noteContentDesktop: document.getElementById("noteContentDesktop"),
    saveBtnDesktop: document.getElementById("saveBtnDesktop"),

    // Categories
    categoriesContainer: document.getElementById("categoriesContainer"),
    addCategoryBtn: document.getElementById("addCategoryBtn"),

    // Search
    searchInput: document.getElementById("searchInput"),
    searchInputDesktop: document.getElementById("searchInputDesktop"),
    searchInputMobile: document.getElementById("searchInputMobile"),

    // Mobile category selector
    mobileCategoryBtn: document.getElementById("mobileCategoryBtn"),
    mobileCategoryList: document.getElementById("mobileCategoryList"),

    // Mobile
    notesListMobile: document.getElementById("notesListMobile"),
    mobileListView: document.getElementById("mobileListView"),
    mobileEditorView: document.getElementById("mobileEditorView"),
    noteTitleMobile: document.getElementById("noteTitleMobile"),
    noteContentMobile: document.getElementById("noteContentMobile"),
    saveBtnMobile: document.getElementById("saveBtnMobile"),
    deleteBtnMobile: document.getElementById("deleteBtnMobile"),
    backBtn: document.getElementById("backBtn"),

    // Shared
    newNoteBtn: document.getElementById("newNoteBtn"),
    fab: document.getElementById("fab")
};

// ======================================

export async function initUI() {

    registerEvents();

    initCategories(elements, renderNotes, selectNote);

    const initialQuery = elements.searchInput?.value || elements.searchInputDesktop?.value || elements.searchInputMobile?.value || "";
    setSearchQuery(initialQuery);

    const notes = getFilteredNotes();
    const emptyMessage = initialQuery.trim().length > 0
        ? "No matching notes found."
        : "No notes in this category.";

    state.selectedNote = null;
    clearEditor();

}

function handleSearchInput(event) {
    const query = event.target.value;
    setSearchQuery(query);

    if (elements.searchInput && elements.searchInput !== event.target) {
        elements.searchInput.value = query;
    }
    if (elements.searchInputDesktop && elements.searchInputDesktop !== event.target) {
        elements.searchInputDesktop.value = query;
    }
    if (elements.searchInputMobile && elements.searchInputMobile !== event.target) {
        elements.searchInputMobile.value = query;
    }

    updateResultsForSearch();
}

function updateResultsForSearch() {
    const query = getSearchQuery();
    const notes = getFilteredNotes();
    const emptyState = query.trim().length > 0
        ? "No matching notes found."
        : "No notes in this category.";

    renderNotes(notes, emptyState);

    if (notes.length > 0) {
        const selectedStillAvailable = state.selectedNote && notes.some(note => note.id === state.selectedNote.id);
        if (!selectedStillAvailable) {
            state.selectedNote = null;
            clearEditor();
        }
    } else {
        state.selectedNote = null;
        clearEditor();
    }
}

function toggleMobileCategoryList() {
    if (!elements.mobileCategoryList) return;
    const isOpen = !elements.mobileCategoryList.classList.contains("hidden");
    elements.mobileCategoryList.classList.toggle("hidden", isOpen);
}

function handleDocumentClickForMobileCategories(event) {
    if (!elements.mobileCategoryList || !elements.mobileCategoryBtn) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    if (elements.mobileCategoryBtn.contains(target) || elements.mobileCategoryList.contains(target)) {
        return;
    }

    elements.mobileCategoryList.classList.add("hidden");
}
// ======================================

function registerEvents() {

    elements.newNoteBtn?.addEventListener("click", createNewNote);
    elements.fab?.addEventListener("click", createNewNote);

    elements.backBtn?.addEventListener("click", closeMobileEditor);

    elements.saveBtnDesktop?.addEventListener("click", saveCurrentNote);
    elements.saveBtnMobile?.addEventListener("click", saveCurrentNote);
    elements.deleteBtnMobile?.addEventListener("click", () => {
        void deleteCurrentNote();
    });

    elements.searchInput?.addEventListener("input", handleSearchInput);
    elements.searchInputDesktop?.addEventListener("input", handleSearchInput);
    elements.searchInputMobile?.addEventListener("input", handleSearchInput);

    elements.noteTitleDesktop?.addEventListener("input", syncEditorFields);
    elements.noteContentDesktop?.addEventListener("input", syncEditorFields);
    elements.noteTitleMobile?.addEventListener("input", syncEditorFields);
    elements.noteContentMobile?.addEventListener("input", syncEditorFields);

    elements.mobileCategoryBtn?.addEventListener("click", toggleMobileCategoryList);
    document.addEventListener("click", handleDocumentClickForMobileCategories);

}

function syncEditorFields(event) {
    const isMobileInput = event.target === elements.noteTitleMobile || event.target === elements.noteContentMobile;

    if (isMobileInput) {
        if (elements.noteTitleDesktop && event.target === elements.noteTitleMobile) {
            elements.noteTitleDesktop.value = elements.noteTitleMobile.value;
        }
        if (elements.noteContentDesktop && event.target === elements.noteContentMobile) {
            elements.noteContentDesktop.value = elements.noteContentMobile.value;
        }
    } else {
        if (elements.noteTitleMobile && event.target === elements.noteTitleDesktop) {
            elements.noteTitleMobile.value = elements.noteTitleDesktop.value;
        }
        if (elements.noteContentMobile && event.target === elements.noteContentDesktop) {
            elements.noteContentMobile.value = elements.noteContentDesktop.value;
        }
    }
}

// ======================================

async function createNewNote() {

    const now = new Date().toISOString();

    const note = {
        id: crypto.randomUUID(),
        title: "",
        content: "",
        categoryId: state.selectedCategoryId || "general",
        createdAt: now,
        updatedAt: now,
        pinned: false,
        archived: false,
        deleted: false
    };

    state.database.notes.unshift(note);

    await saveDatabase(state.database);

    renderNotes(getFilteredNotes());

    selectNote(note.id);

    if (window.innerWidth >= 1024) {
        elements.noteTitleDesktop?.focus();
    } else {
        elements.noteTitleMobile?.focus();
    }

}

// ======================================

async function saveCurrentNote() {

    const mobileEditorOpen = !elements.mobileEditorView?.classList.contains('hidden');
    const isMobileView = window.innerWidth < 1024;

    const titleVal = (mobileEditorOpen || isMobileView
        ? (elements.noteTitleMobile?.value || elements.noteTitleDesktop?.value)
        : (elements.noteTitleDesktop?.value || elements.noteTitleMobile?.value)) || "";

    const contentVal = (mobileEditorOpen || isMobileView
        ? (elements.noteContentMobile?.value || elements.noteContentDesktop?.value)
        : (elements.noteContentDesktop?.value || elements.noteContentMobile?.value)) || "";

    const trimmedTitle = titleVal.trim();

    if (!state.selectedNote) {
        if (!trimmedTitle && !contentVal.trim()) {
            return;
        }

        const now = new Date().toISOString();
        const note = {
            id: crypto.randomUUID(),
            title: trimmedTitle,
            content: contentVal,
            categoryId: state.selectedCategoryId || "general",
            createdAt: now,
            updatedAt: now,
            pinned: false,
            archived: false,
            deleted: false
        };

        state.database.notes.unshift(note);
        state.selectedNote = note;
    } else {
        state.selectedNote.title = trimmedTitle;
        state.selectedNote.content = contentVal;
        state.selectedNote.updatedAt = new Date().toISOString();
    }

    await saveDatabase(state.database);

    renderNotes(getFilteredNotes());

    if (state.selectedNote) {
        selectNote(state.selectedNote.id);
    }

}

// ======================================

async function deleteCurrentNote() {

    if (!state.selectedNote) return;

    await deleteNoteById(state.selectedNote.id);

}

async function deleteNoteById(noteId) {

    state.database.notes = state.database.notes.filter(note => note.id !== noteId);

    await saveDatabase(state.database);

    const remainingNotes = getFilteredNotes();

    renderNotes(remainingNotes);

    if (remainingNotes.length > 0) {
        const nextNote = remainingNotes[0];
        selectNote(nextNote.id);
    } else {
        state.selectedNote = null;
        clearEditor();
    }

}

function clearEditor() {

    elements.noteTitleDesktop.value = "";
    elements.noteContentDesktop.value = "";
    elements.noteTitleMobile.value = "";
    elements.noteContentMobile.value = "";

}

// ======================================

export function renderNotes(notes, emptyMessage = "No notes in this category.") {

    elements.notesListDesktop.innerHTML = "";
    elements.notesListMobile.innerHTML = "";

    if (notes.length === 0) {

        const empty = `
            <div class="p-10 text-center text-slate-500">
                ${emptyMessage}
            </div>
        `;

        elements.notesListDesktop.innerHTML = empty;
        elements.notesListMobile.innerHTML = empty;

        return;

    }

    notes.forEach(note => {

        elements.notesListDesktop.appendChild(createNoteCard(note));
        elements.notesListMobile.appendChild(createNoteCard(note));

    });

}

// ======================================

function createNoteCard(note) {

    const div = document.createElement("div");

    div.className =
        "cursor-pointer border-b border-slate-800 p-4 hover:bg-slate-900 transition";

    div.innerHTML = `
        <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
                <h3 class="font-semibold truncate">
                    ${note.title || "Untitled"}
                </h3>

                <p class="mt-2 text-sm text-slate-400 line-clamp-2">
                    ${note.content || "Empty note"}
                </p>
            </div>

            <button
                type="button"
                class="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
                data-delete-note="${note.id}"
                title="Delete note"
            >
                🗑
            </button>
        </div>

        <div class="mt-3 flex justify-between text-xs text-slate-500">
            <span>${new Date(note.updatedAt).toLocaleDateString()}</span>
            <span>${note.pinned ? "📌" : ""}</span>
        </div>
    `;

    div.addEventListener("click", event => {
        const deleteButton = event.target.closest("[data-delete-note]");

        if (deleteButton) {
            event.stopPropagation();
            void deleteNoteById(note.id);
            return;
        }

        selectNote(note.id);
    });

    return div;

}

// ======================================

export function selectNote(id) {

    // Always resolve the note from the canonical database, not only from filtered results.
    const canonical = state.database?.notes || [];
    const selectedNote = canonical.find(note => note.id === id);

    if (!selectedNote) {
        clearEditor();
        return;
    }

    state.selectedNote = selectedNote;

    elements.noteTitleDesktop.value = state.selectedNote.title;
    elements.noteContentDesktop.value = state.selectedNote.content;

    elements.noteTitleMobile.value = state.selectedNote.title;
    elements.noteContentMobile.value = state.selectedNote.content;

    // Update highlighted card if the selected note is within the current filtered list.
    document.querySelectorAll("#notesListDesktop > div")
        .forEach(card => card.classList.remove("bg-slate-900"));

    const notes = getFilteredNotes();
    const index = notes.findIndex(note => note.id === id);

    if (index >= 0) {
        elements.notesListDesktop.children[index]
            ?.classList.add("bg-slate-900");
    }

    if (window.innerWidth < 1024) {
        openMobileEditor();
    }

}

// ======================================

export function openMobileEditor() {

    elements.mobileListView.classList.add("hidden");
    elements.mobileEditorView.classList.remove("hidden");
    elements.fab?.classList.add("hidden");

}

export function closeMobileEditor() {

    elements.mobileEditorView.classList.add("hidden");
    elements.mobileListView.classList.remove("hidden");
    elements.fab?.classList.remove("hidden");

}

export { elements };