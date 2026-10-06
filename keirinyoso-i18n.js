(function () {
  "use strict";
  var locale = (location.pathname.split("/")[1] || "ja").toLowerCase();
  var order = { en: 0, "zh-cn": 1, "zh-tw": 2, ko: 3 };
  if (order[locale] === undefined) return;
  var sourceMap = {};
  var weekdays = {};

  function preserveSpace(raw, value) {
    var start = raw.indexOf(raw.trim());
    return raw.slice(0, start) + value + raw.slice(start + raw.trim().length);
  }

  function weekday(value) {
    var index = "日月火水木金土".indexOf(value);
    return index >= 0 && weekdays[locale] ? weekdays[locale][index] : value;
  }

  function dynamic(value) {
    var match = value.match(/^本日\s+(\d{1,2}\/\d{1,2})\(([日月火水木金土])\)$/);
    if (match) {
      var today = { en: "Today", "zh-cn": "今日", "zh-tw": "今日", ko: "오늘" }[locale];
      return today + " " + match[1] + " (" + weekday(match[2]) + ")";
    }
    match = value.match(/^(\d{1,2}\/\d{1,2})\(([日月火水木金土])\)$/);
    if (match) return match[1] + " (" + weekday(match[2]) + ")";
    match = value.match(/^🔥\s*本日のAI注目レース\s*TOP\s*(\d+)$/);
    if (match) {
      var heading = { en: "Today's AI featured races", "zh-cn": "今日AI焦点赛事", "zh-tw": "今日AI焦點賽事", ko: "오늘의 AI 주목 경주" }[locale];
      return "🔥 " + heading + " TOP " + match[1];
    }
    match = value.match(/^信頼度\s+([\d.]+)%$/);
    if (match) return sourceMap["信頼度"][order[locale]] + " " + match[1] + "%";
    match = value.match(/^([\d,]+)\s*件を表示中$/);
    if (match) {
      var shown = { en: " items shown", "zh-cn": "项", "zh-tw": "項", ko: "개 표시" }[locale];
      return match[1] + shown;
    }
    match = value.match(/^([\d.]+)\s*%$/);
    if (match) return value;
    match = value.match(/^(.+?)のAI分析コメント\(予想根拠\)$/);
    if (match) {
      var comment = { en: " AI analysis", "zh-cn": " AI分析", "zh-tw": " AI分析", ko: " AI 분석" }[locale];
      return match[1] + comment;
    }
    match = value.match(/^(.+?)の選手分析へ$/);
    if (match) {
      var profile = { en: " rider profile", "zh-cn": "选手分析", "zh-tw": "選手分析", ko: " 선수 분석" }[locale];
      return match[1] + profile;
    }
    match = value.match(/^AIは(\d+)番 (.+?)\(([^・()]+)・([^()]+)\)を本命◎に評価。AI勝率は([\d.]+)%。(.*)$/);
    if (match) return translatedComment(match[1], match[2], match[3], match[4], match[5], match[6]);
    match = value.match(/^(.+) \/ 風([\d.]+)m$/);
    if (match) {
      var weather = sourceMap[match[1]];
      return (weather ? weather[order[locale]] : match[1]) + " / " + ({ en: "wind ", "zh-cn": "风 ", "zh-tw": "風 ", ko: "풍속 " }[locale]) + match[2] + "m";
    }
    match = value.match(/^登録番号\s+(\d+)\s+／\s+競走得点\s+([\d.]+)\s+／\s+直近勝率\s+([\d.]+)%\s+／\s+バック回数\(B\)\s+(\d+)$/);
    if (match) {
      var labels = {
        en: ["Rider ID ", " | points ", " | recent win rate ", "% | back counts (B) ", ""],
        "zh-cn": ["选手编号 ", " | 竞赛得分 ", " | 近期胜率 ", "% | 最后直道次数(B) ", ""],
        "zh-tw": ["選手編號 ", " | 競賽得分 ", " | 近期勝率 ", "% | 最後直道次數(B) ", ""],
        ko: ["선수 번호 ", " | 경주 득점 ", " | 최근 승률 ", "% | 백스트레치 횟수(B) ", ""]
      }[locale];
      return labels[0] + match[1] + labels[1] + match[2] + labels[2] + match[3] + labels[3] + match[4] + labels[4];
    }
    match = value.match(/^脚質:\s*(.+)$/);
    if (match) return (locale === "en" ? "Style: " : locale === "ko" ? "각질: " : locale === "zh-cn" ? "脚质：" : "腳質：") + (sourceMap[match[1]] ? sourceMap[match[1]][order[locale]] : match[1]);
    return null;
  }

  function translatedComment(carNo, name, klass, style, winProbability, tail) {
    var lang = locale;
    var lead = {
      en: "AI ranks #" + carNo + " " + name + " (" + klass + ", " + (sourceMap[style] ? sourceMap[style][order[lang]] : style) + ") as the top pick. Win probability: ",
      "zh-cn": "AI将" + carNo + "号 " + name + "（" + klass + "、" + (sourceMap[style] ? sourceMap[style][order[lang]] : style) + "）列为首选，胜率为",
      "zh-tw": "AI將" + carNo + "號 " + name + "（" + klass + "、" + (sourceMap[style] ? sourceMap[style][order[lang]] : style) + "）列為首選，勝率為",
      ko: "AI는 " + carNo + "번 " + name + "(" + klass + ", " + (sourceMap[style] ? sourceMap[style][order[lang]] : style) + ")을(를) 1순위로 평가합니다. 승률: "
    }[lang];
    var output = lead + winProbability + "%" + (lang === "en" ? ". " : "。 ");
    var back = tail.match(/バック回数\(B\)(\d+)回とラインを牽引する近況で、主導権争いの軸。/);
    if (back) {
      output += {
        en: "Recent form and " + back[1] + " back-straight counts support the rider's role as line leader. ",
        "zh-cn": "近期状态和" + back[1] + "次最后直道记录支持其作为阵型领骑者。",
        "zh-tw": "近期狀態和" + back[1] + "次最後直道紀錄支持其作為隊形領騎者。",
        ko: "최근 흐름과 백스트레치 " + back[1] + "회 기록을 바탕으로 라인 선두 역할을 평가합니다. "
      }[lang];
    }
    var rival = tail.match(/相手本線は(\d+)番 (.+?)を中心に、ライン構成「(.+?)」の流れに注目。/);
    if (rival) {
      output += {
        en: "The main rival is #" + rival[1] + " " + rival[2] + "; the line formation is " + rival[3] + ".",
        "zh-cn": "主要对手为" + rival[1] + "号 " + rival[2] + "；关注阵型“" + rival[3] + "”的走势。",
        "zh-tw": "主要對手為" + rival[1] + "號 " + rival[2] + "；留意隊形「" + rival[3] + "」的走勢。",
        ko: "주요 상대는 " + rival[1] + "번 " + rival[2] + "이며 라인 구성 " + rival[3] + "의 흐름을 살펴봅니다."
      }[lang];
    }
    return output;
  }

  function translateText(node) {
    var raw = node.nodeValue;
    var text = raw.trim();
    if (!text) return;
    var replacement = Object.prototype.hasOwnProperty.call(sourceMap, text) ? sourceMap[text][order[locale]] : dynamic(text);
    if (replacement && replacement !== text) node.nodeValue = preserveSpace(raw, replacement);
  }

  function translateTree(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var parent = node.parentElement;
      if (!parent || parent.closest("script,style,noscript,.site-language-control,.site-related-links")) continue;
      translateText(node);
    }
    root.querySelectorAll && root.querySelectorAll("[placeholder],[aria-label],[title],img[alt]").forEach(function (element) {
      ["placeholder", "aria-label", "title", "alt"].forEach(function (attribute) {
        var value = element.getAttribute(attribute);
        if (!value) return;
        var clean = value.trim();
        if (Object.prototype.hasOwnProperty.call(sourceMap, clean)) element.setAttribute(attribute, sourceMap[clean][order[locale]]);
        else {
          var m = clean.match(/^(.+?)の選手分析$/);
          if (m) element.setAttribute(attribute, m[1] + (locale === "en" ? " rider analysis" : locale === "ko" ? " 선수 분석" : "選手分析"));
        }
      });
    });
  }

  function install(data) {
    sourceMap = data.map || {};
    weekdays = data.dynamic && data.dynamic.weekdays || {};
    translateTree(document.body);
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === "characterData") translateText(record.target);
        else Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (node.nodeType === Node.TEXT_NODE) translateText(node);
          else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
        });
      });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  fetch("/keirinyoso-ui-translations.json", { credentials: "same-origin" })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (data) { if (data) install(data); })
    .catch(function () {});
})();
