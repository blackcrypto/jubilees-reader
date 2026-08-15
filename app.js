(function () {
  var $ = function (s) { return document.querySelector(s); };
  var body = document.body;

  /* ---- persisted preferences ---- */
  try {
    var qEink = /[?&]eink/.test(location.search);
    if (qEink) localStorage.setItem("jub-eink", "on");
    if (qEink || localStorage.getItem("jub-eink") === "on")
      document.documentElement.setAttribute("data-mode", "eink");
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

  /* ---- e-ink mode ---- */
  var eb = $("#einkBtn");
  function syncEink() {
    var on = document.documentElement.getAttribute("data-mode") === "eink";
    if (eb) eb.classList.toggle("on", on);
  }
  syncEink();
  if (eb) eb.addEventListener("click", function () {
    var on = document.documentElement.getAttribute("data-mode") === "eink";
    if (on) document.documentElement.removeAttribute("data-mode");
    else document.documentElement.setAttribute("data-mode", "eink");
    save("jub-eink", on ? "off" : "on");
    syncEink();
  });

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
