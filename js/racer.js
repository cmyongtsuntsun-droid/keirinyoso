/* 競輪 選手個別分析ページ ロジック
 * window.KEIRIN_RACERS (ビルド時埋め込み) を元に URL ハッシュ (#登録番号) の
 * 選手を描画する。サーバー通信なしの静的構成。
 */
(function () {
  "use strict";

  var DATA = window.KEIRIN_RACERS;
  var main = document.getElementById("racer-main");
  if (!DATA) {
    main.innerHTML = '<p class="loading">data/racers.js が見つかりません。run_all.py を実行してください。</p>';
    return;
  }

  var racers = DATA.racers;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---- 検索ボックス ---- */
  function setupSearch() {
    var list = document.getElementById("racer-list");
    var ids = Object.keys(racers);
    list.innerHTML = ids.map(function (id) {
      var r = racers[id];
      return '<option value="' + esc(r.racer_name + " (" + id + ")") + '">';
    }).join("");
    var input = document.getElementById("racer-search-input");
    input.addEventListener("change", function () {
      var m = input.value.match(/\((\d+)\)/);
      var id = m ? m[1] : null;
      if (!id) {
        var q = input.value.trim();
        if (racers[q]) { id = q; }
        else {
          ids.some(function (k) {
            if (racers[k].racer_name === q) { id = k; return true; }
            return false;
          });
        }
      }
      if (id && racers[id]) { location.hash = id; }
    });
  }

  /* ---- 描画ヘルパー ---- */
  function kpiCard(value, label) {
    return '<div class="stat-card"><div class="value">' + value +
      '</div><div class="label">' + esc(label) + "</div></div>";
  }

  function rateBarRow(label, sub, rate, max) {
    var w = max > 0 ? Math.min(rate / max * 100, 100) : 0;
    return '<div class="imp-row"><div class="imp-label"><span>' + label +
      (sub ? ' <small class="dim">' + esc(sub) + "</small>" : "") +
      "</span><span>" + rate.toFixed(1) + '%</span></div>' +
      '<div class="imp-bar"><i style="width:' + w + '%"></i></div></div>';
  }

  /* 直近20走の着順スパークライン (低い棒=好成績, 最大9着) */
  function rankSparkline(ranks) {
    return '<div class="spark">' + ranks.map(function (r) {
      var h = (10 - r) / 9 * 100;
      var cls = r === 1 ? " s-win" : r <= 3 ? " s-top3" : "";
      return '<span class="spark-col" title="' + r + '着">' +
        '<i class="spark-bar' + cls + '" style="height:' + h + '%"></i>' +
        '<em>' + r + "</em></span>";
    }).join("") + "</div>";
  }

  /* ライン内役割(先頭/番手/三番手/単騎)別の2連対率 (PDF F14-F17) */
  function roleSection(r) {
    var maxRate = Math.max.apply(null, r.role_stats.map(function (c) { return c.top2_rate; }));
    var bars = r.role_stats.map(function (c) {
      return rateBarRow(
        esc(c.role),
        c.starts + "走 / 1着率" + c.win_rate + "%", c.top2_rate, Math.max(maxRate, 1));
    }).join("");
    return '<section class="panel"><h3>ライン役割別 2連対率</h3>' + bars + "</section>";
  }

  /* 決まり手内訳 (逃げ/捲り/差し/マーク) */
  function kimariteSection(r) {
    var entries = Object.keys(r.kimarite).map(function (k) {
      return { name: k, count: r.kimarite[k] };
    });
    var max = Math.max.apply(null, entries.map(function (e) { return e.count; }).concat([1]));
    var bars = entries.map(function (e) {
      return '<div class="imp-row"><div class="imp-label"><span>' + esc(e.name) +
        "</span><span>" + e.count + '回</span></div>' +
        '<div class="imp-bar"><i style="width:' + (e.count / max * 100) + '%"></i></div></div>';
    }).join("");
    return '<section class="panel"><h3>決まり手 (直近4ヶ月)</h3>' + bars + "</section>";
  }

  function bankSection(r) {
    if (!r.bank_stats.length) { return ""; }
    var rows = r.bank_stats.map(function (b) {
      return "<tr><td>" + b.bank + "m</td><td>" + b.starts +
        "</td><td>" + b.win_rate.toFixed(1) + "%</td><td>" +
        b.top2_rate.toFixed(1) + "%</td></tr>";
    }).join("");
    return '<section class="panel"><h3>バンク周長別成績</h3>' +
      '<table class="entries"><thead><tr><th>周長</th><th>出走</th>' +
      "<th>1着率</th><th>2連対率</th></tr></thead><tbody>" + rows +
      "</tbody></table></section>";
  }

  function venueSection(r) {
    if (!r.venue_stats.length) { return ""; }
    var rows = r.venue_stats.map(function (v) {
      return "<tr><td>" + esc(v.venue_name) + "</td><td>" + v.starts +
        "</td><td>" + v.win_rate.toFixed(1) + "%</td><td>" +
        v.top2_rate.toFixed(1) + "%</td></tr>";
    }).join("");
    return '<section class="panel"><h3>会場別成績 (出走数上位)</h3>' +
      '<table class="entries"><thead><tr><th>会場</th><th>出走</th>' +
      "<th>1着率</th><th>2連対率</th></tr></thead><tbody>" + rows +
      "</tbody></table></section>";
  }

  function recentSection(r) {
    var rows = r.recent_results.map(function (x) {
      var rankCls = x.rank === 1 ? ' class="rank-win"' : x.rank <= 3 ? ' class="rank-top3"' : "";
      return "<tr><td>" + esc(x.date) + "</td><td>" + esc(x.venue_name) +
        " " + x.race_no + "R</td><td>" + esc(x.grade) +
        '</td><td><span class="lane-badge lane-' + x.car_no + '">' + x.car_no +
        "</span></td><td>" + esc(x.line_role) + "</td><td" + rankCls + ">" +
        x.rank + "着</td></tr>";
    }).join("");
    return '<section class="panel"><h3>直近10走</h3>' +
      '<div class="spark-wrap"><p class="spark-caption">直近20走の着順推移 (右が最新)</p>' +
      rankSparkline(r.recent_ranks) + "</div>" +
      '<table class="entries"><thead><tr><th>日付</th><th>レース</th><th>グレード</th>' +
      "<th>車番</th><th>位置</th><th>着順</th></tr></thead><tbody>" + rows +
      "</tbody></table></section>";
  }

  function todaySection(r) {
    if (!r.today_races.length) { return ""; }
    var chips = r.today_races.map(function (t) {
      return '<a class="bet-chip main" href="index.html">' +
        esc(t.venue_name) + " " + t.race_no + "R " +
        '<span class="lane-badge lane-' + t.car_no + '">' + t.car_no + "</span> " +
        esc(t.mark) + "<small>AI勝率 " + t.win_prob + "%</small></a>";
    }).join("");
    return '<section class="panel today-panel"><h3>本日の出走予定</h3>' +
      '<div class="bets">' + chips + "</div></section>";
  }

  function renderRacer(id) {
    var r = racers[id];
    if (!r) {
      main.innerHTML = '<p class="loading">選手が見つかりません。検索ボックスから選手を選択してください。</p>';
      return;
    }
    document.title = r.racer_name + " の分析 — KEIRIN AI 予想";
    main.innerHTML =
      '<section class="racer-profile">' +
      '<div class="racer-head"><h2>' + esc(r.racer_name) +
      ' <span class="klass-' + esc(r.klass) + '">' + esc(r.klass) + "</span>" +
      ' <span class="style-chip">脚質: ' + esc(r.style) + "</span></h2>" +
      '<p class="dim">登録番号 ' + r.racer_id + " ／ 競走得点 " +
      r.kyoso_tokuten.toFixed(2) + " ／ 直近勝率 " + r.recent_win_rate.toFixed(1) +
      "% ／ バック回数(B) " + r.back_count + "</p></div></section>" +
      '<section class="stats-band">' +
      kpiCard(r.starts, "集計出走数") +
      kpiCard(r.win_rate.toFixed(1) + "%", "1着率") +
      kpiCard(r.top2_rate.toFixed(1) + "%", "2連対率") +
      kpiCard(r.top3_rate.toFixed(1) + "%", "3連対率") +
      kpiCard(r.avg_rank.toFixed(2), "平均着順") +
      kpiCard(r.kyoso_tokuten.toFixed(1), "競走得点") +
      "</section>" +
      todaySection(r) +
      '<div class="layout"><div>' + recentSection(r) + "</div>" +
      "<aside>" + roleSection(r) + kimariteSection(r) + bankSection(r) +
      venueSection(r) + "</aside></div>";
  }

  function route() {
    var id = location.hash.replace("#", "");
    if (!id || !racers[id]) {
      // 未指定時は本日出走予定のある選手から先頭を表示
      var ids = Object.keys(racers);
      id = ids.filter(function (k) { return racers[k].today_races.length; })[0] || ids[0];
    }
    renderRacer(id);
  }

  setupSearch();
  window.addEventListener("hashchange", route);
  route();
  document.getElementById("footer-meta").textContent =
    "集計対象: 過去" + DATA.history_races + "レース / 登録選手 " +
    Object.keys(racers).length + "名";
})();
