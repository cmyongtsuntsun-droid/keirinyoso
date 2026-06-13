/* 競輪AI予想サイト フロントエンドロジック
 * ビルド時に埋め込まれた window.KEIRIN_DATA (静的データ) を描画する。
 * サーバー通信は一切行わないゼロサーバーコスト構成。
 */
(function () {
  "use strict";

  var DATA = window.KEIRIN_DATA;
  if (!DATA) {
    document.getElementById("race-area").innerHTML =
      '<p class="loading">data/data.js が見つかりません。run_all.py を実行してサイトをビルドしてください。</p>';
    return;
  }

  var FEATURE_LABELS = {
    car_no: "車番", class_code: "級班", kyoso_tokuten: "競走得点",
    recent_win_rate: "直近勝率", recent_2rate: "直近2連対率", recent_3rate: "直近3連対率",
    style_code: "脚質", nige_count: "逃げ回数", makuri_count: "捲り回数",
    sashi_count: "差し回数", mark_count: "マーク回数", back_count: "バック回数(B)",
    is_line_head: "ライン先頭", is_second: "番手", is_third: "三番手", is_solo: "単騎",
    line_size: "ライン人数", line_head_b: "ライン先頭のB回数",
    venue_id: "競輪場", bank_length: "バンク周長", straight_length: "直線距離",
    grade_code: "グレード", weather_code: "天候", wind_speed: "風速", race_no: "レース番号"
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---- 統計バンド ---- */
  function renderStats() {
    var bt = DATA.backtest;
    var nRaces = DATA.predictions.venues.reduce(function (a, v) { return a + v.races.length; }, 0);
    var cards = [
      { v: DATA.predictions.date, l: "予想対象日" },
      { v: nRaces + "R", l: "本日の予想レース数" },
      { v: bt.win_hit_rate + "%", l: "1着的中率 (検証)" },
      { v: bt.sanrentan_hit_rate + "%", l: "3連単的中率 (検証)" },
      { v: bt.recovery_rate + "%", l: "3連単回収率 (検証)" }
    ];
    document.getElementById("stats-band").innerHTML = cards.map(function (c) {
      return '<div class="stat-card"><div class="value">' + esc(c.v) +
        '</div><div class="label">' + esc(c.l) + "</div></div>";
    }).join("");
  }

  /* ---- 会場タブ ---- */
  function renderVenueNav(activeIdx) {
    var nav = document.getElementById("venue-nav");
    nav.innerHTML = DATA.predictions.venues.map(function (v, i) {
      return '<button class="venue-tab' + (i === activeIdx ? " active" : "") +
        '" data-idx="' + i + '">' + esc(v.venue_name) +
        ' <small>' + v.bank_length + "m</small></button>";
    }).join("");
    nav.querySelectorAll(".venue-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        renderVenueNav(+btn.dataset.idx);
        renderRaces(+btn.dataset.idx);
      });
    });
  }

  /* ---- 出走表 ---- */
  function entryRow(e) {
    var markCls = e.pred_rank <= 3 ? " mark-" + e.pred_rank : "";
    var rowCls = e.pred_rank <= 2 ? ' class="pred-' + e.pred_rank + '"' : "";
    return "<tr" + rowCls + ">" +
      '<td><span class="lane-badge lane-' + e.car_no + '">' + e.car_no + "</span></td>" +
      '<td><span class="mark' + markCls + '">' + esc(e.mark) + "</span></td>" +
      '<td class="racer-name"><a class="racer-link" href="racer/' + e.racer_id +
      '.html" title="' + esc(e.racer_name) + 'の選手分析">' + esc(e.racer_name) + "</a>" +
      ' <span class="klass-' + esc(e.klass) + '">' + esc(e.klass) + "</span></td>" +
      "<td>" + e.kyoso_tokuten.toFixed(2) + "</td>" +
      "<td>" + e.recent_win_rate.toFixed(1) + "</td>" +
      "<td>" + e.recent_2rate.toFixed(1) + "</td>" +
      "<td>" + esc(e.style) + "</td>" +
      "<td>" + e.back_count + "</td>" +
      "<td>" + esc(e.line_role) + "</td>" +
      '<td><div class="prob-bar-wrap"><div class="prob-bar"><i style="width:' +
      Math.min(e.win_prob, 100) + '%"></i></div>' +
      '<span class="prob-val">' + e.win_prob.toFixed(1) + "%</span></div></td>" +
      "</tr>";
  }

  function betChips(bets) {
    var html = '<div class="bets"><div class="bet-group"><h4>AI推奨 3連単</h4>';
    bets.sanrentan.forEach(function (b, i) {
      html += '<span class="bet-chip' + (i === 0 ? " main" : "") + '">' +
        esc(b.combo) + "<small>信頼度 " + b.conf + "%</small></span>";
    });
    html += '</div><div class="bet-group"><h4>2連単</h4>';
    bets.nirentan.forEach(function (b) {
      html += '<span class="bet-chip">' + esc(b.combo) + "</span>";
    });
    return html + "</div></div>";
  }

  function raceCard(race, isOpen) {
    var top = race.entries.slice().sort(function (a, b) { return a.pred_rank - b.pred_rank; });
    var pick = top.slice(0, 3).map(function (e) { return e.car_no; }).join("-");
    return '<article class="race-card' + (isOpen ? " open" : "") + '">' +
      '<div class="race-header">' +
      '<span class="race-no">' + race.race_no + "R</span>" +
      '<span class="race-grade">' + esc(race.grade) + "</span>" +
      '<span class="race-pick">AI本線: <b>' + pick + "</b></span>" +
      '<span class="race-line">ライン: ' + esc(race.line_disp) + "</span>" +
      '<span class="race-cond">' + esc(race.weather) + " / 風" + race.wind_speed + "m</span>" +
      "</div>" +
      '<div class="race-body"><table class="entries"><thead><tr>' +
      "<th>車番</th><th>AI印</th><th>選手</th><th>競走<br>得点</th><th>直近<br>勝率</th>" +
      "<th>2連<br>対率</th><th>脚質</th><th>B</th><th>位置</th><th>AI勝率</th>" +
      "</tr></thead><tbody>" +
      race.entries.map(entryRow).join("") +
      "</tbody></table>" + betChips(race.bets) + "</div></article>";
  }

  function renderRaces(venueIdx) {
    var venue = DATA.predictions.venues[venueIdx];
    var area = document.getElementById("race-area");
    area.innerHTML = venue.races.map(function (r, i) { return raceCard(r, i === 0); }).join("");
    area.querySelectorAll(".race-header").forEach(function (h) {
      h.addEventListener("click", function () {
        h.parentElement.classList.toggle("open");
      });
    });
  }

  /* ---- サイドパネル ---- */
  function renderBacktest() {
    var bt = DATA.backtest;
    document.getElementById("backtest-panel").innerHTML =
      "<h3>バックテスト実績</h3>" +
      '<div class="kpi-row"><span>検証レース数</span><b>' + bt.n_races + "R</b></div>" +
      '<div class="kpi-row"><span>1着的中率</span><b>' + bt.win_hit_rate + "%</b></div>" +
      '<div class="kpi-row"><span>2連単的中率</span><b>' + bt.nirentan_hit_rate + "%</b></div>" +
      '<div class="kpi-row"><span>3連単的中率</span><b>' + bt.sanrentan_hit_rate + "%</b></div>" +
      '<div class="kpi-row"><span>3連単回収率</span><b>' + bt.recovery_rate + "%</b></div>" +
      '<div class="kpi-row"><span>投資/回収</span><b>' +
      bt.invested.toLocaleString() + "円 / " + bt.returned.toLocaleString() + "円</b></div>";
  }

  function renderImportance() {
    var max = Math.max.apply(null, DATA.feature_importance.map(function (f) { return f.importance; }));
    document.getElementById("importance-panel").innerHTML =
      "<h3>特徴量重要度 (Gain)</h3>" +
      DATA.feature_importance.map(function (f) {
        var label = FEATURE_LABELS[f.feature] || f.feature;
        return '<div class="imp-row"><div class="imp-label"><span>' + esc(label) +
          "</span><span>" + f.importance + '%</span></div><div class="imp-bar"><i style="width:' +
          (f.importance / max * 100) + '%"></i></div></div>';
      }).join("");
  }

  /* ---- 初期化 ---- */
  renderStats();
  renderVenueNav(0);
  renderRaces(0);
  renderBacktest();
  renderImportance();
  document.getElementById("footer-meta").textContent =
    "データ生成日時: " + DATA.generated_at +
    " / モデル: LightGBM LambdaRank (NDCG@1-3最適化)";
})();
