(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = {
    running: false,
    autoControl: true,
    autoOptimize: true,
    remoteLock: false,
    testType: "拉伸试验",
    params: {
      force: 120,
      speed: 2.5,
      temp: 25.0,
      sampleHz: 200,
    },
    devices: [
      { id: "TM-01", name: "万能试验主机", protocol: "Ethernet", status: "online", ip: "192.168.10.11" },
      { id: "DAQ-02", name: "高频采集模块", protocol: "Ethernet", status: "online", ip: "192.168.10.21" },
      { id: "SEN-03", name: "力传感器节点", protocol: "Modbus", status: "online", ip: "192.168.10.31" },
      { id: "ENV-04", name: "环境箱控制器", protocol: "CANbus", status: "warn", ip: "192.168.10.41" },
      { id: "CAM-05", name: "视觉观测单元", protocol: "Ethernet", status: "offline", ip: "192.168.10.51" },
    ],
    alerts: [],
    logs: [],
    reports: [
      { id: "R-20260318-001", title: "拉伸试验报告 A样", time: "2026-03-18 09:22", result: "合格" },
      { id: "R-20260317-014", title: "疲劳试验阶段汇总", time: "2026-03-17 16:48", result: "合格" },
      { id: "R-20260316-008", title: "冲击试验异常复核", time: "2026-03-16 11:05", result: "复测" },
    ],
    history: [],
    series: { force: [], temp: [], vib: [] },
    maxPoints: 60,
    auditUsers: [
      { user: "admin", role: "系统管理员", last: "刚刚" },
      { user: "ops01", role: "试验操作员", last: "5 分钟前" },
      { user: "qa02", role: "质量审核员", last: "1 小时前" },
    ],
    backups: [
      { id: "B-001", type: "全量备份", status: "成功", time: "今天 02:00" },
      { id: "B-002", type: "增量备份", status: "成功", time: "今天 08:00" },
      { id: "B-003", type: "异地同步", status: "进行中", time: "刚刚" },
    ],
    drills: [
      { id: "D-001", scene: "主库宕机切换", result: "成功", time: "2026-03-10 15:20" },
      { id: "D-002", scene: "备份回滚验证", result: "成功", time: "2026-03-01 09:40" },
    ],
    optLogs: [
      { time: "刚刚", strategy: "ML-力闭环", item: "目标力值", before: "128.4", after: "120.0", reason: "超调抑制" },
      { time: "2 分钟前", strategy: "环境补偿", item: "加载速度", before: "2.8", after: "2.5", reason: "温度漂移" },
    ],
    sysUsers: [
      { id: "U1", username: "admin", name: "管理员", roleCode: "admin", mobile: "13800000001", status: "启用", lastLogin: "刚刚" },
      { id: "U2", username: "ops01", name: "操作员", roleCode: "operator", mobile: "13800000002", status: "启用", lastLogin: "5 分钟前" },
      { id: "U3", username: "qa02", name: "审核员", roleCode: "auditor", mobile: "13800000003", status: "启用", lastLogin: "1 小时前" },
      { id: "U4", username: "guest", name: "访客", roleCode: "viewer", mobile: "13800000004", status: "停用", lastLogin: "昨天" },
    ],
    sysRoles: [
      { code: "admin", name: "系统管理员", remark: "全部权限", status: "启用" },
      { code: "operator", name: "试验操作员", remark: "试验控制与监测", status: "启用" },
      { code: "auditor", name: "质量审核员", remark: "报告与数据审核", status: "启用" },
      { code: "viewer", name: "只读访客", remark: "仅查看看板", status: "启用" },
    ],
    sysMenus: [
      { id: "M1", name: "总览看板", type: "菜单", path: "dashboard", sort: 1, visible: true, parentId: "" },
      { id: "M2", name: "实时监测", type: "菜单", path: "monitor", sort: 2, visible: true, parentId: "" },
      { id: "M3", name: "试验控制", type: "菜单", path: "control", sort: 3, visible: true, parentId: "" },
      { id: "M4", name: "设备互联", type: "菜单", path: "devices", sort: 4, visible: true, parentId: "" },
      { id: "M5", name: "用户管理", type: "菜单", path: "users", sort: 20, visible: true, parentId: "MS" },
      { id: "M6", name: "角色管理", type: "菜单", path: "roles", sort: 21, visible: true, parentId: "MS" },
      { id: "M7", name: "菜单管理", type: "菜单", path: "menus", sort: 22, visible: true, parentId: "MS" },
      { id: "M8", name: "权限分配", type: "菜单", path: "perms", sort: 23, visible: true, parentId: "MS" },
      { id: "MS", name: "系统管理", type: "目录", path: "system", sort: 19, visible: true, parentId: "" },
      { id: "M9", name: "新增用户", type: "按钮", path: "user:add", sort: 1, visible: true, parentId: "M5" },
    ],
    rolePerms: {
      admin: ["M1", "M2", "M3", "M4", "MS", "M5", "M6", "M7", "M8", "M9"],
      operator: ["M1", "M2", "M3", "M4"],
      auditor: ["M1", "M2", "M5"],
      viewer: ["M1", "M2"],
    },
    modal: { type: "", mode: "", id: null },
  };

  const titles = {
    dashboard: "总览看板",
    control: "试验控制",
    devices: "设备互联",
    monitor: "实时监测",
    data: "数据中心",
    reports: "报告中心",
    optimize: "智能优化",
    fault: "故障预警",
    remote: "远程控制",
    security: "安全备份",
    users: "用户管理",
    roles: "角色管理",
    menus: "菜单管理",
    perms: "权限分配",
    depts: "部门管理",
    dicts: "字典管理",
    configs: "系统参数",
    notices: "消息通知",
    oplogs: "操作日志",
    loginlogs: "登录日志",
    profile: "个人中心",
  };

  function nowStr() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function pushLog(level, msg) {
    state.logs.unshift({ level, msg, time: nowStr() });
    if (state.logs.length > 80) state.logs.length = 80;
    renderLogs();
  }

  function toast(title, msg, type) {
    const wrap = $("#toastWrap");
    const el = document.createElement("div");
    el.className = `toast ${type || ""}`;
    el.innerHTML = `<div class="title">${title}</div><div class="msg">${msg}</div>`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function pushAlert(level, title, detail) {
    state.alerts.unshift({
      id: "A-" + Date.now(),
      level,
      title,
      detail,
      time: nowStr(),
    });
    if (state.alerts.length > 40) state.alerts.length = 40;
    renderAlerts();
    renderFaultTable();
    toast(title, detail, level === "danger" ? "danger" : level === "warn" ? "warn" : "");
  }

  function switchView(name) {
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    $("#pageTitle").textContent = titles[name] || name;
    $("#pageCrumb").textContent = "IntelliTest / " + (titles[name] || name);
  }

  function renderDevices() {
    const tbody = $("#deviceTable tbody");
    tbody.innerHTML = state.devices
      .map((d) => {
        const tag =
          d.status === "online"
            ? '<span class="tag ok">在线</span>'
            : d.status === "warn"
              ? '<span class="tag warn">告警</span>'
              : '<span class="tag danger">离线</span>';
        return `<tr>
          <td>${d.id}</td>
          <td>${d.name}</td>
          <td>${d.protocol}</td>
          <td>${d.ip}</td>
          <td>${tag}</td>
          <td>
            <button class="btn" data-act="ping" data-id="${d.id}">探测</button>
            <button class="btn" data-act="cfg" data-id="${d.id}">配置</button>
          </td>
        </tr>`;
      })
      .join("");
  }

  function renderReports() {
    const tbody = $("#reportTable tbody");
    tbody.innerHTML = state.reports
      .map(
        (r) => `<tr>
        <td>${r.id}</td>
        <td>${r.title}</td>
        <td>${r.time}</td>
        <td>${r.result === "合格" ? '<span class="tag ok">合格</span>' : '<span class="tag warn">复测</span>'}</td>
        <td><button class="btn" data-report="${r.id}">预览</button></td>
      </tr>`
      )
      .join("");
  }

  function renderHistory() {
    const tbody = $("#historyTable tbody");
    if (!tbody) return;
    const filter = ($("#historyTypeFilter") && $("#historyTypeFilter").value) || "";
    const list = state.history.filter((h) => !filter || h.type === filter);
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">暂无历史记录，启动试验后将自动写入</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(
        (h) => `<tr>
        <td>${h.time}</td>
        <td>${h.type}</td>
        <td>${h.force.toFixed(1)}</td>
        <td>${h.temp.toFixed(1)}</td>
        <td>${h.hz}</td>
        <td>${h.note}</td>
      </tr>`
      )
      .join("");
  }

  function renderDrills() {
    const tbody = $("#drillTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.drills
      .map(
        (d) => `<tr>
        <td>${d.id}</td>
        <td>${d.scene}</td>
        <td>${d.result === "成功" ? '<span class="tag ok">成功</span>' : '<span class="tag warn">部分成功</span>'}</td>
        <td>${d.time}</td>
      </tr>`
      )
      .join("");
  }

  function renderOptLogs() {
    const tbody = $("#optLogTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.optLogs
      .map(
        (o) => `<tr>
        <td>${o.time}</td>
        <td>${o.strategy}</td>
        <td>${o.item}</td>
        <td>${o.before}</td>
        <td>${o.after}</td>
        <td>${o.reason}</td>
      </tr>`
      )
      .join("");
  }

  function pushOpLog(module, action, result) {
    const user = window.ITCAuth && ITCAuth.getUser();
    const row = {
      time: nowStr(),
      user: user ? user.username : "-",
      module,
      action,
      result: result || "成功",
      ip: "127.0.0.1",
    };
    try {
      const key = "itc_op_logs";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.unshift(row);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
    } catch (e) {}
    if (window.ITCSysExtra && typeof ITCSysExtra.renderOpLogs === "function") {
      ITCSysExtra.renderOpLogs();
    }
  }

  function renderAlerts() {
    const box = $("#alertList");
    if (!state.alerts.length) {
      box.innerHTML = '<div class="empty">暂无告警</div>';
      return;
    }
    box.innerHTML = state.alerts
      .slice(0, 8)
      .map((a) => {
        const cls = a.level === "danger" ? "danger" : a.level === "warn" ? "warn" : "info";
        return `<div class="status-row">
          <div>
            <div class="name">${a.title}</div>
            <div style="font-size:12px;color:var(--text-muted)">${a.detail}</div>
          </div>
          <div style="text-align:right">
            <span class="tag ${cls}">${a.level}</span>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${a.time.slice(11)}</div>
          </div>
        </div>`;
      })
      .join("");
  }

  function renderFaultTable() {
    const tbody = $("#faultTable tbody");
    if (!state.alerts.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">系统运行正常，无活跃故障</td></tr>';
      return;
    }
    tbody.innerHTML = state.alerts
      .slice(0, 12)
      .map(
        (a) => `<tr>
        <td>${a.id}</td>
        <td>${a.time}</td>
        <td>${a.title}</td>
        <td>${a.detail}</td>
        <td><button class="btn" data-recover="${a.id}">执行恢复</button></td>
      </tr>`
      )
      .join("");
  }

  function renderLogs() {
    const el = $("#sysLog");
    if (!el) return;
    el.innerHTML = state.logs
      .slice(0, 30)
      .map((l) => `<div class="line ${l.level}"><span class="t">[${l.time.slice(11)}]</span> ${l.msg}</div>`)
      .join("");
  }

  function renderKpis() {
    const lastF = state.series.force[state.series.force.length - 1] || state.params.force;
    const lastT = state.series.temp[state.series.temp.length - 1] || state.params.temp;
    const online = state.devices.filter((d) => d.status === "online").length;
    $("#kpiForce").textContent = lastF.toFixed(1);
    $("#kpiTemp").textContent = lastT.toFixed(1);
    $("#kpiDevices").textContent = `${online}/${state.devices.length}`;
    $("#kpiAlerts").textContent = String(state.alerts.filter((a) => a.level !== "info").length);
    $("#runStateText").textContent = state.running ? "试验进行中" : "待机";
    $("#runStateDot").className = "dot " + (state.running ? "" : "warn");
    $("#ctrlStatus").textContent = state.running ? "运行中" : "已停止";
    $("#remoteRunLabel").textContent = state.running ? "运行中" : "已停止";
  }

  function drawChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(42,54,68,.9)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (data.length < 2) return;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    data.forEach((v, i) => {
      const x = (i / (state.maxPoints - 1)) * (w - 8) + 4;
      const y = h - ((v - min) / span) * (h - 16) - 8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color.replace(")", ",0.25)").replace("rgb", "rgba"));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.lineTo(w - 4, h - 4);
    ctx.lineTo(4, h - 4);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function tickSeries() {
    let force = state.params.force + (Math.random() - 0.5) * (state.running ? 8 : 1.2);
    let temp = state.params.temp + (Math.random() - 0.5) * (state.running ? 0.6 : 0.15);
    let vib = 0.2 + Math.random() * (state.running ? 1.8 : 0.4);

    if (state.running && state.autoOptimize) {
      // 模拟自动调参：力值向目标收敛
      const target = Number($("#paramForce").value || state.params.force);
      force = force * 0.85 + target * 0.15 + (Math.random() - 0.5);
      state.params.force = Number((state.params.force * 0.9 + target * 0.1).toFixed(1));
    }

    if (state.running && Math.random() < 0.04) {
      force += 25;
      pushAlert("warn", "力值波动超限", `瞬时力值 ${force.toFixed(1)} N，已触发自动抑制`);
      if (state.autoControl) {
        force *= 0.7;
        pushLog("warn", "自动控制：力值回落抑制已执行");
      }
    }

    if (Math.random() < 0.015) {
      const env = state.devices.find((d) => d.id === "ENV-04");
      if (env && env.status !== "offline") {
        env.status = "warn";
        pushAlert("danger", "环境箱通信抖动", "CANbus 节点延时升高，建议检查总线终端电阻");
        renderDevices();
      }
    }

    state.series.force.push(force);
    state.series.temp.push(temp);
    state.series.vib.push(vib);
    ["force", "temp", "vib"].forEach((k) => {
      if (state.series[k].length > state.maxPoints) state.series[k].shift();
    });

    if (state.running && Math.random() < 0.2) {
      state.history.unshift({
        time: nowStr(),
        type: state.testType,
        force,
        temp,
        hz: state.params.sampleHz,
        note: state.autoControl ? "闭环控制中" : "手动模式",
      });
      if (state.history.length > 50) state.history.length = 50;
      renderHistory();
    }

    renderKpis();
    drawChart("chartForce", state.series.force, "rgb(26,166,160)");
    drawChart("chartTemp", state.series.temp, "rgb(76,157,255)");
    drawChart("chartVib", state.series.vib, "rgb(230,162,60)");
    drawChart("chartDash", state.series.force, "rgb(26,166,160)");
  }

  function bindNav() {
    $$(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });
  }

  function bindControls() {
    $("#btnStart").addEventListener("click", () => {
      if (state.remoteLock) {
        toast("操作受限", "远程锁定中，请先解除锁定", "warn");
        return;
      }
      state.running = true;
      state.testType = $("#testType").value;
      state.params.force = Number($("#paramForce").value);
      state.params.speed = Number($("#paramSpeed").value);
      state.params.temp = Number($("#paramTemp").value);
      state.params.sampleHz = Number($("#paramHz").value);
      pushLog("ok", `试验启动：${state.testType}`);
      toast("试验已启动", state.testType, "");
      renderKpis();
    });

    $("#btnStop").addEventListener("click", () => {
      state.running = false;
      pushLog("warn", "试验已停止");
      toast("试验已停止", "设备进入待机", "warn");
      renderKpis();
    });

    $("#autoControl").addEventListener("change", (e) => {
      state.autoControl = e.target.checked;
      pushLog("ok", `自动控制 ${state.autoControl ? "开启" : "关闭"}`);
    });

    $("#autoOptimize").addEventListener("change", (e) => {
      state.autoOptimize = e.target.checked;
      pushLog("ok", `智能优化 ${state.autoOptimize ? "开启" : "关闭"}`);
    });

    $("#btnGenReport").addEventListener("click", () => {
      const id = "R-" + nowStr().replace(/[-: ]/g, "").slice(0, 14);
      state.reports.unshift({
        id,
        title: `${state.testType}自动报告`,
        time: nowStr(),
        result: Math.random() > 0.2 ? "合格" : "复测",
      });
      renderReports();
      pushLog("ok", `已生成试验报告 ${id}`);
      toast("报告已生成", id, "");
      switchView("reports");
    });

    $("#btnExport").addEventListener("click", () => {
      const rows = [["时间", "试验类型", "力值", "温度", "采样率", "备注"]];
      state.history.forEach((h) => {
        rows.push([h.time, h.type, h.force.toFixed(2), h.temp.toFixed(2), h.hz, h.note]);
      });
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "trial-history.csv";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("导出完成", "trial-history.csv", "");
    });

    $("#btnBackup").addEventListener("click", () => {
      state.backups.unshift({
        id: "B-" + String(Math.floor(Math.random() * 900 + 100)),
        type: "手动全量备份",
        status: "成功",
        time: nowStr(),
      });
      renderBackups();
      pushLog("ok", "手动备份完成");
      pushOpLog("安全备份", "手动全量备份", "成功");
      toast("备份成功", "冗余副本已写入备份区", "");
    });

    const drillBtn = $("#btnDrill");
    if (drillBtn) {
      drillBtn.addEventListener("click", () => {
        state.drills.unshift({
          id: "D-" + String(Math.floor(Math.random() * 900 + 100)),
          scene: "应急切换演练",
          result: Math.random() > 0.2 ? "成功" : "部分成功",
          time: nowStr(),
        });
        renderDrills();
        pushLog("ok", "容灾演练完成");
        pushOpLog("安全备份", "容灾恢复演练", "成功");
        toast("演练完成", "容灾切换链路已验证", "");
      });
    }

    const histFilter = $("#historyTypeFilter");
    if (histFilter) histFilter.addEventListener("change", renderHistory);

    $("#remoteLock").addEventListener("change", (e) => {
      state.remoteLock = e.target.checked;
      pushLog(state.remoteLock ? "warn" : "ok", state.remoteLock ? "远程锁定已开启" : "远程锁定已解除");
    });

    $("#btnRemoteStart").addEventListener("click", () => $("#btnStart").click());
    $("#btnRemoteStop").addEventListener("click", () => $("#btnStop").click());

    $("#deviceTable").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      const d = state.devices.find((x) => x.id === id);
      if (!d) return;
      if (act === "ping") {
        d.status = Math.random() > 0.15 ? "online" : "warn";
        pushLog("ok", `设备探测 ${id} -> ${d.status}`);
        renderDevices();
      }
      if (act === "cfg") {
        toast("通信配置", `${d.name} / ${d.protocol}`, "");
        pushLog("ok", `打开 ${id} 协议配置面板`);
      }
    });

    $("#reportTable").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-report]");
      if (!btn) return;
      toast("报告预览", btn.dataset.report, "");
    });

    $("#faultTable").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-recover]");
      if (!btn) return;
      const id = btn.dataset.recover;
      state.alerts = state.alerts.filter((a) => a.id !== id);
      const env = state.devices.find((d) => d.id === "ENV-04");
      if (env) env.status = "online";
      renderAlerts();
      renderFaultTable();
      renderDevices();
      pushLog("ok", `故障恢复动作已执行：${id}`);
      toast("恢复完成", id, "");
    });

    $("#protoForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#newDeviceName").value.trim();
      const protocol = $("#newProtocol").value;
      if (!name) return;
      const id = "DEV-" + String(Math.floor(Math.random() * 90 + 10));
      state.devices.push({
        id,
        name,
        protocol,
        status: "online",
        ip: "192.168.10." + String(Math.floor(Math.random() * 80 + 60)),
      });
      renderDevices();
      pushLog("ok", `新建设备互联节点 ${id} (${protocol})`);
      e.target.reset();
      toast("设备已接入", name, "");
    });
  }

  function renderBackups() {
    const tbody = $("#backupTable tbody");
    tbody.innerHTML = state.backups
      .map(
        (b) => `<tr>
        <td>${b.id}</td>
        <td>${b.type}</td>
        <td>${b.status === "成功" ? '<span class="tag ok">成功</span>' : '<span class="tag info">进行中</span>'}</td>
        <td>${b.time}</td>
      </tr>`
      )
      .join("");
  }

  function renderRoles() {
    const tbody = $("#auditTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.auditUsers
      .map(
        (r) => `<tr>
        <td>${r.user}</td>
        <td>${r.role}</td>
        <td>${r.last}</td>
      </tr>`
      )
      .join("");
  }

  function roleName(code) {
    const r = state.sysRoles.find((x) => x.code === code);
    return r ? r.name : code;
  }

  function countRoleUsers(code) {
    return state.sysUsers.filter((u) => u.roleCode === code).length;
  }

  function renderUserManage() {
    const tbody = $("#userManageTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.sysUsers
      .map(
        (u) => `<tr>
        <td>${u.username}</td>
        <td>${u.name}</td>
        <td>${roleName(u.roleCode)}</td>
        <td>${u.mobile || "-"}</td>
        <td>${u.status === "启用" ? '<span class="tag ok">启用</span>' : '<span class="tag danger">停用</span>'}</td>
        <td>${u.lastLogin || "-"}</td>
        <td>
          <button class="btn" type="button" data-user-edit="${u.id}">编辑</button>
          <button class="btn danger" type="button" data-user-del="${u.id}">删除</button>
        </td>
      </tr>`
      )
      .join("");
  }

  function renderRoleManage() {
    const tbody = $("#roleManageTable tbody");
    if (!tbody) return;
    tbody.innerHTML = state.sysRoles
      .map(
        (r) => `<tr>
        <td>${r.code}</td>
        <td>${r.name}</td>
        <td>${r.remark || "-"}</td>
        <td>${r.status === "启用" ? '<span class="tag ok">启用</span>' : '<span class="tag danger">停用</span>'}</td>
        <td>${countRoleUsers(r.code)}</td>
        <td>
          <button class="btn" type="button" data-role-edit="${r.code}">编辑</button>
          <button class="btn danger" type="button" data-role-del="${r.code}">删除</button>
        </td>
      </tr>`
      )
      .join("");
  }

  function renderMenuManage() {
    const tbody = $("#menuManageTable tbody");
    if (!tbody) return;
    const sorted = state.sysMenus.slice().sort((a, b) => {
      const pa = a.parentId || "";
      const pb = b.parentId || "";
      if (pa !== pb) return pa.localeCompare(pb);
      return a.sort - b.sort;
    });
    tbody.innerHTML = sorted
      .map((m) => {
        const indent = m.parentId ? "　└ " : "";
        return `<tr>
        <td>${indent}${m.name}</td>
        <td><span class="tag info">${m.type}</span></td>
        <td>${m.path}</td>
        <td>${m.sort}</td>
        <td>${m.visible ? '<span class="tag ok">是</span>' : '<span class="tag warn">否</span>'}</td>
        <td>
          <button class="btn" type="button" data-menu-edit="${m.id}">编辑</button>
          <button class="btn danger" type="button" data-menu-del="${m.id}">删除</button>
        </td>
      </tr>`;
      })
      .join("");
  }

  function renderPermSelect() {
    const sel = $("#permRoleSelect");
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = state.sysRoles
      .map((r) => `<option value="${r.code}">${r.name}（${r.code}）</option>`)
      .join("");
    if (cur && state.sysRoles.some((r) => r.code === cur)) sel.value = cur;
    renderPermTree();
  }

  function renderPermTree() {
    const box = $("#permMenuTree");
    const sel = $("#permRoleSelect");
    if (!box || !sel) return;
    const code = sel.value;
    const checked = new Set(state.rolePerms[code] || []);
    const roots = state.sysMenus.filter((m) => !m.parentId).sort((a, b) => a.sort - b.sort);
    const html = [];
    roots.forEach((root) => {
      html.push(
        `<label class="perm-item"><input type="checkbox" value="${root.id}" ${checked.has(root.id) ? "checked" : ""}/> ${root.name} <span class="tag info">${root.type}</span></label>`
      );
      state.sysMenus
        .filter((m) => m.parentId === root.id)
        .sort((a, b) => a.sort - b.sort)
        .forEach((child) => {
          html.push(
            `<label class="perm-item child"><input type="checkbox" value="${child.id}" ${checked.has(child.id) ? "checked" : ""}/> ${child.name} <span class="tag info">${child.type}</span></label>`
          );
        });
    });
    box.innerHTML = html.join("") || '<div class="empty">暂无菜单</div>';
  }

  function openModal(title, bodyHtml, onOk) {
    state.modal.onOk = onOk;
    window.__itcModalOk = onOk;
    $("#sysModalTitle").textContent = title;
    $("#sysModalBody").innerHTML = bodyHtml;
    $("#sysModal").hidden = false;
  }

  function closeModal() {
    $("#sysModal").hidden = true;
    state.modal = { type: "", mode: "", id: null, onOk: null };
    window.__itcModalOk = null;
  }

  function roleOptions(selected) {
    return state.sysRoles
      .map((r) => `<option value="${r.code}" ${r.code === selected ? "selected" : ""}>${r.name}</option>`)
      .join("");
  }

  function bindSysManage() {
    $("#btnAddUser") &&
      $("#btnAddUser").addEventListener("click", () => {
        openModal(
          "新增用户",
          `<div class="form-grid">
            <div class="field"><label>账号</label><input id="fUserName" /></div>
            <div class="field"><label>姓名</label><input id="fName" /></div>
            <div class="field"><label>角色</label><select id="fRole">${roleOptions("operator")}</select></div>
            <div class="field"><label>手机号</label><input id="fMobile" /></div>
            <div class="field"><label>状态</label><select id="fStatus"><option>启用</option><option>停用</option></select></div>
          </div>`,
          () => {
            const username = $("#fUserName").value.trim();
            if (!username) return toast("校验失败", "请填写账号", "warn");
            if (state.sysUsers.some((u) => u.username === username)) return toast("校验失败", "账号已存在", "warn");
            state.sysUsers.push({
              id: "U" + Date.now(),
              username,
              name: $("#fName").value.trim() || username,
              roleCode: $("#fRole").value,
              mobile: $("#fMobile").value.trim(),
              status: $("#fStatus").value,
              lastLogin: "-",
            });
            renderUserManage();
            renderRoleManage();
            pushLog("ok", `新增用户 ${username}`);
            pushOpLog("用户管理", "新增用户 " + username, "成功");
            toast("成功", "用户已新增", "");
            closeModal();
          }
        );
      });

    $("#userManageTable") &&
      $("#userManageTable").addEventListener("click", (e) => {
        const editBtn = e.target.closest("[data-user-edit]");
        const delBtn = e.target.closest("[data-user-del]");
        if (editBtn) {
          const u = state.sysUsers.find((x) => x.id === editBtn.dataset.userEdit);
          if (!u) return;
          openModal(
            "编辑用户",
            `<div class="form-grid">
              <div class="field"><label>账号</label><input id="fUserName" value="${u.username}" disabled /></div>
              <div class="field"><label>姓名</label><input id="fName" value="${u.name || ""}" /></div>
              <div class="field"><label>角色</label><select id="fRole">${roleOptions(u.roleCode)}</select></div>
              <div class="field"><label>手机号</label><input id="fMobile" value="${u.mobile || ""}" /></div>
              <div class="field"><label>状态</label><select id="fStatus"><option ${u.status === "启用" ? "selected" : ""}>启用</option><option ${u.status === "停用" ? "selected" : ""}>停用</option></select></div>
            </div>`,
            () => {
              u.name = $("#fName").value.trim() || u.username;
              u.roleCode = $("#fRole").value;
              u.mobile = $("#fMobile").value.trim();
              u.status = $("#fStatus").value;
              renderUserManage();
              renderRoleManage();
              pushLog("ok", `更新用户 ${u.username}`);
              toast("成功", "用户已更新", "");
              closeModal();
            }
          );
        }
        if (delBtn) {
          const id = delBtn.dataset.userDel;
          const u = state.sysUsers.find((x) => x.id === id);
          if (!u) return;
          if (u.username === "admin") return toast("不允许", "不能删除管理员账号", "warn");
          state.sysUsers = state.sysUsers.filter((x) => x.id !== id);
          renderUserManage();
          renderRoleManage();
          pushLog("warn", `删除用户 ${u.username}`);
          toast("已删除", u.username, "warn");
        }
      });

    $("#btnAddRole") &&
      $("#btnAddRole").addEventListener("click", () => {
        openModal(
          "新增角色",
          `<div class="form-grid">
            <div class="field"><label>角色编码</label><input id="fRoleCode" placeholder="如 engineer" /></div>
            <div class="field"><label>角色名称</label><input id="fRoleName" /></div>
            <div class="field full"><label>备注</label><input id="fRoleRemark" /></div>
            <div class="field"><label>状态</label><select id="fRoleStatus"><option>启用</option><option>停用</option></select></div>
          </div>`,
          () => {
            const code = $("#fRoleCode").value.trim();
            const name = $("#fRoleName").value.trim();
            if (!code || !name) return toast("校验失败", "请填写编码和名称", "warn");
            if (state.sysRoles.some((r) => r.code === code)) return toast("校验失败", "角色编码已存在", "warn");
            state.sysRoles.push({
              code,
              name,
              remark: $("#fRoleRemark").value.trim(),
              status: $("#fRoleStatus").value,
            });
            state.rolePerms[code] = [];
            renderRoleManage();
            renderPermSelect();
            pushLog("ok", `新增角色 ${code}`);
            toast("成功", "角色已新增", "");
            closeModal();
          }
        );
      });

    $("#roleManageTable") &&
      $("#roleManageTable").addEventListener("click", (e) => {
        const editBtn = e.target.closest("[data-role-edit]");
        const delBtn = e.target.closest("[data-role-del]");
        if (editBtn) {
          const r = state.sysRoles.find((x) => x.code === editBtn.dataset.roleEdit);
          if (!r) return;
          openModal(
            "编辑角色",
            `<div class="form-grid">
              <div class="field"><label>角色编码</label><input id="fRoleCode" value="${r.code}" disabled /></div>
              <div class="field"><label>角色名称</label><input id="fRoleName" value="${r.name}" /></div>
              <div class="field full"><label>备注</label><input id="fRoleRemark" value="${r.remark || ""}" /></div>
              <div class="field"><label>状态</label><select id="fRoleStatus"><option ${r.status === "启用" ? "selected" : ""}>启用</option><option ${r.status === "停用" ? "selected" : ""}>停用</option></select></div>
            </div>`,
            () => {
              r.name = $("#fRoleName").value.trim() || r.code;
              r.remark = $("#fRoleRemark").value.trim();
              r.status = $("#fRoleStatus").value;
              renderRoleManage();
              renderUserManage();
              renderPermSelect();
              pushLog("ok", `更新角色 ${r.code}`);
              toast("成功", "角色已更新", "");
              closeModal();
            }
          );
        }
        if (delBtn) {
          const code = delBtn.dataset.roleDel;
          if (code === "admin") return toast("不允许", "不能删除管理员角色", "warn");
          if (countRoleUsers(code) > 0) return toast("不允许", "该角色仍有用户，请先调整用户角色", "warn");
          state.sysRoles = state.sysRoles.filter((x) => x.code !== code);
          delete state.rolePerms[code];
          renderRoleManage();
          renderPermSelect();
          pushLog("warn", `删除角色 ${code}`);
          toast("已删除", code, "warn");
        }
      });

    $("#btnAddMenu") &&
      $("#btnAddMenu").addEventListener("click", () => {
        const parentOpts =
          `<option value="">无（顶级）</option>` +
          state.sysMenus
            .filter((m) => m.type !== "按钮")
            .map((m) => `<option value="${m.id}">${m.name}</option>`)
            .join("");
        openModal(
          "新增菜单",
          `<div class="form-grid">
            <div class="field"><label>菜单名称</label><input id="fMenuName" /></div>
            <div class="field"><label>类型</label><select id="fMenuType"><option>目录</option><option selected>菜单</option><option>按钮</option></select></div>
            <div class="field"><label>路由/标识</label><input id="fMenuPath" placeholder="如 reports" /></div>
            <div class="field"><label>排序</label><input id="fMenuSort" type="number" value="99" /></div>
            <div class="field"><label>上级</label><select id="fMenuParent">${parentOpts}</select></div>
            <div class="field"><label>可见</label><select id="fMenuVisible"><option value="1">是</option><option value="0">否</option></select></div>
          </div>`,
          () => {
            const name = $("#fMenuName").value.trim();
            const path = $("#fMenuPath").value.trim();
            if (!name || !path) return toast("校验失败", "请填写名称和路由/标识", "warn");
            const id = "M" + Date.now();
            state.sysMenus.push({
              id,
              name,
              type: $("#fMenuType").value,
              path,
              sort: Number($("#fMenuSort").value) || 99,
              visible: $("#fMenuVisible").value === "1",
              parentId: $("#fMenuParent").value,
            });
            renderMenuManage();
            renderPermTree();
            pushLog("ok", `新增菜单 ${name}`);
            toast("成功", "菜单已新增", "");
            closeModal();
          }
        );
      });

    $("#menuManageTable") &&
      $("#menuManageTable").addEventListener("click", (e) => {
        const editBtn = e.target.closest("[data-menu-edit]");
        const delBtn = e.target.closest("[data-menu-del]");
        if (editBtn) {
          const m = state.sysMenus.find((x) => x.id === editBtn.dataset.menuEdit);
          if (!m) return;
          const parentOpts =
            `<option value="">无（顶级）</option>` +
            state.sysMenus
              .filter((x) => x.type !== "按钮" && x.id !== m.id)
              .map((x) => `<option value="${x.id}" ${x.id === m.parentId ? "selected" : ""}>${x.name}</option>`)
              .join("");
          openModal(
            "编辑菜单",
            `<div class="form-grid">
              <div class="field"><label>菜单名称</label><input id="fMenuName" value="${m.name}" /></div>
              <div class="field"><label>类型</label><select id="fMenuType"><option ${m.type === "目录" ? "selected" : ""}>目录</option><option ${m.type === "菜单" ? "selected" : ""}>菜单</option><option ${m.type === "按钮" ? "selected" : ""}>按钮</option></select></div>
              <div class="field"><label>路由/标识</label><input id="fMenuPath" value="${m.path}" /></div>
              <div class="field"><label>排序</label><input id="fMenuSort" type="number" value="${m.sort}" /></div>
              <div class="field"><label>上级</label><select id="fMenuParent">${parentOpts}</select></div>
              <div class="field"><label>可见</label><select id="fMenuVisible"><option value="1" ${m.visible ? "selected" : ""}>是</option><option value="0" ${!m.visible ? "selected" : ""}>否</option></select></div>
            </div>`,
            () => {
              m.name = $("#fMenuName").value.trim() || m.name;
              m.type = $("#fMenuType").value;
              m.path = $("#fMenuPath").value.trim() || m.path;
              m.sort = Number($("#fMenuSort").value) || 0;
              m.parentId = $("#fMenuParent").value;
              m.visible = $("#fMenuVisible").value === "1";
              renderMenuManage();
              renderPermTree();
              pushLog("ok", `更新菜单 ${m.name}`);
              toast("成功", "菜单已更新", "");
              closeModal();
            }
          );
        }
        if (delBtn) {
          const id = delBtn.dataset.menuDel;
          if (state.sysMenus.some((x) => x.parentId === id)) {
            return toast("不允许", "请先删除子菜单", "warn");
          }
          state.sysMenus = state.sysMenus.filter((x) => x.id !== id);
          Object.keys(state.rolePerms).forEach((code) => {
            state.rolePerms[code] = (state.rolePerms[code] || []).filter((mid) => mid !== id);
          });
          renderMenuManage();
          renderPermTree();
          pushLog("warn", `删除菜单 ${id}`);
          toast("已删除", id, "warn");
        }
      });

    $("#permRoleSelect") && $("#permRoleSelect").addEventListener("change", renderPermTree);
    $("#btnSavePerms") &&
      $("#btnSavePerms").addEventListener("click", () => {
        const code = $("#permRoleSelect").value;
        const ids = $$("#permMenuTree input[type=checkbox]:checked").map((el) => el.value);
        state.rolePerms[code] = ids;
        pushLog("ok", `已保存角色权限 ${code}（${ids.length}项）`);
        toast("权限已保存", roleName(code), "");
      });

    $("#sysModalClose") && $("#sysModalClose").addEventListener("click", closeModal);
    $("#sysModalCancel") && $("#sysModalCancel").addEventListener("click", closeModal);
    $("#sysModalOk") &&
      $("#sysModalOk").addEventListener("click", () => {
        const fn = window.__itcModalOk || state.modal.onOk;
        window.__itcModalOk = null;
        state.modal.onOk = null;
        if (typeof fn === "function") fn();
      });
    $("#sysModal") &&
      $("#sysModal").addEventListener("click", (e) => {
        if (e.target.id === "sysModal") closeModal();
      });
  }

  function tickClock() {
    $("#clock").textContent = nowStr();
  }

  function initSeries() {
    for (let i = 0; i < state.maxPoints; i++) {
      state.series.force.push(state.params.force + (Math.random() - 0.5) * 2);
      state.series.temp.push(state.params.temp + (Math.random() - 0.5) * 0.3);
      state.series.vib.push(0.3 + Math.random() * 0.3);
    }
  }

  function bindAuthUi() {
    const user = window.ITCAuth && ITCAuth.getUser();
    const pill = $("#userPill");
    if (user && pill) {
      pill.textContent = `${user.name || user.username} · ${user.role || ""}`;
    }
    const logoutBtn = $("#btnLogout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (window.ITCAuth) ITCAuth.logout();
        location.replace("login.html");
      });
    }
  }

  function redrawChartsSoon() {
    setTimeout(() => {
      drawChart("chartForce", state.series.force, "rgb(26,166,160)");
      drawChart("chartTemp", state.series.temp, "rgb(76,157,255)");
      drawChart("chartVib", state.series.vib, "rgb(230,162,60)");
      drawChart("chartDash", state.series.force, "rgb(26,166,160)");
    }, 240);
  }

  function setSidebarCollapsed(collapsed) {
    const app = $(".app");
    if (!app) return;
    if (collapsed) app.classList.add("sidebar-collapsed");
    else app.classList.remove("sidebar-collapsed");
    try {
      localStorage.setItem("itc_sidebar_collapsed", collapsed ? "1" : "0");
    } catch (e) {}
    $$(".toggle-text").forEach((label) => {
      label.textContent = collapsed ? "展开菜单" : "折叠菜单";
    });
    const sideBtn = $("#btnSidebarToggle");
    if (sideBtn) sideBtn.title = collapsed ? "展开侧边栏" : "折叠侧边栏";
    const headBtn = $("#btnHeaderMenu");
    if (headBtn) headBtn.title = collapsed ? "展开侧边栏" : "折叠侧边栏";
    redrawChartsSoon();
  }

  function toggleSidebar() {
    const app = $(".app");
    if (!app) return;
    setSidebarCollapsed(!app.classList.contains("sidebar-collapsed"));
  }

  function bindSidebarToggle() {
    let collapsed = false;
    try {
      collapsed = localStorage.getItem("itc_sidebar_collapsed") === "1";
    } catch (e) {}
    setSidebarCollapsed(collapsed);

    const headBtn = $("#btnHeaderMenu");
    if (headBtn) headBtn.addEventListener("click", toggleSidebar);

    // 分组标题可折叠
    $$("[data-group-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-group-toggle");
        const section = $('.nav-section[data-group="' + key + '"]');
        if (!section) return;
        section.classList.toggle("folded");
      });
    });
  }

  function init() {
    // 未登录或鉴权脚本异常：一律进登录页，禁止直接进首页
    if (!window.ITCAuth) {
      location.replace("login.html?redirect=" + encodeURIComponent("index.html"));
      return;
    }
    if (!ITCAuth.requireAuth()) return;
    bindAuthUi();
    bindSidebarToggle();
    bindNav();
    bindControls();
    bindSysManage();
    initSeries();
    renderDevices();
    renderReports();
    renderHistory();
    renderAlerts();
    renderFaultTable();
    renderBackups();
    renderDrills();
    renderOptLogs();
    renderRoles();
    renderUserManage();
    renderRoleManage();
    renderMenuManage();
    renderPermSelect();
    renderKpis();
    renderLogs();
    switchView("dashboard");
    const user = window.ITCAuth && ITCAuth.getUser();
    pushLog("ok", `用户 ${user ? user.username : "-"} 登录成功`);
    pushLog("ok", "系统初始化完成，通信链路自检通过");
    pushLog("ok", "冗余备份服务已就绪");
    pushOpLog("系统", "进入管理端", "成功");
    tickClock();
    setInterval(tickClock, 1000);
    setInterval(tickSeries, 900);
    setInterval(() => {
      const el = $("#kpiHealth");
      if (el) el.textContent = (96 + Math.random() * 3).toFixed(0) + "%";
      if (state.running && state.autoOptimize && Math.random() < 0.25) {
        const forceInput = $("#paramForce");
        const targetForce = forceInput ? Number(forceInput.value) || 120 : 120;
        const before = state.params.force.toFixed(1);
        const after = (state.params.force * 0.98 + targetForce * 0.02).toFixed(1);
        state.optLogs.unshift({
          time: nowStr().slice(11),
          strategy: "ML-力闭环",
          item: "目标力值",
          before,
          after,
          reason: "实时收敛",
        });
        if (state.optLogs.length > 30) state.optLogs.length = 30;
        renderOptLogs();
      }
    }, 5000);
    window.addEventListener("resize", () => {
      drawChart("chartForce", state.series.force, "rgb(26,166,160)");
      drawChart("chartTemp", state.series.temp, "rgb(76,157,255)");
      drawChart("chartVib", state.series.vib, "rgb(230,162,60)");
      drawChart("chartDash", state.series.force, "rgb(26,166,160)");
    });
  }

  window.ITCApp = {
    toast,
    nowStr,
    pushLog,
    pushOpLog,
    getUser: () => (window.ITCAuth ? ITCAuth.getUser() : null),
  };

  document.addEventListener("DOMContentLoaded", init);
})();

