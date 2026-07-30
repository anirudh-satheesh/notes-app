// ======================================
// Categories Module
// ======================================
import { state } from "./state.js?v=20260730-4";
import { saveDatabase } from "./storage.js?v=20260730-4";

let elements;
let renderNotes;
let selectNote;
let searchQuery = "";
let editingCategoryId = null;
let deleteConfirmationCategoryId = null;
let draftCategoryName = "";
let categoryFeedbackMessage = "";
let creatingCategory = false;
let newCategoryName = "";
let createCategoryError = "";
let documentClickHandlerAttached = false;
// ======================================

export function initCategories(uiElements, renderFn, selectFn) {

    elements = uiElements;
    renderNotes = renderFn;
    selectNote = selectFn;

    elements.addCategoryBtn?.addEventListener(
        "click",
        createCategory
    );

    attachDocumentClickHandler();
    restoreSelectedCategory();
    renderCategories();

}

// ======================================

export function getFilteredNotes() {

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return state.database.notes.filter(note => {
        if (note.categoryId !== state.selectedCategoryId) {
            return false;
        }

        if (!normalizedQuery) {
            return true;
        }

        const title = String(note.title || "").toLowerCase();
        const content = String(note.content || "").toLowerCase();

        return title.includes(normalizedQuery) || content.includes(normalizedQuery);
    });

}

export function setSearchQuery(query) {
    searchQuery = String(query || "").trim();
}

export function getSearchQuery() {
    return searchQuery;
}

// ======================================

function getGeneralCategory() {

    return state.database.categories.find(category =>
        category.id === "general" || category.name.toLowerCase() === "general"
    ) || state.database.categories[0];

}

function getCategoryById(categoryId) {

    return state.database.categories.find(category => category.id === categoryId);

}

function isGeneralCategory(category) {

    return category?.id === "general" || category?.name?.toLowerCase() === "general";

}

function restoreSelectedCategory() {

    if (!state.database) return;

    if (!state.database.settings) {
        state.database.settings = {};
    }

    const categories = state.database?.categories ?? [];
    const savedId = state.database?.settings?.selectedCategoryId;
    const hasSavedCategory = categories.some(category => category.id === savedId);

    state.selectedCategoryId = hasSavedCategory
        ? savedId
        : categories[0]?.id || "general";

    state.database.settings.selectedCategoryId = state.selectedCategoryId;

}

function persistCategorySelection(categoryId) {

    state.selectedCategoryId = categoryId;

    if (state.database?.settings) {
        state.database.settings.selectedCategoryId = categoryId;
    } else {
        state.database.settings = { selectedCategoryId: categoryId };
    }

}

function updateCategoryView() {

    renderCategories();

    const notes = getFilteredNotes();
    const emptyMessage = searchQuery.trim().length > 0
        ? "No matching notes found."
        : "No notes in this category.";

    renderNotes(notes, emptyMessage);

    state.selectedNote = null;

    if (elements.noteTitleDesktop) elements.noteTitleDesktop.value = "";
    if (elements.noteContentDesktop) elements.noteContentDesktop.value = "";

    if (elements.noteTitleMobile) elements.noteTitleMobile.value = "";
    if (elements.noteContentMobile) elements.noteContentMobile.value = "";

}

function validateCategoryName(name, currentCategoryId = null) {

    const trimmedName = name.trim();

    if (!trimmedName.length) {
        return { valid: false, message: "Category name cannot be empty." };
    }

    const exists = state.database.categories.some(category =>
        category.id !== currentCategoryId &&
        category.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
        return { valid: false, message: "Category already exists." };
    }

    return { valid: true, message: "" };

}

function attachDocumentClickHandler() {

    if (documentClickHandlerAttached) return;

    document.addEventListener("click", event => {

        const target = event.target;

        if (!(target instanceof Element)) return;

        if (target.closest("[data-category-editor='true']") || target.closest("[data-category-creator='true']")) {
            return;
        }

        if (target.closest("#addCategoryBtn")) {
            return;
        }

        if (editingCategoryId) {
            cancelRenameCategory();
        }

        if (creatingCategory) {
            cancelCreateCategory();
        }

    });

    documentClickHandlerAttached = true;

}

function startRenameCategory(categoryId) {

    const category = getCategoryById(categoryId);

    if (!category || isGeneralCategory(category)) return;

    editingCategoryId = categoryId;
    deleteConfirmationCategoryId = null;
    draftCategoryName = category.name;
    categoryFeedbackMessage = "";

    renderCategories();

}

function cancelRenameCategory() {

    editingCategoryId = null;
    draftCategoryName = "";
    categoryFeedbackMessage = "";

    renderCategories();

}

function cancelCreateCategory() {

    creatingCategory = false;
    newCategoryName = "";
    createCategoryError = "";

    renderCategories();

}

function startCreateCategory() {

    editingCategoryId = null;
    deleteConfirmationCategoryId = null;
    creatingCategory = true;
    newCategoryName = "";
    createCategoryError = "";

    renderCategories();

}

async function saveNewCategory() {

    const validation = validateCategoryName(newCategoryName);

    if (!validation.valid) {
        createCategoryError = validation.message;
        renderCategories();
        return;
    }

    const category = {
        id: crypto.randomUUID(),
        name: newCategoryName.trim()
    };

    state.database.categories.push(category);
    creatingCategory = false;
    newCategoryName = "";
    createCategoryError = "";

    await saveDatabase(state.database);

    await selectCategory(category.id);

}

async function saveRenameCategory(categoryId) {

    const category = getCategoryById(categoryId);

    if (!category || isGeneralCategory(category)) return;

    const validation = validateCategoryName(draftCategoryName, categoryId);

    if (!validation.valid) {
        categoryFeedbackMessage = validation.message;
        renderCategories();
        return;
    }

    category.name = draftCategoryName.trim();
    editingCategoryId = null;
    deleteConfirmationCategoryId = null;
    draftCategoryName = "";
    categoryFeedbackMessage = "";

    await saveDatabase(state.database);

    renderCategories();

}

function startDeleteCategory(categoryId) {

    const category = getCategoryById(categoryId);

    if (!category || isGeneralCategory(category)) return;

    editingCategoryId = null;
    deleteConfirmationCategoryId = categoryId;
    categoryFeedbackMessage = "";

    renderCategories();

}

function cancelDeleteCategory() {

    deleteConfirmationCategoryId = null;

    renderCategories();

}

async function deleteCategory(categoryId) {

    const category = getCategoryById(categoryId);

    if (!category || isGeneralCategory(category)) return;

    const generalCategory = getGeneralCategory();

    if (!generalCategory) return;

    state.database.notes.forEach(note => {
        if (note.categoryId === categoryId) {
            note.categoryId = generalCategory.id;
        }
    });

    state.database.categories = state.database.categories.filter(
        item => item.id !== categoryId
    );

    if (state.selectedCategoryId === categoryId) {
        persistCategorySelection(generalCategory.id);
    }

    editingCategoryId = null;
    deleteConfirmationCategoryId = null;
    draftCategoryName = "";
    categoryFeedbackMessage = "";

    await saveDatabase(state.database);

    updateCategoryView();

}

export function renderCategories() {
    renderDesktopCategories();
    renderMobileCategories();
}

function renderMobileCategories() {

    if (!elements.mobileCategoryBtn || !elements.mobileCategoryList) return;

    const currentCategory = getCategoryById(state.selectedCategoryId) || getGeneralCategory();
    const categoryName = currentCategory ? currentCategory.name : "General";

    elements.mobileCategoryBtn.innerHTML = "";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = categoryName;
    const arrowSpan = document.createElement("span");
    arrowSpan.className = "float-right text-slate-400";
    arrowSpan.textContent = "▼";
    elements.mobileCategoryBtn.appendChild(nameSpan);
    elements.mobileCategoryBtn.appendChild(arrowSpan);

    elements.mobileCategoryList.innerHTML = "";

    const topBar = document.createElement("div");
    topBar.className = "px-3 py-2 border-b border-slate-800 mb-1 flex items-center justify-between";

    if (creatingCategory) {

        const createForm = document.createElement("div");
        createForm.className = "w-full flex flex-col gap-2 p-1";
        createForm.setAttribute("data-category-creator", "true");

        const input = document.createElement("input");
        input.type = "text";
        input.value = newCategoryName;
        input.placeholder = "New category name";
        input.className = "w-full rounded bg-slate-800 px-3 py-1.5 text-sm text-slate-100 outline-none border border-slate-700 focus:border-blue-500";
        input.addEventListener("input", event => {
            newCategoryName = event.target.value;
        });
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                void saveNewCategory();
            }
            if (event.key === "Escape") {
                event.preventDefault();
                cancelCreateCategory();
            }
        });

        const actions = document.createElement("div");
        actions.className = "flex items-center gap-2 justify-end";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500";
        saveBtn.textContent = "Save";
        saveBtn.addEventListener("click", () => {
            void saveNewCategory();
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "rounded bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => {
            cancelCreateCategory();
        });

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
        createForm.appendChild(input);
        createForm.appendChild(actions);

        if (createCategoryError) {
            const feedback = document.createElement("p");
            feedback.className = "text-xs text-red-400 mt-1";
            feedback.textContent = createCategoryError;
            createForm.appendChild(feedback);
        }

        topBar.appendChild(createForm);

    } else {

        const titleSpan = document.createElement("span");
        titleSpan.className = "text-xs font-semibold uppercase text-slate-400 tracking-wider";
        titleSpan.textContent = "Categories";

        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer";
        addBtn.textContent = "+ Add Category";
        addBtn.setAttribute("data-category-action", "true");
        addBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            startCreateCategory();
        });

        topBar.appendChild(titleSpan);
        topBar.appendChild(addBtn);

    }

    elements.mobileCategoryList.appendChild(topBar);

    const categories = state.database?.categories ?? [];
    categories.forEach(category => {

        const isSelected = state.selectedCategoryId === category.id;
        const isGeneral = isGeneralCategory(category);
        const isEditing = editingCategoryId === category.id;
        const isDeleting = deleteConfirmationCategoryId === category.id;

        const row = document.createElement("div");
        row.className = "px-2 py-1 flex items-center justify-between";

        if (isEditing) {

            const form = document.createElement("div");
            form.className = "w-full flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-800/80 p-2";
            form.setAttribute("data-category-editor", "true");

            const inputWrapper = document.createElement("div");
            inputWrapper.className = "flex items-center gap-2";

            const input = document.createElement("input");
            input.type = "text";
            input.value = draftCategoryName;
            input.className = "flex-1 rounded bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none border border-slate-700";
            input.addEventListener("input", event => {
                draftCategoryName = event.target.value;
            });
            input.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    void saveRenameCategory(category.id);
                }
                if (event.key === "Escape") {
                    event.preventDefault();
                    cancelRenameCategory();
                }
            });

            const saveBtn = document.createElement("button");
            saveBtn.type = "button";
            saveBtn.className = "rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500";
            saveBtn.textContent = "Save";
            saveBtn.addEventListener("click", () => {
                void saveRenameCategory(category.id);
            });

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600";
            cancelBtn.textContent = "Cancel";
            cancelBtn.addEventListener("click", () => {
                cancelRenameCategory();
            });

            inputWrapper.appendChild(input);
            inputWrapper.appendChild(saveBtn);
            inputWrapper.appendChild(cancelBtn);
            form.appendChild(inputWrapper);

            if (categoryFeedbackMessage) {
                const feedback = document.createElement("p");
                feedback.className = "text-xs text-red-400";
                feedback.textContent = categoryFeedbackMessage;
                form.appendChild(feedback);
            }

            row.appendChild(form);

        } else if (isDeleting) {

            const confirmWrap = document.createElement("div");
            confirmWrap.className = "w-full flex items-center justify-between rounded-lg border border-red-700/60 bg-slate-800/80 px-3 py-2";

            const label = document.createElement("span");
            label.className = "text-xs text-red-300";
            label.textContent = "Delete category?";

            const actions = document.createElement("div");
            actions.className = "flex items-center gap-2";

            const confirmBtn = document.createElement("button");
            confirmBtn.type = "button";
            confirmBtn.className = "rounded bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-500";
            confirmBtn.textContent = "Yes";
            confirmBtn.addEventListener("click", () => {
                void deleteCategory(category.id);
            });

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "rounded bg-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-600";
            cancelBtn.textContent = "No";
            cancelBtn.addEventListener("click", () => {
                cancelDeleteCategory();
            });

            actions.appendChild(confirmBtn);
            actions.appendChild(cancelBtn);
            confirmWrap.appendChild(label);
            confirmWrap.appendChild(actions);
            row.appendChild(confirmWrap);

        } else {

            const itemBtn = document.createElement("button");
            itemBtn.type = "button";
            itemBtn.className = [
                "flex-1 px-3 py-2 text-left text-sm rounded-lg transition flex items-center justify-between cursor-pointer",
                isSelected
                    ? "bg-slate-800 text-blue-400 font-semibold"
                    : "text-slate-200 hover:bg-slate-800/60"
            ].join(" ");

            itemBtn.textContent = category.name;

            itemBtn.addEventListener("click", () => {
                elements.mobileCategoryList.classList.add("hidden");
                void selectCategory(category.id);
            });

            row.appendChild(itemBtn);

            if (!isGeneral) {

                const actions = document.createElement("div");
                actions.className = "flex items-center gap-1 ml-2";

                const renameBtn = document.createElement("button");
                renameBtn.type = "button";
                renameBtn.className = "rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer";
                renameBtn.textContent = "✎";
                renameBtn.title = "Rename category";
                renameBtn.setAttribute("data-category-action", "true");
                renameBtn.addEventListener("click", event => {
                    event.stopPropagation();
                    startRenameCategory(category.id);
                });

                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition cursor-pointer";
                deleteBtn.textContent = "🗑";
                deleteBtn.title = "Delete category";
                deleteBtn.setAttribute("data-category-action", "true");
                deleteBtn.addEventListener("click", event => {
                    event.stopPropagation();
                    startDeleteCategory(category.id);
                });

                actions.appendChild(renameBtn);
                actions.appendChild(deleteBtn);
                row.appendChild(actions);

            }

        }

        elements.mobileCategoryList.appendChild(row);

    });

}

function renderDesktopCategories() {

    if (!elements.categoriesContainer) return;

    elements.categoriesContainer.innerHTML = "";

    if (creatingCategory) {

        const createForm = document.createElement("div");
        createForm.className = "mb-3 rounded-lg border border-slate-700 bg-slate-900/80 p-2";
        createForm.setAttribute("data-category-creator", "true");

        const input = document.createElement("input");
        input.type = "text";
        input.value = newCategoryName;
        input.placeholder = "New category";
        input.className = "w-full rounded bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none";
        input.addEventListener("input", event => {
            newCategoryName = event.target.value;
        });
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                void saveNewCategory();
            }

            if (event.key === "Escape") {
                event.preventDefault();
                cancelCreateCategory();
            }
        });

        const actions = document.createElement("div");
        actions.className = "mt-2 flex items-center gap-2";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500";
        saveBtn.textContent = "Save";
        saveBtn.addEventListener("click", () => {
            void saveNewCategory();
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "rounded bg-slate-700 px-2 py-1 text-sm text-slate-300 hover:bg-slate-600";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => {
            cancelCreateCategory();
        });

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);

        createForm.appendChild(input);
        createForm.appendChild(actions);

        if (createCategoryError) {
            const feedback = document.createElement("p");
            feedback.className = "mt-2 text-xs text-red-400";
            feedback.textContent = createCategoryError;
            createForm.appendChild(feedback);
        }

        elements.categoriesContainer.appendChild(createForm);

    }

    state.database.categories.forEach(category => {

        const row = document.createElement("div");
        row.className = "group flex items-center gap-2";

        const isSelected = state.selectedCategoryId === category.id;
        const isGeneral = isGeneralCategory(category);
        const isEditing = editingCategoryId === category.id;
        const isDeleting = deleteConfirmationCategoryId === category.id;

        if (isEditing) {

            const form = document.createElement("div");
            form.className = "flex w-full flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/80 p-2";
            form.setAttribute("data-category-editor", "true");

            const inputWrapper = document.createElement("div");
            inputWrapper.className = "flex items-center gap-2";

            const input = document.createElement("input");
            input.type = "text";
            input.value = draftCategoryName;
            input.className = "flex-1 rounded bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none";
            input.addEventListener("input", event => {
                draftCategoryName = event.target.value;
            });
            input.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    void saveRenameCategory(category.id);
                }

                if (event.key === "Escape") {
                    event.preventDefault();
                    cancelRenameCategory();
                }
            });

            const saveBtn = document.createElement("button");
            saveBtn.type = "button";
            saveBtn.className = "rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500";
            saveBtn.textContent = "Save";
            saveBtn.addEventListener("click", () => {
                void saveRenameCategory(category.id);
            });

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "rounded bg-slate-700 px-2 py-1 text-sm text-slate-300 hover:bg-slate-600";
            cancelBtn.textContent = "Cancel";
            cancelBtn.addEventListener("click", () => {
                cancelRenameCategory();
            });

            inputWrapper.appendChild(input);
            inputWrapper.appendChild(saveBtn);
            inputWrapper.appendChild(cancelBtn);

            form.appendChild(inputWrapper);

            if (categoryFeedbackMessage) {
                const feedback = document.createElement("p");
                feedback.className = "text-xs text-red-400";
                feedback.textContent = categoryFeedbackMessage;
                form.appendChild(feedback);
            }

            row.appendChild(form);

        } else if (isDeleting) {

            const confirmWrap = document.createElement("div");
            confirmWrap.className = "flex w-full items-center justify-between rounded-lg border border-red-700/60 bg-slate-900/80 px-2 py-2";

            const label = document.createElement("span");
            label.className = "text-sm text-red-300";
            label.textContent = "Delete this category?";

            const actions = document.createElement("div");
            actions.className = "flex items-center gap-2";

            const confirmBtn = document.createElement("button");
            confirmBtn.type = "button";
            confirmBtn.className = "rounded bg-red-600 px-2 py-1 text-sm text-white hover:bg-red-500";
            confirmBtn.textContent = "Yes";
            confirmBtn.addEventListener("click", () => {
                void deleteCategory(category.id);
            });

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "rounded bg-slate-700 px-2 py-1 text-sm text-slate-300 hover:bg-slate-600";
            cancelBtn.textContent = "No";
            cancelBtn.addEventListener("click", () => {
                cancelDeleteCategory();
            });

            actions.appendChild(confirmBtn);
            actions.appendChild(cancelBtn);
            confirmWrap.appendChild(label);
            confirmWrap.appendChild(actions);
            row.appendChild(confirmWrap);

        } else {

            const button = document.createElement("button");

            button.type = "button";

            button.className = [
                "flex-1 rounded-lg px-3 py-2 text-left cursor-pointer border border-transparent transition-colors duration-200",
                "hover:bg-slate-700 hover:text-white",
                isSelected ? "bg-slate-800 text-white shadow-sm" : "text-slate-300"
            ].join(" ");

            button.textContent = category.name;

            button.addEventListener("click", () => {

                void selectCategory(category.id);

            });

            row.appendChild(button);

            if (!isGeneral) {

                const actions = document.createElement("div");
                actions.className = "flex items-center gap-1 ml-1";

                const renameBtn = document.createElement("button");
                renameBtn.type = "button";
                renameBtn.className = "rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer";
                renameBtn.textContent = "✎";
                renameBtn.title = "Rename category";
                renameBtn.addEventListener("click", event => {
                    event.stopPropagation();
                    startRenameCategory(category.id);
                });

                const deleteBtn = document.createElement("button");
                deleteBtn.type = "button";
                deleteBtn.className = "rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-red-400 transition cursor-pointer";
                deleteBtn.textContent = "🗑";
                deleteBtn.title = "Delete category";
                deleteBtn.addEventListener("click", event => {
                    event.stopPropagation();
                    startDeleteCategory(category.id);
                });

                actions.appendChild(renameBtn);
                actions.appendChild(deleteBtn);
                row.appendChild(actions);

            }

        }

        elements.categoriesContainer.appendChild(row);

    });

}

// ======================================

export async function selectCategory(categoryId) {

    const categoryExists = state.database.categories.some(category => category.id === categoryId);

    if (!categoryExists) return;

    persistCategorySelection(categoryId);

    await saveDatabase(state.database);

    updateCategoryView();

}

// ======================================

function createCategory() {

    if (creatingCategory) return;

    startCreateCategory();

}