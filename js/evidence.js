/* =====================================================
   玉兰阁调查 · 存证清单（证据收集）
   YULAN EVIDENCE BOARD
   -----------------------------------------------------
   * 在任意页面对一段原文点「存证」，把 摘录 / 来源页 / 页面日期
     记进 localStorage
   * 回到 player-home 的「我存下来的」可以看、可以删、可以换排序
   * 只保存玩家自己抄下来的东西，不做任何推断
   仅使用 localStorage，不涉及任何后端
===================================================== */


/* ========== 常量 ========== */

const EVIDENCE_STORAGE_KEY = "yulan_evidence";
const EVIDENCE_VERSION = 1;

/* 摘录长度上限：超过只留开头，避免整段长文塞进清单 */
const EVIDENCE_QUOTE_MAX = 220;

/* localStorage 不可用时的兜底（只保留在内存里） */
let evidenceMemory = null;


/* ========== 存档读写 ========== */

function emptyEvidenceState() {

    return {
        version: EVIDENCE_VERSION,
        sort: "collected",
        seq: 0,
        items: []
    };

}

function loadEvidenceState() {

    const fallback = emptyEvidenceState();

    if (evidenceMemory) {
        fallback.seq = evidenceMemory.seq || 0;
        fallback.items = (evidenceMemory.items || []).slice();
    }

    let raw = null;

    try {
        raw = localStorage.getItem(EVIDENCE_STORAGE_KEY);
    } catch (e) {
        return fallback;
    }

    if (!raw) {
        return fallback;
    }

    try {

        const parsed = JSON.parse(raw);

        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
            return fallback;
        }

        return {
            version: EVIDENCE_VERSION,
            sort: parsed.sort === "source" ? "source" : "collected",
            seq: typeof parsed.seq === "number" ? parsed.seq : parsed.items.length,
            items: parsed.items
        };

    } catch (e) {

        return fallback;

    }

}

function saveEvidenceState(state) {

    const payload = {
        version: EVIDENCE_VERSION,
        sort: state.sort === "source" ? "source" : "collected",
        seq: typeof state.seq === "number" ? state.seq : 0,
        items: Array.isArray(state.items) ? state.items : []
    };

    evidenceMemory = { seq: payload.seq, items: payload.items.slice() };

    try {
        localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        /* 写不进去就只保留在内存里，页面内仍然可用 */
    }

}

function getEvidenceItems() {

    return loadEvidenceState().items;
}

function getEvidenceSort() {

    return loadEvidenceState().sort;
}

function setEvidenceSort(mode) {

    const state = loadEvidenceState();

    state.sort = mode === "source" ? "source" : "collected";

    saveEvidenceState(state);
}

function findEvidence(id) {

    if (!id) {
        return null;
    }

    const items = getEvidenceItems();

    for (let i = 0; i < items.length; i += 1) {

        if (items[i] && items[i].id === id) {
            return items[i];
        }

    }

    return null;
}

function addEvidence(record) {

    if (!record || !record.id) {
        return null;
    }

    if (findEvidence(record.id)) {
        return null;
    }

    const state = loadEvidenceState();

    state.seq = (typeof state.seq === "number" ? state.seq : state.items.length) + 1;
    record.seq = state.seq;

    state.items.push(record);

    saveEvidenceState(state);

    return record;
}

function removeEvidence(id) {

    if (!id) {
        return false;
    }

    const state = loadEvidenceState();

    const before = state.items.length;

    state.items = state.items.filter(function (item) {
        return !item || item.id !== id;
    });

    if (state.items.length === before) {
        return false;
    }

    saveEvidenceState(state);

    return true;
}


/* ========== 摘录与记录 ========== */

/* 当前页面在存档里的地址（用文件名，兼容 file:// 与本地服务器） */
function evidencePageUrl() {

    const file = String(window.location.pathname || "").split("/").pop();

    return (file || "index.html") + String(window.location.search || "");
}

/* 抓取要存证的原文：默认取元素自身的文字，可用 data-evidence-quote 指定别的元素 */
function evidenceQuoteFor(el) {

    let node = el;

    const selector = el.getAttribute("data-evidence-quote");

    if (selector) {

        const found = document.querySelector(selector);

        if (found) {
            node = found;
        }

    }

    let text = "";

    try {
        text = (node.textContent || "").replace(/\s+/g, " ").trim();
    } catch (e) {
        text = "";
    }

    if (text.length > EVIDENCE_QUOTE_MAX) {
        text = text.slice(0, EVIDENCE_QUOTE_MAX).trim() + "…";
    }

    return text;

}

function evidenceRecordFor(el) {

    return {
        id: el.getAttribute("data-evidence"),
        quote: evidenceQuoteFor(el),
        source: el.getAttribute("data-evidence-title") || String(document.title || "").trim(),
        date: el.getAttribute("data-evidence-date") || "",
        url: el.getAttribute("data-evidence-url") || evidencePageUrl(),
        flag: el.getAttribute("data-evidence-flag") || "",
        at: new Date().toISOString()
    };

}


/* ========== 提示 ========== */

function showEvidenceToast(text) {

    if (typeof showProgressToast === "function") {

        showProgressToast(text);

        return;

    }

    let toast = document.getElementById("gameProgressToast");

    if (!toast) {

        toast = document.createElement("div");
        toast.id = "gameProgressToast";
        toast.className = "game-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");

        document.body.appendChild(toast);

    }

    toast.textContent = text;
    toast.classList.add("game-toast-show");

    if (toast.evidenceTimer) {
        clearTimeout(toast.evidenceTimer);
    }

    toast.evidenceTimer = setTimeout(function () {
        toast.classList.remove("game-toast-show");
    }, 2400);

}


/* ========== 页面上的「存证」按钮 ========== */

function syncEvidenceButton(button, id) {

    if (!button) {
        return;
    }

    const saved = !!findEvidence(id);

    button.setAttribute("aria-pressed", saved ? "true" : "false");
    button.textContent = saved ? "已存证 · 点击取消" : "存证";

}

function syncEvidenceButtonsFor(id) {

    const buttons = document.querySelectorAll("[data-evidence-id]");

    buttons.forEach(function (button) {

        if (button.getAttribute("data-evidence-id") === id) {
            syncEvidenceButton(button, id);
        }

    });

}

function toggleEvidence(el, button) {

    const record = evidenceRecordFor(el);

    if (!record.id) {
        return;
    }

    if (findEvidence(record.id)) {

        removeEvidence(record.id);

        showEvidenceToast("已取消存证");

    } else {

        addEvidence(record);

        showEvidenceToast("已存证 · 清单在十七的主页");

    }

    syncEvidenceButton(button, record.id);

    renderEvidenceBoard();

}

function bindEvidenceButtons() {

    const targets = document.querySelectorAll("[data-evidence]");

    targets.forEach(function (el) {

        const id = el.getAttribute("data-evidence");

        if (!id) {
            return;
        }

        const button = document.createElement("button");

        button.type = "button";
        button.className = "ev-btn";
        button.setAttribute("data-evidence-id", id);
        button.setAttribute("aria-pressed", "false");

        button.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            toggleEvidence(el, button);

        });

        /* 放在原文旁边，正文本身不掺进按钮文字 */
        el.parentNode.insertBefore(button, el.nextSibling);

        syncEvidenceButton(button, id);

    });

}


/* ========== 「我存下来的」清单（player-home） ========== */

function formatEvidenceTime(value) {

    const text = String(value || "");

    if (text.length < 16) {
        return "";
    }

    return text.slice(0, 10) + " " + text.slice(11, 16);

}

function sortedEvidenceItems() {

    const mode = getEvidenceSort();

    const items = getEvidenceItems().slice();

    items.sort(function (a, b) {

        if (mode === "source") {

            const sa = String((a && a.source) || "");
            const sb = String((b && b.source) || "");

            if (sa !== sb) {
                return sa.localeCompare(sb);
            }

        }

        return (Number(a && a.seq) || 0) - (Number(b && b.seq) || 0);

    });

    return items;

}

/* 档案访问权限不在这份存档里时，清单里只留一个锁定占位 */
function evidenceIsLocked(item) {

    if (!item || !item.flag) {
        return false;
    }

    if (typeof isProgressUnlocked !== "function") {
        return false;
    }

    return !isProgressUnlocked(item.flag);

}

function buildEvidenceCard(item, order) {

    const locked = evidenceIsLocked(item);

    const card = document.createElement("article");

    card.className = "ev-board-item" + (locked ? " ev-board-item-locked" : "");

    const quote = document.createElement("p");

    quote.className = "ev-board-quote";
    quote.textContent = locked
        ? "（锁定项 · 本机没有对应的访问权限，内容已隐藏）"
        : "“" + String(item.quote || "") + "”";

    card.appendChild(quote);

    const meta = document.createElement("div");

    meta.className = "ev-board-meta";

    if (locked) {

        const hint = document.createElement("span");

        hint.textContent = "重新取得访问权限后才会显示";

        meta.appendChild(hint);

    } else {

        const link = document.createElement("a");

        link.href = item.url || "#";
        link.textContent = item.source || "来源页";

        meta.appendChild(link);

        const date = document.createElement("span");

        date.className = "ev-board-date";
        date.textContent = item.date ? "页面日期 " + item.date : "页面未标日期";

        meta.appendChild(date);

        const stamp = document.createElement("span");

        const when = formatEvidenceTime(item.at);

        stamp.className = "ev-board-stamp";
        stamp.textContent = "登记 #" + order + (when ? " · " + when : "");

        meta.appendChild(stamp);

    }

    const del = document.createElement("button");

    del.type = "button";
    del.className = "ev-board-del";
    del.textContent = "删掉";

    del.addEventListener("click", function () {

        removeEvidence(item.id);

        renderEvidenceBoard();

        syncEvidenceButtonsFor(item.id);

        showEvidenceToast("已从清单里删掉");

    });

    meta.appendChild(del);

    card.appendChild(meta);

    return card;

}

function renderEvidenceBoard() {

    const board = document.querySelector("[data-evidence-board]");

    if (!board) {
        return;
    }

    const list = board.querySelector("[data-evidence-list]");
    const countEl = board.querySelector("[data-evidence-count]");
    const emptyEl = board.querySelector("[data-evidence-empty]");
    const sortBtn = board.querySelector("[data-evidence-sort]");

    if (!list) {
        return;
    }

    const items = sortedEvidenceItems();

    list.innerHTML = "";

    if (countEl) {
        countEl.textContent = items.length + " 条";
    }

    if (emptyEl) {
        emptyEl.style.display = items.length ? "none" : "block";
    }

    if (sortBtn) {
        sortBtn.textContent = getEvidenceSort() === "source"
            ? "排序：来源页"
            : "排序：收集顺序";
    }

    items.forEach(function (item, index) {
        list.appendChild(buildEvidenceCard(item, index + 1));
    });

}

function clearEvidenceList() {

    if (!getEvidenceItems().length) {

        showEvidenceToast("清单本来就是空的");

        return;

    }

    if (!window.confirm("清空证据清单？已经存下来的摘录会全部删掉。")) {
        return;
    }

    const state = loadEvidenceState();

    state.items = [];

    saveEvidenceState(state);

    renderEvidenceBoard();

    syncEvidenceButtonsFor("");

    showEvidenceToast("清单已清空");

}

function bindEvidenceBoardControls() {

    const board = document.querySelector("[data-evidence-board]");

    if (!board) {
        return;
    }

    const sortBtn = board.querySelector("[data-evidence-sort]");
    const clearBtn = board.querySelector("[data-evidence-clear]");

    if (sortBtn) {

        sortBtn.addEventListener("click", function () {

            setEvidenceSort(getEvidenceSort() === "source" ? "collected" : "source");

            renderEvidenceBoard();

        });

    }

    if (clearBtn) {

        clearBtn.addEventListener("click", function () {
            clearEvidenceList();
        });

    }

}


/* ========== 启动 ========== */

document.addEventListener("DOMContentLoaded", function () {

    bindEvidenceButtons();

    renderEvidenceBoard();

    bindEvidenceBoardControls();

});
