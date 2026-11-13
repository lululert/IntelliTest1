(function () {
  "use strict";

  if (window.ITCAuth && ITCAuth.isLoggedIn()) {
    location.replace("index.html");
    return;
  }

  var form = document.getElementById("loginForm");
  var err = document.getElementById("loginError");
  var btn = document.getElementById("loginBtn");
  var userInput = document.getElementById("username");
  var remembered = ITCAuth.getRememberedUsername();
  if (remembered) {
    userInput.value = remembered;
    document.getElementById("password").focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.hidden = true;
    btn.classList.add("loading");
    btn.textContent = "登录中…";

    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var remember = document.getElementById("remember").checked;

    setTimeout(function () {
      var res = ITCAuth.login(username, password, remember);
      if (!res.ok) {
        err.textContent = res.message;
        err.hidden = false;
        btn.classList.remove("loading");
        btn.textContent = "登 录";
        return;
      }
      var params = new URLSearchParams(location.search);
      var redirect = params.get("redirect") || "index.html";
      if (!/^[\w.-]+\.html$/i.test(redirect)) redirect = "index.html";
      location.replace(redirect);
    }, 350);
  });
})();
