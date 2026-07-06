/* 全ページ共通スクリプト (静的な選手個別ページも含めて読み込まれる)
 * 「上部へ戻る」フローティングボタンをスマホでの長いページ閲覧向けに提供する。
 */
(function () {
  "use strict";

  function init() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "to-top-btn";
    btn.setAttribute("aria-label", "ページ上部へ戻る");
    btn.textContent = "↑";
    document.body.appendChild(btn);

    window.addEventListener("scroll", function () {
      btn.classList.toggle("show", window.scrollY > 480);
    }, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
