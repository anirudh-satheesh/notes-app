// ======================================
// Toast Notifications Module
// ======================================

const toastContainer = document.getElementById("toastContainer");

export function showToast(message, type = "success", duration = 3000) {
    const toast = document.createElement("div");
    
    const bgColor = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600";
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    
    toast.className = `toast ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg mb-3 flex items-center gap-2 pointer-events-auto`;
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    toastContainer.appendChild(toast);
    
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add("hide");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    return toast;
}

export function clearToasts() {
    toastContainer.innerHTML = "";
}
