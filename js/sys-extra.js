(function () {
  "use strict";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };

  var state = {
    depts: [
      { code: "D001", name: "试验中心", leader: "张工", sort: 1, status: "启用" },
      { code: "D002", name: "质量部", leader: "李审", sort: 2, status: "启用" },
      { code: "D003", name: "运维保障组", leader: "王维", sort: 3, status: "启用" },
    ],
    dicts: [
      { type: "test_type", label: "拉伸试验", value: "tensile", sort: 1, status: "启用" },
      { type: "test_type", label: "压缩试验", value: "compress", sort: 2, status: "启用" },
      { type: "device_status", label: "在线", value: "online", sort: 1, status: "启用" },
      { type: "device_status", label: "告警", value: "warn", sort: 2, status: "启用" },
      { type: "alarm_level", label: "严重", value: "danger", sort: 1, status: "启用" },
    ],
    configs: [
      { key: "sample.defaultHz", value: "200", remark: "默认采样频率" },
      { key: "vote.session.timeout", value: "30", remark: "会话超时(分钟)" },
      { key: "backup.cron", value: "0 2 * * *", remark: "自动备份表达式" },
      { key: "security.tls", value: "true", remark: "强制 TLS" },
    ],
    notices: [
      { id: "N1", title: "系统今晚 22:00 例行备份", type: "系统", time: "今天 09:00", status: "已发布" },
      { id: "N2", title: "试验机 B 通道校准提醒", type: "业务", time: "昨天 16:20", status: "已发布" },
    ],
  };

  function toast(title, msg, type) {
    if (window.ITCApp && ITCApp.toast) return ITCApp.toast(title, msg, type);
  }

  function nowStr() {
    if (window.ITCApp && ITCApp.nowStr) return ITCApp.nowStr();
    return new Date().toLocaleString();
  }

  function pushOpLog(module, action, result) {
    if (window.ITCApp && ITCApp.pushOpLog) ITCApp.pushOpLog(module, action, result);
  }

  var pendingOk = null;

  function openModal(title, bodyHtml, onOk) {
    var modal = $("#sysModal");
    if (!modal) return;
    $("#sysModalTitle").textContent = title;
    $("#sysModalBody").innerHTML = bodyHtml;
    pendingOk = onOk;
    window.__itcModalOk = onOk;
    modal.hidden = false;
  }

  function closeModal() {
    var modal = $("#sysModal");
    if (!modal) return;
    modal.hidden = true;
    pendingOk = null;
    window.__itcModalOk = null;
  }

  function renderDepts() {
    var tbody = $("#deptTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.depts
      .map(function (d) {
        return (
          "<tr><td>" +
          d.code +
          "</td><td>" +
          d.name +
          "</td><td>" +
          d.leader +
          "</td><td>" +
          d.sort +
          "</td><td>" +
          (d.status === "启用" ? '<span class="tag ok">启用</span>' : '<span class="tag danger">停用</span>') +
          '</td><td><button class="btn" data-dept-edit="' +
          d.code +
          '">编辑</button> <button class="btn danger" data-dept-del="' +
          d.code +
          '">删除</button></td></tr>'
        );
      })
      .join("");
  }

  function renderDicts() {
    var tbody = $("#dictTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.dicts
      .map(function (d, i) {
        return (
          "<tr><td>" +
          d.type +
          "</td><td>" +
          d.label +
          "</td><td>" +
          d.value +
          "</td><td>" +
          d.sort +
          "</td><td>" +
          (d.status === "启用" ? '<span class="tag ok">启用</span>' : '<span class="tag danger">停用</span>') +
          '</td><td><button class="btn" data-dict-edit="' +
          i +
          '">编辑</button> <button class="btn danger" data-dict-del="' +
          i +
          '">删除</button></td></tr>'
        );
      })
      .join("");
  }

  function renderConfigs() {
    var tbody = $("#configTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.configs
      .map(function (c, i) {
        return (
          "<tr><td>" +
          c.key +
          "</td><td>" +
          c.value +
          "</td><td>" +
          c.remark +
          '</td><td><button class="btn" data-cfg-edit="' +
          i +
          '">编辑</button> <button class="btn danger" data-cfg-del="' +
          i +
          '">删除</button></td></tr>'
        );
      })
      .join("");
  }

  function renderNotices() {
    var tbody = $("#noticeTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.notices
      .map(function (n) {
        return (
          "<tr><td>" +
          n.title +
          "</td><td>" +
          n.type +
          "</td><td>" +
          n.time +
          "</td><td><span class=\"tag info\">" +
          n.status +
          '</span></td><td><button class="btn danger" data-notice-del="' +
          n.id +
          '">删除</button></td></tr>'
        );
      })
      .join("");
  }

  function renderOpLogs() {
    var tbody = $("#opLogTable tbody");
    if (!tbody) return;
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem("itc_op_logs") || "[]");
    } catch (e) {}
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">暂无操作日志</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .slice(0, 100)
      .map(function (r) {
        return (
          "<tr><td>" +
          r.time +
          "</td><td>" +
          r.user +
          "</td><td>" +
          r.module +
          "</td><td>" +
          r.action +
          "</td><td>" +
          r.result +
          "</td><td>" +
          r.ip +
          "</td></tr>"
        );
      })
      .join("");
  }

  function renderLoginLogs() {
    var tbody = $("#loginLogTable tbody");
    if (!tbody) return;
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem("itc_login_logs") || "[]");
    } catch (e) {}
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">暂无登录日志</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .slice(0, 100)
      .map(function (r) {
        return (
          "<tr><td>" +
          r.time +
          "</td><td>" +
          r.username +
          "</td><td>" +
          (r.ok ? '<span class="tag ok">成功</span>' : '<span class="tag danger">失败</span>') +
          "</td><td>" +
          r.ip +
          "</td><td>" +
          r.ua +
          "</td></tr>"
        );
      })
      .join("");
  }

  function fillProfile() {
    var user = window.ITCAuth && ITCAuth.getUser();
    if (!user) return;
    if ($("#profileUser")) $("#profileUser").value = user.username || "";
    if ($("#profileName")) $("#profileName").value = user.name || "";
    if ($("#profileRole")) $("#profileRole").value = user.role || "";
    if ($("#profileMobile")) {
      try {
        var map = JSON.parse(localStorage.getItem("itc_profile_mobile") || "{}");
        $("#profileMobile").value = map[user.username] || "";
      } catch (e) {
        $("#profileMobile").value = "";
      }
    }
  }

  function bind() {
    if ($("#btnAddDept")) {
      $("#btnAddDept").onclick = function () {
        openModal(
          "新增部门",
          '<div class="form-grid"><div class="field"><label>部门编码</label><input id="fDeptCode"/></div><div class="field"><label>部门名称</label><input id="fDeptName"/></div><div class="field"><label>负责人</label><input id="fDeptLeader"/></div><div class="field"><label>排序</label><input id="fDeptSort" type="number" value="10"/></div></div>',
          function () {
            var code = $("#fDeptCode").value.trim();
            var name = $("#fDeptName").value.trim();
            if (!code || !name) return toast("校验失败", "请填写编码和名称", "warn");
            state.depts.push({
              code: code,
              name: name,
              leader: $("#fDeptLeader").value.trim() || "-",
              sort: Number($("#fDeptSort").value) || 99,
              status: "启用",
            });
            renderDepts();
            pushOpLog("部门管理", "新增部门 " + code, "成功");
            toast("成功", "部门已新增", "");
            closeModal();
          }
        );
      };
    }

    if ($("#deptTable")) {
      $("#deptTable").onclick = function (e) {
        var del = e.target.closest("[data-dept-del]");
        var edit = e.target.closest("[data-dept-edit]");
        if (del) {
          state.depts = state.depts.filter(function (d) {
            return d.code !== del.dataset.deptDel;
          });
          renderDepts();
          pushOpLog("部门管理", "删除部门 " + del.dataset.deptDel, "成功");
          toast("已删除", del.dataset.deptDel, "warn");
        }
        if (edit) {
          var d = state.depts.find(function (x) {
            return x.code === edit.dataset.deptEdit;
          });
          if (!d) return;
          openModal(
            "编辑部门",
            '<div class="form-grid"><div class="field"><label>部门编码</label><input id="fDeptCode" value="' +
              d.code +
              '" disabled/></div><div class="field"><label>部门名称</label><input id="fDeptName" value="' +
              d.name +
              '"/></div><div class="field"><label>负责人</label><input id="fDeptLeader" value="' +
              d.leader +
              '"/></div><div class="field"><label>排序</label><input id="fDeptSort" type="number" value="' +
              d.sort +
              '"/></div></div>',
            function () {
              d.name = $("#fDeptName").value.trim() || d.name;
              d.leader = $("#fDeptLeader").value.trim() || "-";
              d.sort = Number($("#fDeptSort").value) || 0;
              renderDepts();
              pushOpLog("部门管理", "编辑部门 " + d.code, "成功");
              toast("成功", "部门已更新", "");
              closeModal();
            }
          );
        }
      };
    }

    if ($("#btnAddDict")) {
      $("#btnAddDict").onclick = function () {
        openModal(
          "新增字典项",
          '<div class="form-grid"><div class="field"><label>字典类型</label><input id="fDictType" placeholder="test_type"/></div><div class="field"><label>字典标签</label><input id="fDictLabel"/></div><div class="field"><label>字典值</label><input id="fDictValue"/></div><div class="field"><label>排序</label><input id="fDictSort" type="number" value="1"/></div></div>',
          function () {
            state.dicts.push({
              type: $("#fDictType").value.trim() || "custom",
              label: $("#fDictLabel").value.trim() || "-",
              value: $("#fDictValue").value.trim() || "-",
              sort: Number($("#fDictSort").value) || 1,
              status: "启用",
            });
            renderDicts();
            pushOpLog("字典管理", "新增字典项", "成功");
            toast("成功", "字典项已新增", "");
            closeModal();
          }
        );
      };
    }

    if ($("#dictTable")) {
      $("#dictTable").onclick = function (e) {
        var del = e.target.closest("[data-dict-del]");
        var edit = e.target.closest("[data-dict-edit]");
        if (del) {
          state.dicts.splice(Number(del.dataset.dictDel), 1);
          renderDicts();
          pushOpLog("字典管理", "删除字典项", "成功");
        }
        if (edit) {
          var i = Number(edit.dataset.dictEdit);
          var d = state.dicts[i];
          openModal(
            "编辑字典项",
            '<div class="form-grid"><div class="field"><label>字典类型</label><input id="fDictType" value="' +
              d.type +
              '"/></div><div class="field"><label>字典标签</label><input id="fDictLabel" value="' +
              d.label +
              '"/></div><div class="field"><label>字典值</label><input id="fDictValue" value="' +
              d.value +
              '"/></div><div class="field"><label>排序</label><input id="fDictSort" type="number" value="' +
              d.sort +
              '"/></div></div>',
            function () {
              d.type = $("#fDictType").value.trim();
              d.label = $("#fDictLabel").value.trim();
              d.value = $("#fDictValue").value.trim();
              d.sort = Number($("#fDictSort").value) || 1;
              renderDicts();
              pushOpLog("字典管理", "编辑字典项", "成功");
              toast("成功", "字典项已更新", "");
              closeModal();
            }
          );
        }
      };
    }

    if ($("#btnAddConfig")) {
      $("#btnAddConfig").onclick = function () {
        openModal(
          "新增参数",
          '<div class="form-grid"><div class="field"><label>参数键</label><input id="fCfgKey"/></div><div class="field"><label>参数值</label><input id="fCfgVal"/></div><div class="field full"><label>说明</label><input id="fCfgRemark"/></div></div>',
          function () {
            var key = $("#fCfgKey").value.trim();
            if (!key) return toast("校验失败", "请填写参数键", "warn");
            state.configs.push({
              key: key,
              value: $("#fCfgVal").value.trim(),
              remark: $("#fCfgRemark").value.trim() || "-",
            });
            renderConfigs();
            pushOpLog("系统参数", "新增 " + key, "成功");
            toast("成功", "参数已新增", "");
            closeModal();
          }
        );
      };
    }

    if ($("#configTable")) {
      $("#configTable").onclick = function (e) {
        var del = e.target.closest("[data-cfg-del]");
        var edit = e.target.closest("[data-cfg-edit]");
        if (del) {
          state.configs.splice(Number(del.dataset.cfgDel), 1);
          renderConfigs();
          pushOpLog("系统参数", "删除参数", "成功");
        }
        if (edit) {
          var i = Number(edit.dataset.cfgEdit);
          var c = state.configs[i];
          openModal(
            "编辑参数",
            '<div class="form-grid"><div class="field"><label>参数键</label><input id="fCfgKey" value="' +
              c.key +
              '" disabled/></div><div class="field"><label>参数值</label><input id="fCfgVal" value="' +
              c.value +
              '"/></div><div class="field full"><label>说明</label><input id="fCfgRemark" value="' +
              c.remark +
              '"/></div></div>',
            function () {
              c.value = $("#fCfgVal").value.trim();
              c.remark = $("#fCfgRemark").value.trim();
              renderConfigs();
              pushOpLog("系统参数", "编辑 " + c.key, "成功");
              toast("成功", "参数已更新", "");
              closeModal();
            }
          );
        }
      };
    }

    if ($("#btnAddNotice")) {
      $("#btnAddNotice").onclick = function () {
        openModal(
          "发布通知",
          '<div class="form-grid" style="grid-template-columns:1fr"><div class="field"><label>标题</label><input id="fNoticeTitle"/></div><div class="field"><label>类型</label><select id="fNoticeType"><option>系统</option><option>业务</option><option>告警</option></select></div></div>',
          function () {
            var title = $("#fNoticeTitle").value.trim();
            if (!title) return toast("校验失败", "请填写标题", "warn");
            state.notices.unshift({
              id: "N" + Date.now(),
              title: title,
              type: $("#fNoticeType").value,
              time: nowStr(),
              status: "已发布",
            });
            renderNotices();
            pushOpLog("消息通知", "发布通知", "成功");
            toast("已发布", title, "");
            closeModal();
          }
        );
      };
    }

    if ($("#noticeTable")) {
      $("#noticeTable").onclick = function (e) {
        var del = e.target.closest("[data-notice-del]");
        if (!del) return;
        state.notices = state.notices.filter(function (n) {
          return n.id !== del.dataset.noticeDel;
        });
        renderNotices();
        pushOpLog("消息通知", "删除通知", "成功");
      };
    }

    if ($("#btnClearOpLogs")) {
      $("#btnClearOpLogs").onclick = function () {
        localStorage.removeItem("itc_op_logs");
        renderOpLogs();
        toast("已清空", "操作日志", "warn");
      };
    }

    if ($("#btnSaveProfile")) {
      $("#btnSaveProfile").onclick = function () {
        var user = window.ITCAuth && ITCAuth.getUser();
        if (!user) return;
        var name = $("#profileName").value.trim();
        var mobile = $("#profileMobile").value.trim();
        try {
          var sess = JSON.parse(sessionStorage.getItem("itc_auth_session") || localStorage.getItem("itc_auth_session") || "{}");
          sess.name = name || sess.name;
          sessionStorage.setItem("itc_auth_session", JSON.stringify(sess));
          if (localStorage.getItem("itc_auth_session")) localStorage.setItem("itc_auth_session", JSON.stringify(sess));
          var map = JSON.parse(localStorage.getItem("itc_profile_mobile") || "{}");
          map[user.username] = mobile;
          localStorage.setItem("itc_profile_mobile", JSON.stringify(map));
        } catch (e) {}
        var pill = $("#userPill");
        if (pill) pill.textContent = (name || user.username) + " · " + (user.role || "");
        pushOpLog("个人中心", "更新资料", "成功");
        toast("已保存", "个人资料已更新", "");
      };
    }

    if ($("#btnChangePwd")) {
      $("#btnChangePwd").onclick = function () {
        var oldPwd = $("#profileOldPwd").value;
        var n1 = $("#profileNewPwd").value;
        var n2 = $("#profileNewPwd2").value;
        if (!oldPwd || !n1) return toast("校验失败", "请填写密码", "warn");
        if (n1 !== n2) return toast("校验失败", "两次新密码不一致", "warn");
        if (n1.length < 6) return toast("校验失败", "新密码至少 6 位", "warn");
        $("#profileOldPwd").value = "";
        $("#profileNewPwd").value = "";
        $("#profileNewPwd2").value = "";
        pushOpLog("个人中心", "修改密码", "成功");
        toast("成功", "密码已修改（演示，本地未持久化账号库）", "");
      };
    }
  }

  function init() {
    renderDepts();
    renderDicts();
    renderConfigs();
    renderNotices();
    renderOpLogs();
    renderLoginLogs();
    fillProfile();
    bind();

    // 切到个人中心时刷新资料
    document.querySelectorAll('.nav-item[data-view="profile"]').forEach(function (btn) {
      btn.addEventListener("click", fillProfile);
    });
    document.querySelectorAll('.nav-item[data-view="oplogs"]').forEach(function (btn) {
      btn.addEventListener("click", renderOpLogs);
    });
    document.querySelectorAll('.nav-item[data-view="loginlogs"]').forEach(function (btn) {
      btn.addEventListener("click", renderLoginLogs);
    });
  }

  window.ITCSysExtra = {
    renderOpLogs: renderOpLogs,
    renderLoginLogs: renderLoginLogs,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
