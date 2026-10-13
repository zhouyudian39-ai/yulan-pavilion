/* =====================================================
   玉兰阁调查 · 游戏进度存档
   YULAN GAME PROGRESS
   与登录状态（js/auth.js）分开管理的轻量进度存档
   仅使用 localStorage，不涉及任何后端
===================================================== */


/* ========== 存档键名与版本 ========== */

const GAME_SAVE_KEY = "yulan_game_progress";
const GAME_SAVE_VERSION = 1;


/* ========== 进度项 ========== */

const GAME_FLAGS = {
    forumDeletedPosts: "forum_deleted_posts",
    zhoulanAlbum: "zhoulan_album",
    tenderB3Plan: "tender_b3_plan",
    tenderMemo: "tender_memo",
    founderAccess: "founder_access",
    phoenixSeen: "phoenix_seen",
    desktopIntroSeen: "desktop_intro_seen"
};


/* ========== 读取 / 写入 ========== */

function loadGameProgress() {

    let raw = null;

    try {
        raw = localStorage.getItem(GAME_SAVE_KEY);
    } catch (e) {
        raw = null;
    }

    if (!raw) {
        return { version: GAME_SAVE_VERSION, flags: {} };
    }

    try {

        const parsed = JSON.parse(raw);

        if (!parsed || typeof parsed !== "object") {
            return { version: GAME_SAVE_VERSION, flags: {} };
        }

        if (!parsed.flags || typeof parsed.flags !== "object") {
            parsed.flags = {};
        }

        /* 旧版本存档：只升级版本号，尽量保留已有进度 */
        if (parsed.version !== GAME_SAVE_VERSION) {
            parsed.version = GAME_SAVE_VERSION;
        }

        return parsed;

    } catch (e) {

        return { version: GAME_SAVE_VERSION, flags: {} };

    }

}


function saveGameProgress(state) {

    try {
        localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(state));
    } catch (e) {
        /* 隐私模式或存储已满：静默失败，不影响页面 */
    }

}


/* ========== 查询 ========== */

function isProgressUnlocked(flag) {

    return loadGameProgress().flags[flag] === true;

}


/* ========== 解锁并持久化 ========== */

function unlockProgress(flag, silent) {

    const state = loadGameProgress();

    if (state.flags[flag] === true) {
        return false;
    }

    const now = new Date().toISOString();

    state.flags[flag] = true;

    if (!state.startedAt) {
        state.startedAt = now;
    }

    state.updatedAt = now;

    saveGameProgress(state);

    if (silent !== true) {
        showProgressToast("已解锁 · 已保存");
    }

    return true;

}


/* ========== 重置（只清本游戏进度，不动登录状态） ========== */

function resetGameProgress() {

    try {
        localStorage.removeItem(GAME_SAVE_KEY);
    } catch (e) {
        /* 忽略 */
    }

}


function confirmResetGameProgress() {

    const ok = window.confirm(
        "重新开始调查？\n\n" +
        "这会清除玉兰阁调查的进度（已解锁的档案与线索），\n" +
        "LUMI 登录状态不受影响。\n\n" +
        "此操作无法撤销。"
    );

    if (!ok) {
        return;
    }

    resetGameProgress();
    showProgressToast("调查进度已清除");

    setTimeout(function () {
        window.location.reload();
    }, 900);

}


/* ========== 反馈提示（不显示未发现线索的名称） ========== */

function showProgressToast(text) {

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

    if (toast.gpHideTimer) {
        clearTimeout(toast.gpHideTimer);
    }

    toast.gpHideTimer = setTimeout(function () {
        toast.classList.remove("game-toast-show");
    }, 2400);

}
