(function () {
  var $ = function (s) { return document.querySelector(s); };
  var body = document.body;

  /* ---- persisted preferences ---- */
  try {
    var mode = null;
    if (/[?&]eink/.test(location.search)) mode = "eink";
    else if (/[?&]paper/.test(location.search)) mode = "paper";
    else mode = localStorage.getItem("jub-mode") ||
                (localStorage.getItem("jub-eink") === "on" ? "eink" : null);
    if (mode === "eink" || mode === "paper") {
      document.documentElement.setAttribute("data-mode", mode);
      localStorage.setItem("jub-mode", mode);
    }
  } catch (e) {}
  try {
    if (localStorage.getItem("jub-theme") === "dark")
      document.documentElement.setAttribute("data-theme", "dark");
    if (localStorage.getItem("jub-notes") === "off") {
      body.classList.add("no-notes");
      var nb = $("#noteBtn"); if (nb) nb.classList.remove("on");
    }
  } catch (e) {}

  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---- contents ---- */
  var toc = $("#toc");
  $("#tocBtn").addEventListener("click", function () { toc.classList.toggle("open"); });
  document.addEventListener("click", function (e) {
    if (toc.classList.contains("open") && !toc.contains(e.target) && e.target.id !== "tocBtn")
      toc.classList.remove("open");
  });

  /* ---- dark mode ---- */
  $("#darkBtn").addEventListener("click", function () {
    var d = document.documentElement.getAttribute("data-theme") === "dark";
    document.documentElement.setAttribute("data-theme", d ? "light" : "dark");
    save("jub-theme", d ? "light" : "dark");
  });

  /* ---- notes ---- */
  $("#noteBtn").addEventListener("click", function () {
    body.classList.toggle("no-notes");
    this.classList.toggle("on");
    save("jub-notes", body.classList.contains("no-notes") ? "off" : "on");
  });

  /* ---- focus mode ---- */
  $("#focusBtn").addEventListener("click", function () {
    body.classList.toggle("focus");
    this.classList.toggle("on");
  });

  /* ---- display modes: eink (Boox) / paper (Daylight) ---- */
  var eb = $("#einkBtn"), pb = $("#paperBtn");
  function syncModes() {
    var m = document.documentElement.getAttribute("data-mode");
    if (eb) eb.classList.toggle("on", m === "eink");
    if (pb) pb.classList.toggle("on", m === "paper");
  }
  function setMode(m) {
    var cur = document.documentElement.getAttribute("data-mode");
    var next = (cur === m) ? null : m;
    if (next) document.documentElement.setAttribute("data-mode", next);
    else document.documentElement.removeAttribute("data-mode");
    save("jub-mode", next || "off");
    save("jub-eink", next === "eink" ? "on" : "off");
    syncModes();
  }
  syncModes();
  if (eb) eb.addEventListener("click", function () { setMode("eink"); });
  if (pb) pb.addEventListener("click", function () { setMode("paper"); });

  /* ---- chronology rail ---- */
  var fill = $("#railFill");
  function rail() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    fill.style.height = (h > 0 ? (window.scrollY / h) * 100 : 0) + "vh";
  }
  window.addEventListener("scroll", function () {
    if (document.documentElement.getAttribute("data-mode") !== "eink") rail();
  }, { passive: true });
  window.addEventListener("resize", rail);
  rail();

  /* ---- current verse (focus mode) ---- */
  var verses = [].slice.call(document.querySelectorAll("p.v"));
  if ("IntersectionObserver" in window && verses.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { en.target.classList.toggle("here", en.isIntersecting); });
    }, { rootMargin: "-40% 0px -40% 0px" });
    verses.forEach(function (v) { io.observe(v); });
  }

  /* ---- copy link to verse ---- */
  var toast = document.createElement("div");
  toast.id = "toast";
  document.body.appendChild(toast);
  function flash(msg) {
    toast.textContent = msg; toast.classList.add("show");
    clearTimeout(flash.t); flash.t = setTimeout(function () { toast.classList.remove("show"); }, 1500);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.vn");
    if (!a) return;
    e.preventDefault();
    var url = location.origin + location.pathname + "#" + a.dataset.anchor;
    history.replaceState(null, "", "#" + a.dataset.anchor);
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(
      function () { flash("Link copied"); }, function () { flash("Anchor set"); });
    else flash("Anchor set");
  });

  /* ---- keyboard ---- */
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = (e.target.tagName || "").toLowerCase();
    if (t === "input" || t === "textarea") return;
    var links = document.querySelectorAll(".pager a");
    if (e.key === "ArrowLeft" && links[0]) links[0].click();
    if (e.key === "ArrowRight" && links[links.length - 1]) links[links.length - 1].click();
    if (e.key === "c") $("#tocBtn").click();
  });
})();
