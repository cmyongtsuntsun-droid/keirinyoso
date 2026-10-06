(() => {
  "use strict";
  const locales = ["ja", "en", "zh-cn", "zh-tw", "ko"];
  const labels = { ja: "日本語", en: "English", "zh-cn": "简体中文", "zh-tw": "繁體中文", ko: "한국어" };
  const related = [
    ["https://keirindb.adult-bank.jp/", { ja: "競輪データベース", en: "Keirin database", "zh-cn": "竞轮数据库", "zh-tw": "競輪資料庫", ko: "경륜 데이터베이스" }],
    ["https://keibadb.adult-bank.jp/", { ja: "競馬データベース", en: "Horse racing database", "zh-cn": "赛马数据库", "zh-tw": "賽馬資料庫", ko: "경마 데이터베이스" }],
    ["https://kyoteidb.adult-bank.jp/", { ja: "競艇データベース", en: "Boat racing database", "zh-cn": "赛艇数据库", "zh-tw": "賽艇資料庫", ko: "보트 레이스 데이터베이스" }]
  ];
  const first = location.pathname.split("/").filter(Boolean)[0] || "ja";
  const current = locales.includes(first.toLowerCase()) ? first.toLowerCase() : "ja";
  const langNames = { ja: "言語", en: "Language", "zh-cn": "语言", "zh-tw": "語言", ko: "언어" };

  function addControls() {
    if (!document.body) return;
    if (!document.querySelector(".site-language-control")) {
      const wrap = document.createElement("label");
      wrap.className = "site-language-control";
      wrap.setAttribute("aria-label", langNames[current]);
      const select = document.createElement("select");
      select.setAttribute("aria-label", langNames[current]);
      locales.forEach(code => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = labels[code];
        option.selected = code === current;
        select.appendChild(option);
      });
      select.addEventListener("change", () => {
        const route = location.pathname.replace(/^\/(?:en|zh-cn|zh-tw|ko)(?=\/|$)/i, "") || "/";
        const target = select.value === "ja" ? route : "/" + select.value + (route.startsWith("/") ? route : "/" + route);
        location.href = target + location.search + location.hash;
      });
      wrap.appendChild(select);
      document.body.appendChild(wrap);
    }
    if (!document.querySelector(".site-related-links")) {
      const nav = document.createElement("nav");
      nav.className = "site-related-links";
      const relatedLabel = { ja: "姉妹サイト", en: "Related sites", "zh-cn": "相关网站", "zh-tw": "相關網站", ko: "관련 사이트" }[current];
      nav.setAttribute("aria-label", relatedLabel);
      const heading = document.createElement("strong");
      heading.textContent = current === "ja" ? "テーマの近い姉妹サイト" : relatedLabel;
      nav.appendChild(heading);
      const list = document.createElement("ul");
      related.forEach(([url, names]) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = url;
        link.textContent = names[current];
        link.rel = "noopener";
        item.appendChild(link);
        list.appendChild(item);
      });
      nav.appendChild(list);
      document.body.appendChild(nav);
    }
  }

  const style = document.createElement("style");
  style.textContent = ".site-language-control{position:fixed;z-index:2147483000;top:8px;right:10px;padding:5px 8px;background:#fff;color:#17211b;border:1px solid #cbd5d0;border-radius:7px;box-shadow:0 2px 8px #0002;font:13px/1.4 system-ui,sans-serif}.site-language-control select{border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.site-language-control select:focus-visible{outline:2px solid #0f766e;outline-offset:2px}.site-related-links{max-width:1100px;margin:1.5rem auto;padding:12px 16px;border-top:1px solid rgba(128,128,128,.35);font-size:.9em}.site-related-links ul{display:flex;flex-wrap:wrap;gap:.4rem 1.2rem;margin:.5rem 0 0;padding-left:1.2rem}@media(max-width:600px){.site-language-control{top:6px;right:6px}}";
  document.head.appendChild(style);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addControls, { once: true });
  else addControls();
})();
