/* =====================================================
   玉兰阁登录状态管理
   YULAN AUTH SYSTEM
   共享登录状态 · localStorage 持久化
===================================================== */


/* ========== 登录状态键名 ========== */

const AUTH_KEY = "yulan_member_login";


/* ========== 正确账号密码 ========== */

const YULAN_ACCOUNT = "mengqi_2006";
const YULAN_PASSWORD = "07011217";


/* ========== 登录函数 ========== */

function yulanLogin(account, password) {

    if (account === YULAN_ACCOUNT && password === YULAN_PASSWORD) {

        /* 写入登录状态 */
        localStorage.setItem(AUTH_KEY, JSON.stringify({
            account: account,
            loginTime: new Date().toISOString(),
            memberId: "YL-2025-017",
            memberName: "陈梦琪"
        }));

        return {
            success: true,
            memberName: "陈梦琪",
            memberId: "YL-2025-017"
        };

    }

    return {
        success: false
    };

}


/* ========== 检查是否已登录 ========== */

function isLoggedIn() {

    const data = localStorage.getItem(AUTH_KEY);

    if (!data) {
        return false;
    }

    try {
        const parsed = JSON.parse(data);
        return parsed.account === YULAN_ACCOUNT;
    } catch (e) {
        return false;
    }

}


/* ========== 获取登录信息 ========== */

function getLoginInfo() {

    const data = localStorage.getItem(AUTH_KEY);

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }

}


/* ========== 退出登录 ========== */

function yulanLogout() {

    localStorage.removeItem(AUTH_KEY);
    window.location.href = "yulan-index.html";

}


/* ========== 初始化登录状态显示 ========== */

function initAuthUI() {

    const loginButtons = document.querySelectorAll(".yp-login-trigger");
    const memberNameEls = document.querySelectorAll(".js-member-name");
    const logoutLinks = document.querySelectorAll(".js-logout-link");

    if (isLoggedIn()) {

        const info = getLoginInfo();

        /* 登录按钮改为已登录 */
        loginButtons.forEach(function (btn) {
            btn.textContent = "已登录";
        });

        /* 显示会员名字 */
        memberNameEls.forEach(function (el) {
            if (info) {
                el.textContent = info.memberName;
            }
        });

        /* 退出链接 */
        logoutLinks.forEach(function (link) {
            link.style.display = "inline";
        });

    } else {

        loginButtons.forEach(function (btn) {
            btn.textContent = "会员登录";
        });

        logoutLinks.forEach(function (link) {
            link.style.display = "none";
        });

    }

}


/* ========== 页面加载时自动运行 ========== */

document.addEventListener("DOMContentLoaded", function () {
    initAuthUI();
});