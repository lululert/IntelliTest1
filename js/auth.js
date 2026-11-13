(function (global) {
  "use strict";

  var STORAGE_KEY = "itc_auth_session";
  var REMEMBER_KEY = "itc_auth_remember";

  var USERS = [
    { username: "admin", password: "admin123", role: "系统管理员", name: "管理员" },
    { username: "ops01", password: "ops123", role: "试验操作员", name: "操作员" },
    { username: "qa02", password: "qa123", role: "质量审核员", name: "审核员" },
  ];

  function readSession() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var user = JSON.parse(raw);
      if (!user || !user.username) {
        clearSession();
        return null;
      }
      return user;
    } catch (e) {
      try {
        clearSession();
      } catch (e2) {}
      return null;
    }
  }

  function writeSession(user, remember) {
    var payload = JSON.stringify({
      username: user.username,
      name: user.name,
      role: user.role,
      loginAt: new Date().toISOString(),
    });
    sessionStorage.setItem(STORAGE_KEY, payload);
    if (remember) localStorage.setItem(STORAGE_KEY, payload);
    else localStorage.removeItem(STORAGE_KEY);
  }

  function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  function writeLoginLog(username, ok) {
    try {
      var ua = (navigator.userAgent || "").slice(0, 48);
      var row = {
        time: new Date().toISOString().replace("T", " ").slice(0, 19),
        username: username || "-",
        ok: !!ok,
        ip: "127.0.0.1",
        ua: ua,
      };
      var list = JSON.parse(localStorage.getItem("itc_login_logs") || "[]");
      list.unshift(row);
      localStorage.setItem("itc_login_logs", JSON.stringify(list.slice(0, 200)));
    } catch (e) {}
  }

  function login(username, password, remember) {
    var u = String(username || "").trim();
    var p = String(password || "");
    var found = USERS.find(function (item) {
      return item.username === u && item.password === p;
    });
    if (!found) {
      writeLoginLog(u, false);
      return { ok: false, message: "账号或密码错误" };
    }
    writeSession(found, !!remember);
    writeLoginLog(u, true);
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, u);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch (e) {}
    return { ok: true, user: found };
  }

  function logout() {
    clearSession();
  }

  function getUser() {
    return readSession();
  }

  function isLoggedIn() {
    return !!readSession();
  }

  function requireAuth() {
    if (!isLoggedIn()) {
      var file = "index.html";
      try {
        var parts = String(location.pathname || "").split(/[/\\]/);
        var last = parts[parts.length - 1] || "";
        if (/\.html$/i.test(last)) file = last;
      } catch (e) {}
      location.replace("login.html?redirect=" + encodeURIComponent(file));
      return false;
    }
    return true;
  }

  function getRememberedUsername() {
    try {
      return localStorage.getItem(REMEMBER_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  global.ITCAuth = {
    login: login,
    logout: logout,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    requireAuth: requireAuth,
    getRememberedUsername: getRememberedUsername,
  };
})(window);
