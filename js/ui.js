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
import { showToast } from "./toast.js?v=20260730-4";

// Track unsaved changes
let unsavedChanges = false;
let noteIdToDelete = null;

const elements = {

    // Desktop
    notesListDesktop: document.getElementById("notesListDesktop"),
    noteTitleDesktop: document.getElementById("noteTitleDesktop"),
    noteContentDesktop: document.getElementById("noteContentDesktop"),
    saveBtnDesktop: document.getElementById("saveBtnDesktop"),
    unsavedIndicatorDesktop: document.getElementById("unsavedIndicatorDesktop"),
    saveStatusDesktop: document.getElementById("saveStatusDesktop"),
    saveSpinner: document.getElementById("saveSpinner"),
    saveMessage: document.getElementById("saveMessage"),

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
    unsavedIndicatorMobile: document.getElementById("unsavedIndicatorMobile"),
    saveStatusMobile: document.getElementById("saveStatusMobile"),
    saveSpinnerMobile: document.getElementById("saveSpinnerMobile"),
    saveMessageMobile: document.getElementById("saveMessageMobile"),

    // Delete confirmation modal
    deleteConfirmModal: document.getElementById("deleteConfirmModal"),
    confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
    confirmDeleteCancel: document.getElementById("confirmDeleteCancel"),

    // Shared
    newNoteBtn: document.getElementById("newNoteBtn"),
    fab: document.getElementById("fab")
};

// ======================================

export async function initUI() {

    registerEvents();
    setupDeleteConfirmModal();
    setupBeforeUnload();

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

function setupDeleteConfirmModal() {
    elements.confirmDeleteBtn?.addEventListener("click", async () => {
        if (noteIdToDelete) {
            await deleteNoteById(noteIdToDelete);
            noteIdToDelete = null;
        }
        elements.deleteConfirmModal?.classList.add("hidden");
    });

    elements.confirmDeleteCancel?.addEventListener("click", () => {
        noteIdToDelete = null;
        elements.deleteConfirmModal?.classList.add("hidden");
    });
}

function setupBeforeUnload() {
    window.addEventListener("beforeunload", (event) => {
        if (unsavedChanges) {
            event.preventDefault();
            event.returnValue = "";
        }
    });
}

function markAsUnsaved() {
    unsavedChanges = true;
    elements.unsavedIndicatorDesktop?.classList.remove("hidden");
    elements.unsavedIndicatorMobile?.classList.remove("hidden");
}

function clearUnsavedIndicator() {
    unsavedChanges = false;
    elements.unsavedIndicatorDesktop?.classList.add("hidden");
    elements.unsavedIndicatorMobile?.classList.add("hidden");
    clearSaveStatus();
}

function showSaveStatus(message, type = "saving") {
    if (window.innerWidth >= 1024) {
        if (type === "saving") {
            elements.saveSpinner?.classList.remove("hidden");
            elements.saveMessage.textContent = "Saving...";
        } else if (type === "saved") {
            elements.saveSpinner?.classList.add("hidden");
            elements.saveMessage.textContent = "Saved";
            elements.saveMessage.classList.add("text-green-400");
            setTimeout(() => clearSaveStatus(), 2000);
        } else if (type === "error") {
            elements.saveSpinner?.classList.add("hidden");
            elements.saveMessage.textContent = "Error saving";
            elements.saveMessage.classList.add("text-red-400");
            setTimeout(() => clearSaveStatus(), 3000);
        }
    } else {
        if (type === "saving") {
            elements.saveSpinnerMobile?.classList.remove("hidden");
            elements.saveMessageMobile.textContent = "Saving...";
        } else if (type === "saved") {
            elements.saveSpinnerMobile?.classList.add("hidden");
            elements.saveMessageMobile.textContent = "Saved";
            elements.saveMessageMobile.classList.add("text-green-400");
            setTimeout(() => clearSaveStatus(), 2000);
        } else if (type === "error") {
            elements.saveSpinnerMobile?.classList.add("hidden");
            elements.saveMessageMobile.textContent = "Error";
            elements.saveMessageMobile.classList.add("text-red-400");
            setTimeout(() => clearSaveStatus(), 3000);
        }
    }
}

function clearSaveStatus() {
    elements.saveSpinner?.classList.add("hidden");
    elements.saveMessage.textContent = "";
    elements.saveMessage.classList.remove("text-green-400", "text-red-400");
    elements.saveSpinnerMobile?.classList.add("hidden");
    elements.saveMessageMobile.textContent = "";
    elements.saveMessageMobile.classList.remove("text-green-400", "text-red-400");
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

    elements.backBtn?.addEventListener("click", handleBackButton);

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

function handleBackButton() {
    if (unsavedChanges) {
        const confirmLeave = confirm("You have unsaved changes. Are you sure you want to leave?");
        if (!confirmLeave) return;
    }
    closeMobileEditor();
}

function syncEditorFields(event) {
    markAsUnsaved();
    
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
            showToast("Note cannot be empty", "error");
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

    try {
        showSaveStatus("Saving...", "saving");
        await saveDatabase(state.database);
        showSaveStatus("Saved", "saved");
        clearUnsavedIndicator();
        showToast("Note saved successfully", "success");
    } catch (error) {
        console.error("Error saving note:", error);
        showSaveStatus("Error saving", "error");
        showToast("Failed to save note", "error");
        return;
    }

    renderNotes(getFilteredNotes());

    if (state.selectedNote) {
        selectNote(state.selectedNote.id);
    }

}

// ======================================

async function deleteCurrentNote() {

    if (!state.selectedNote) return;

    noteIdToDelete = state.selectedNote.id;
    elements.deleteConfirmModal?.classList.remove("hidden");

}

async function deleteNoteById(noteId) {

    state.database.notes = state.database.notes.filter(note => note.id !== noteId);

    try {
        await saveDatabase(state.database);
        showToast("Note deleted", "success");
    } catch (error) {
        console.error("Error deleting note:", error);
        showToast("Failed to delete note", "error");
        return;
    }

    clearUnsavedIndicator();
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
    clearUnsavedIndicator();

}

// ======================================

export function renderNotes(notes, emptyMessage = "No notes in this category.") {

    elements.notesListDesktop.innerHTML = "";
    elements.notesListMobile.innerHTML = "";

    if (notes.length === 0) {

        const isSearchEmpty = getSearchQuery().trim().length > 0;
        const icon = isSearchEmpty ? "🔍" : "📝";
        const message = isSearchEmpty ? "No matching notes found" : "No notes yet";
        const suggestion = isSearchEmpty ? "Try a different search" : "Create your first note to get started";

        const empty = `
            <div class="p-10 text-center flex flex-col items-center justify-center min-h-64">
                <div class="text-5xl mb-4">${icon}</div>
                <p class="text-lg font-semibold text-slate-400 mb-2">${message}</p>
                <p class="text-sm text-slate-500">${suggestion}</p>
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
            noteIdToDelete = note.id;
            elements.deleteConfirmModal?.classList.remove("hidden");
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
    clearUnsavedIndicator();

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