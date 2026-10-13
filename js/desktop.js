/* =====================================================
   十七の桌面 · Y2K 风格开篇
   DESKTOP INTRO — 第一轮：整理桌面
   依赖 js/game-progress.js（若缺失，仅不做持久化，页面照常可用）
===================================================== */

(function () {

    "use strict";


    /* ========== 元素 ========== */

    var album = document.getElementById("dkAlbum");
    var note = document.getElementById("dkNote");
    var feedback = document.getElementById("dkFeedback");
    var hint = document.getElementById("dkHint");
    var osState = document.getElementById("dkOsState");

    var browserWin = document.getElementById("dkBrowser");
    var chatLog = document.getElementById("dkChatLog");
    var chatSend = document.getElementById("dkChatSend");
    var chatSys1 = document.getElementById("dkChatSys1");
    var chatSys2 = document.getElementById("dkChatSys2");

    var overlay = document.getElementById("dkAlbumOverlay");
    var overlayOpen = document.getElementById("dkAlbumOpen");
    var overlayClose = document.getElementById("dkAlbumClose");

    var albumBack = document.getElementById("dkAlbumBack");
    var tidy = document.getElementById("dkTidy");

    if (!album || !note) {
        return;
    }


    /* ========== 进度存档（可缺省） ========== */

    var INTRO_FLAG_FALLBACK = "desktop_intro_seen";

    function introFlag() {

        try {
            if (typeof GAME_FLAGS === "object" &&
                GAME_FLAGS &&
                GAME_FLAGS.desktopIntroSeen) {
                return GAME_FLAGS.desktopIntroSeen;
            }
        } catch (e) {
            /* 忽略 */
        }

        return INTRO_FLAG_FALLBACK;

    }


    function introSeen() {

        try {
            if (typeof isProgressUnlocked === "function") {
                return isProgressUnlocked(introFlag()) === true;
            }
        } catch (e) {
            /* 忽略 */
        }

        return false;

    }


    function markIntroSeen() {

        try {
            if (typeof unlockProgress === "function") {
                /* silent：反馈条已经说明结果，不再叠一个提示 */
                return unlockProgress(introFlag(), true);
            }
        } catch (e) {
            /* 忽略 */
        }

        return false;

    }


    function toast(text) {

        try {
            if (typeof showProgressToast === "function") {
                showProgressToast(text);
            }
        } catch (e) {
            /* 忽略 */
        }

    }


    /* ========== 状态 ========== */

    var noteOpen = false;
    var revealedOnce = false;
    var suppressClick = false;

    var nudgeX = 0;
    var nudgeY = 0;

    var seenObjects = {};
    var seenCount = 0;

    var DRAG_HINT = "照片底下好像还压着东西。";


    /* ========== 反馈条 ========== */

    function showFeedback() {

        if (!feedback) {
            return;
        }

        feedback.innerHTML =
            "<strong>你把那叠照片挪开了。</strong>";

        feedback.classList.remove("dk-hidden");

        if (osState) {
            osState.textContent = "便签 1 张";
        }

    }


    function hideFeedback() {

        if (feedback) {
            feedback.classList.add("dk-hidden");
        }

    }


    /* ========== 便签开关 ========== */

    function setNoteOpen(open, isRevisit) {

        noteOpen = open === true;

        nudgeX = 0;
        nudgeY = 0;
        album.style.transform = "";

        album.classList.toggle("dk-moved", noteOpen);
        note.classList.toggle("dk-note-open", noteOpen);

        if (!noteOpen) {
            hideFeedback();
            return;
        }

        if (isRevisit !== true) {

            markIntroSeen();

            if (!revealedOnce) {
                revealedOnce = true;
                toast("便签 · 已保存");
            }

        }

        showFeedback();

    }


    /* ========== 拖动（鼠标 / 触屏 / 触控笔） ========== */

    var drag = null;
    var DRAG_MIN = 6;
    var DRAG_MOVE = 42;


    album.addEventListener("pointerdown", function (ev) {

        /* 鼠标只响应左键 */
        if (ev.pointerType === "mouse" && ev.button !== 0) {
            return;
        }

        /* 按钮自己处理点击，不要顺手拖动 */
        if (ev.target.closest && ev.target.closest("button")) {
            return;
        }

        if (album.classList.contains("dk-moved")) {
            return;
        }

        drag = {
            id: ev.pointerId,
            x: ev.clientX,
            y: ev.clientY,
            moved: false
        };

        album.classList.add("dk-dragging");

        try {
            album.setPointerCapture(ev.pointerId);
        } catch (e) {
            /* 忽略 */
        }

    });


    album.addEventListener("pointermove", function (ev) {

        if (!drag || ev.pointerId !== drag.id) {
            return;
        }

        var dx = ev.clientX - drag.x;
        var dy = ev.clientY - drag.y;

        if (!drag.moved && (Math.abs(dx) + Math.abs(dy)) < DRAG_MIN) {
            return;
        }

        drag.moved = true;

        album.style.transform =
            "translate(" + dx + "px," + dy + "px) rotate(" +
            (dx * 0.012).toFixed(2) + "deg)";

        if (ev.cancelable) {
            ev.preventDefault();
        }

    });


    function endDrag(ev) {

        if (!drag || (ev && ev.pointerId !== drag.id)) {
            return;
        }

        var dx = ev ? ev.clientX - drag.x : 0;
        var dy = ev ? ev.clientY - drag.y : 0;
        var farEnough = Math.sqrt(dx * dx + dy * dy) >= DRAG_MOVE;

        var id = drag.id;
        drag = null;

        album.classList.remove("dk-dragging");

        try {
            album.releasePointerCapture(id);
        } catch (e) {
            /* 忽略 */
        }

        album.style.transform = "";

        if (farEnough) {

            /* 拖动过一段距离 = 移开 */
            suppressClick = true;

            setTimeout(function () {
                suppressClick = false;
            }, 350);

            if (!noteOpen) {
                setNoteOpen(true);
            }

        }

    }


    album.addEventListener("pointerup", endDrag);

    album.addEventListener("pointercancel", function (ev) {
        endDrag(ev);
    });


    /* ========== 点击移开 ========== */

    album.addEventListener("click", function (ev) {

        if (suppressClick) {
            suppressClick = false;
            return;
        }

        if (ev.target.closest &&
            (ev.target.closest("button") || ev.target.closest("a"))) {
            return;
        }

        setNoteOpen(!noteOpen);

    });


    /* ========== 键盘 ========== */

    album.addEventListener("keydown", function (ev) {

        if (ev.target.closest && ev.target.closest("button")) {
            return;
        }

        if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {

            ev.preventDefault();
            setNoteOpen(!noteOpen);
            return;

        }

        if (ev.key === "Escape" && noteOpen) {

            setNoteOpen(false);
            return;

        }

        var step = ev.shiftKey ? 24 : 10;
        var dx = 0;
        var dy = 0;

        if (ev.key === "ArrowLeft") {
            dx = -step;
        } else if (ev.key === "ArrowRight") {
            dx = step;
        } else if (ev.key === "ArrowUp") {
            dy = -step;
        } else if (ev.key === "ArrowDown") {
            dy = step;
        } else {
            return;
        }

        if (album.classList.contains("dk-moved")) {
            return;
        }

        ev.preventDefault();

        nudgeX += dx;
        nudgeY += dy;

        album.style.transform =
            "translate(" + nudgeX + "px," + nudgeY + "px)";

        if (Math.sqrt(nudgeX * nudgeX + nudgeY * nudgeY) >= DRAG_MOVE) {
            setNoteOpen(true);
        }

    });


    /* ========== 归位 ========== */

    if (albumBack) {

        albumBack.addEventListener("click", function (ev) {

            ev.stopPropagation();
            setNoteOpen(false);

        });

    }


    /* ========== 「看过了几个窗口」的软提示 ========== */

    function markSeen(key) {

        if (seenObjects[key]) {
            return;
        }

        seenObjects[key] = true;
        seenCount += 1;

        if (seenCount >= 2 && !noteOpen && hint) {
            hint.textContent = DRAG_HINT;
        }

    }


    if (browserWin) {

        browserWin.addEventListener("click", function () {
            markSeen("browser");
        });

    }


    /* ========== 聊天：再发一条 ========== */

    var chatUsed = false;

    if (chatSend && chatLog) {

        chatSend.addEventListener("click", function () {

            if (chatUsed) {
                return;
            }

            chatUsed = true;

            var mine = document.createElement("div");

            mine.className = "dk-msg dk-msg-later";

            mine.innerHTML =
                '<span class="dk-msg-who">十七 21:11</span>你到底在哪儿';

            chatLog.appendChild(mine);

            if (chatSys1) {
                chatSys1.classList.remove("dk-msg-hidden");
            }

            if (chatSys2) {
                chatSys2.classList.remove("dk-msg-hidden");
            }

            chatSend.disabled = true;
            chatSend.textContent = "发不出去";

            markSeen("chat");

        });

    }


    /* ========== 相簿弹层 ========== */

    var lastFocus = null;


    function openOverlay() {

        if (!overlay) {
            return;
        }

        lastFocus = document.activeElement;

        overlay.classList.remove("dk-hidden");

        markSeen("album");

        if (overlayClose) {
            overlayClose.focus();
        }

    }


    function closeOverlay() {

        if (!overlay || overlay.classList.contains("dk-hidden")) {
            return;
        }

        overlay.classList.add("dk-hidden");

        if (lastFocus && typeof lastFocus.focus === "function") {
            lastFocus.focus();
        }

    }


    if (overlayOpen) {
        overlayOpen.addEventListener("click", function (ev) {
            ev.stopPropagation();
            openOverlay();
        });
    }


    if (overlayClose) {
        overlayClose.addEventListener("click", closeOverlay);
    }


    if (overlay) {

        /* 点背景关闭 */
        overlay.addEventListener("click", function (ev) {
            if (ev.target === overlay) {
                closeOverlay();
            }
        });

    }


    document.addEventListener("keydown", function (ev) {

        if (ev.key === "Escape") {
            closeOverlay();
        }

    });


    /* ========== 把桌面恢复原样（不重置存档） ========== */

    if (tidy) {

        tidy.addEventListener("click", function () {

            setNoteOpen(false);

            seenObjects = {};
            seenCount = 0;

            if (hint) {
                hint.textContent =
                    "桌面挺整齐的。照片是我自己贴上去的，别动。";
            }

            if (osState) {
                osState.textContent = "桌面已加载";
            }

            var later = chatLog ?
                chatLog.querySelectorAll(".dk-msg-later") : [];

            for (var i = 0; i < later.length; i++) {
                later[i].parentNode.removeChild(later[i]);
            }

            if (chatSys1) {
                chatSys1.classList.add("dk-msg-hidden");
            }

            if (chatSys2) {
                chatSys2.classList.add("dk-msg-hidden");
            }

            if (chatSend) {
                chatSend.disabled = false;
                chatSend.textContent = "再发一条";
            }

            chatUsed = false;

            closeOverlay();

        });

    }


    /* ========== 再次访问：跳过开篇 ========== */

    function applyRevisitState() {

        if (!introSeen()) {
            return;
        }

        /* 已经看过：便签直接摊开，不必再挪一次照片 */
        setNoteOpen(true, true);

        if (hint) {
            hint.textContent =
                "你回来过了。";
        }

        if (osState) {
            osState.textContent = "上次的桌面";
        }

    }


    applyRevisitState();

    /* 供「跳过开篇」入口之外的调试 / 后续接驳使用 */
    window.dkSetNoteOpen = setNoteOpen;

})();
