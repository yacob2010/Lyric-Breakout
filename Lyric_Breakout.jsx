/*
  Lyric Breakout v0.8.1 (chart -> line comps -> master)
*/
(function (thisObj) {

  var COMP_W = 1920, COMP_H = 1080;

  // ---- PARSER START
  function trim(s) { return s.replace(/^\s+|\s+$/g, ""); }

  function cleanText(s) {
    s = s.replace(/\s+-\s+/g, "");                 
    s = s.replace(/[-\u2013\u2014]/g, " ");         
    s = s.replace(/[.,!?;:"()\[\]{}*&@#$%^_+=~`<>\\|\u201C\u201D\u2026]/g, ""); 
    s = s.replace(/\s+/g, " ");
    return trim(s);
  }

  function cleanLine(s) {
    var bits = s.split("|"), out = [];
    for (var i = 0; i < bits.length; i++) {
      var c = cleanText(bits[i]);
      if (c) out.push(c);
    }
    return out.join("|");
  }

  function parseChart(raw) {
    var rows = raw.split(/\r\n|\r|\n/);
    var info = { title: "", bpm: 0, sections: {}, order: [] };
    var cur = null;
    var seenSection = false;
    var headerRe = /^([A-Z0-9][A-Z0-9 \->]*?)\s*(?:\((\d+)X\))?$/;

    for (var i = 0; i < rows.length; i++) {
      var t = trim(rows[i]);
      if (!t) continue;
      if (/^(\u00A9|CCLI)/i.test(t)) continue;
      if (/^\d+$/.test(t)) continue; 

      var m = t.match(headerRe);
      if (m && /[A-Z]/.test(m[1])) {
        seenSection = true;
        var name = trim(m[1]);
        var repeat = m[2] ? parseInt(m[2], 10) : 1;
        var isPointer = name.indexOf(">") !== -1;
        if (isPointer) {
          cur = null;
        } else {
          cur = { name: name, lines: [] };
          if (!info.sections[name]) info.sections[name] = cur;
        }
        info.order.push({ name: name, repeat: repeat });
        continue;
      }

      if (cur) {
        var parts = t.split("/");
        for (var p = 0; p < parts.length; p++) {
          var c = cleanLine(parts[p]);
          if (c) cur.lines.push(c);
        }
      } else if (!seenSection) {
        var b = t.match(/(\d+(?:\.\d+)?)\s*bpm/i);
        if (b && !info.bpm) info.bpm = parseFloat(b[1]);
        if (!info.title) info.title = trim(t.replace(/\s*\[.*\]\s*$/, ""));
      }
    }
    return info;
  }

  function resolveOrder(info, warnings) {
    var seq = [];
    for (var i = 0; i < info.order.length; i++) {
      var names = info.order[i].name.split(">");
      for (var r = 0; r < info.order[i].repeat; r++) {
        for (var n = 0; n < names.length; n++) {
          var nm = trim(names[n]);
          var s = info.sections[nm];
          if (!s) {
            if (r === 0) warnings.push(nm + ": not found, skipped");
            continue;
          }
          if (!s.lines.length) {
            if (r === 0) warnings.push(nm + ": no lyrics, skipped");
            continue;
          }
          seq.push(s);
        }
      }
    }
    return seq;
  }

  function toPreviewText(info) {
    var out = [];
    if (info.title) {
      out.push(info.title + " [" + (info.bpm ? info.bpm + " bpm" : "Lyrics") + "]");
    }
    var printed = {};
    for (var i = 0; i < info.order.length; i++) {
      var o = info.order[i];
      out.push(o.name + (o.repeat > 1 ? " (" + o.repeat + "X)" : ""));
      if (o.name.indexOf(">") === -1 && !printed[o.name]) {
        printed[o.name] = true;
        var lines = info.sections[o.name].lines;
        for (var j = 0; j < lines.length; j++) out.push(lines[j].split("|").join(" | "));
      }
    }
    return out.join("\n");
  }

  function lineSeconds(bpm, barsPerLine) { return (240 / bpm) * barsPerLine; }

  function summarize(raw, bpmIn, barsPerLine) {
    var info = parseChart(raw);
    var seq = resolveOrder(info, []);
    if (!seq.length) return "No sections found yet";
    var bpm = bpmIn || info.bpm || 120;
    var lineDur = lineSeconds(bpm, barsPerLine);
    var seen = {}, lineComps = 0, total = 0;
    for (var i = 0; i < seq.length; i++) {
      total += seq[i].lines.length * lineDur;
      if (!seen[seq[i].name]) { seen[seq[i].name] = true; lineComps += seq[i].lines.length; }
    }
    var mins = Math.floor(total / 60);
    var secs = Math.round(total - mins * 60);
    if (secs === 60) { mins++; secs = 0; }
    return seq.length + " sections, " + lineComps + " line comps, about " +
      mins + ":" + (secs < 10 ? "0" : "") + secs + " at " + bpm + " bpm";
  }

  function toBreakdown(raw, bpmIn, barsPerLine) {
    var info = parseChart(raw), warnings = [];
    var seq = resolveOrder(info, warnings);
    if (!seq.length) return "";
    var bpm = bpmIn || info.bpm || 120;
    var lineDur = lineSeconds(bpm, barsPerLine);
    var plays = {}, firstUse = [], flow = [], lastName = "", count = 0, i, j, k;

    for (i = 0; i < seq.length; i++) {
      var n = seq[i].name;
      if (!plays[n]) { plays[n] = 0; firstUse.push(seq[i]); }
      plays[n]++;
      if (n === lastName) {
        count++;
      } else {
        if (lastName) flow.push(lastName + (count > 1 ? " x" + count : ""));
        lastName = n; count = 1;
      }
    }
    flow.push(lastName + (count > 1 ? " x" + count : ""));

    var out = [];
    out.push("SONG ORDER");
    out.push(flow.join("  >  "));
    out.push("");
    out.push("[n] = one comp.   An indented line under it = second line inside that same comp.");
    out.push("");

    var totalComps = 0, layerCount = 0;
    for (i = 0; i < seq.length; i++) layerCount += seq[i].lines.length;
    for (i = 0; i < firstUse.length; i++) {
      var s = firstUse[i];
      totalComps += s.lines.length;
      out.push("== " + s.name + " ==   " + s.lines.length + " comp" + (s.lines.length === 1 ? "" : "s") +
        ", " + lineDur.toFixed(1) + "s each, plays " + plays[s.name] + "x");
      for (j = 0; j < s.lines.length; j++) {
        var bits = s.lines[j].split("|");
        out.push("[" + (j + 1) + "]   " + bits[0]);
        for (k = 1; k < bits.length; k++) out.push("        " + bits[k]);
      }
      out.push("");
    }
    out.push(totalComps + " line comps total. Nothing has been built yet.");
    out.push("Snapping to markers later needs " + layerCount + " markers: one at the start of each line, in song order, repeats included.");
    if (warnings.length) { out.push(""); out.push(warnings.join("\n")); }
    return out.join("\n");
  }


  function makeLineComp(secName, idx, text, lineDur, fps, folder) {
    var comp = app.project.items.addComp(secName + " - L" + (idx + 1), COMP_W, COMP_H, 1, lineDur, fps);
    comp.parentFolder = folder;


    var parts = text.split("|");
    var longest = 0;
    for (var k = 0; k < parts.length; k++) longest = Math.max(longest, parts[k].length);

    var layer = comp.layers.addText(parts.join("\r"));
    var prop = layer.property("Source Text");
    var doc = prop.value;
    doc.fontSize = Math.min(110, Math.floor((COMP_W * 0.9) / (longest * 0.5)));
    doc.applyFill = true;
    doc.fillColor = [1, 1, 1];
    doc.justification = ParagraphJustification.CENTER_JUSTIFY;
    prop.setValue(doc);


    var r = layer.sourceRectAtTime(0, false);
    layer.property("Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
    layer.property("Position").setValue([COMP_W / 2, COMP_H / 2]);
    return comp;
  }

  function makeLineComps(sec, lineDur, fps, lineFolder) {
    var arr = [];
    for (var i = 0; i < sec.lines.length; i++) {
      arr.push(makeLineComp(sec.name, i, sec.lines[i], lineDur, fps, lineFolder));
    }
    return arr;
  }

  function makeSectionComp(sec, lineComps, lineDur, fps, secFolder) {
    var comp = app.project.items.addComp(sec.name, COMP_W, COMP_H, 1, sec.lines.length * lineDur, fps);
    comp.parentFolder = secFolder;
    for (var i = 0; i < lineComps.length; i++) {
      var L = comp.layers.add(lineComps[i]);
      L.startTime = i * lineDur;
      L.name = lineComps[i].name;
      L.moveToEnd();
    }
    return comp;
  }

  function build(raw, bpmIn, barsPerLine, fps, flat) {
    var warnings = [];
    var info = parseChart(raw);
    var seq = resolveOrder(info, warnings);
    if (!seq.length) {
      alert("No lyric sections found. Section headers need to be ALL CAPS on their own line.");
      return;
    }

    var bpm = bpmIn || info.bpm || 120;
    var lineDur = lineSeconds(bpm, barsPerLine);
    var title = info.title || "Lyrics";

    app.beginUndoGroup("Lyric Breakout");
    try {
      var folder = app.project.items.addFolder(title + " - Lyrics");
      var lineFolder = app.project.items.addFolder("Lines");
      lineFolder.parentFolder = folder;
      var secFolder = null;
      if (!flat) {
        secFolder = app.project.items.addFolder("Sections");
        secFolder.parentFolder = folder;
      }

      var lineSets = {}, sectionComps = {}, secIndex = {};
      var nSec = 0, total = 0, i, j, s;

      for (i = 0; i < seq.length; i++) {
        s = seq[i];
        if (!lineSets[s.name]) {
          lineSets[s.name] = makeLineComps(s, lineDur, fps, lineFolder);
          secIndex[s.name] = nSec++;
          if (!flat) sectionComps[s.name] = makeSectionComp(s, lineSets[s.name], lineDur, fps, secFolder);
        }
        total += s.lines.length * lineDur;
      }

      var master = app.project.items.addComp(title + " - MASTER", COMP_W, COMP_H, 1, total, fps);
      master.parentFolder = folder;

      var t = 0;
      for (i = 0; i < seq.length; i++) {
        s = seq[i];
        master.markerProperty.setValueAtTime(t, new MarkerValue(s.name));
        if (flat) {
          for (j = 0; j < s.lines.length; j++) {
            var lc = lineSets[s.name][j];
            var L = master.layers.add(lc);
            L.startTime = t + j * lineDur;
            L.name = lc.name;
            L.label = (secIndex[s.name] % 16) + 1;  
            L.moveToEnd();                           
          }
        } else {
          var sl = master.layers.add(sectionComps[s.name]);
          sl.startTime = t;
          sl.name = s.name;
          sl.moveToEnd();
        }
        t += s.lines.length * lineDur;
      }
      master.openInViewer();
    } catch (e) {
      alert("Lyric Breakout error: " + e.toString() + " (line " + e.line + ")");
    }
    app.endUndoGroup();

    var msg = "Built " + seq.length + " sections in the master comp at " + bpm + " bpm.";
    if (warnings.length) msg += "\n\n" + warnings.join("\n");
    alert(msg);
  }


  var LINE_RE = /^(.+) - L(\d+)$/;

  function findLineLayers(comp) {
    var out = [], i;
    for (i = 1; i <= comp.numLayers; i++) {
      var Lr = comp.layer(i), src = null;
      try { src = Lr.source; } catch (e) {}
      if (src && (src instanceof CompItem) && LINE_RE.test(src.name)) out.push(Lr);
    }
    return out;
  }

  function snapActiveComp() {
    var lineRe = LINE_RE;
    var active = app.project.activeItem;
    if (!active || !(active instanceof CompItem)) {
      alert("Open the comp that has your markers first, and select the layer they are on.");
      return;
    }
    var sel = active.selectedLayers;
    if (sel.length !== 1 || !sel[0].marker || sel[0].marker.numKeys < 1) {
      alert("Select the one layer that has your markers on it (usually the audio layer), then try again.\n\nTip: with a layer selected, numpad * adds a marker to that layer.");
      return;
    }
    var ml = sel[0];
    var i, k;

    var comp = active, note = "";
    var layers = findLineLayers(active);
    if (!layers.length) {
      var found = null;
      for (i = app.project.numItems; i >= 1; i--) {
        var it = app.project.item(i);
        if ((it instanceof CompItem) && / - MASTER$/.test(it.name)) {
          var ll = findLineLayers(it);
          if (ll.length) { found = it; layers = ll; break; }
        }
      }
      if (!found) {
        alert("No line layers found in \"" + active.name + "\" (" + active.numLayers + " layers), and no flat master was found elsewhere in the project.\n\n" +
          "Snapping works on the flat master: layers whose comps are named like \"CHORUS 1 - L1\". If you built with Nested section comps, rebuild with Flat.");
        return;
      }
      comp = found;
      note = "\nSnapped \"" + found.name + "\" using the markers from \"" + active.name + "\".";
    }

    var fps = comp.frameRate;
    var times = [];
    for (i = 1; i <= ml.marker.numKeys; i++) {
      times.push(Math.round((ml.startTime + ml.marker.keyTime(i)) * fps) / fps);
    }
    times.sort(function (a, b) { return a - b; });
    layers.sort(function (a, b) { return (a.startTime - b.startTime) || (a.index - b.index); });

    var n = times.length, N = layers.length;
    var starts = [], ends = [], origLen = [];
    for (k = 0; k < N; k++) origLen.push(layers[k].outPoint - layers[k].startTime);
    for (k = 0; k < N; k++) {
      starts.push(k < n ? times[k] : ends[k - 1]);
      ends.push((k + 1 < n && k + 1 < N) ? times[k + 1] : starts[k] + origLen[k]);
      if (ends[k] - starts[k] < 1 / fps) ends[k] = starts[k] + 1 / fps;
    }

    var need = [], needSrc = [], idx;
    for (k = 0; k < N; k++) {
      idx = -1;
      for (i = 0; i < needSrc.length; i++) if (needSrc[i] === layers[k].source) { idx = i; break; }
      if (idx < 0) { needSrc.push(layers[k].source); need.push(0); idx = needSrc.length - 1; }
      need[idx] = Math.max(need[idx], ends[k] - starts[k]);
    }

    app.beginUndoGroup("Snap Lyrics to Markers");
    var msg;
    try {
      for (i = 0; i < needSrc.length; i++) {
        var sc = needSrc[i];
        var want = Math.ceil(need[i] * fps - 0.001) / fps;
        if (want > sc.duration) {
          var oldDur = sc.duration;
          sc.duration = want;
          for (var q = 1; q <= sc.numLayers; q++) {
            var inner = sc.layer(q);
            if (Math.abs(inner.outPoint - oldDur) < 0.002) inner.outPoint = sc.duration;
          }
        }
      }

      for (k = 0; k < N; k++) {
        layers[k].startTime = starts[k];
        layers[k].inPoint = starts[k];
        layers[k].outPoint = ends[k];
      }
      if (ends[N - 1] > comp.duration) comp.duration = ends[N - 1];


      var secNames = {}, a;
      for (k = 0; k < N; k++) secNames[lineRe.exec(layers[k].source.name)[1]] = true;
      for (a = comp.markerProperty.numKeys; a >= 1; a--) {
        if (secNames[comp.markerProperty.keyValue(a).comment]) comp.markerProperty.removeKey(a);
      }
      for (k = 0; k < N; k++) {
        var m = lineRe.exec(layers[k].source.name);
        if (parseInt(m[2], 10) === 1) comp.markerProperty.setValueAtTime(starts[k], new MarkerValue(m[1]));
      }

      msg = "Read " + n + " markers from \"" + ml.name + "\".\nSnapped " + Math.min(n, N) + " of " + N + " line layers." + note;
      if (n < N) msg += "\n\n" + (N - n) + " line(s) had no marker and were left in sequence after the last one.";
      if (n > N) msg += "\n\n" + (n - N) + " extra marker(s) ignored.";
    } catch (e) {
      msg = "Snap error: " + e.toString() + " (line " + e.line + ")";
    }
    app.endUndoGroup();
    alert(msg);
  }

  function extractPdfText(file) {
    if ($.os.indexOf("Mac") === -1) {
      return { text: "", error: "Choose PDF only works on macOS for now. Copy the text out of the PDF and paste it in." };
    }
    var script = 'function run(a){ObjC.import("Quartz");' +
      'var d=$.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(a[0]));' +
      'if(!d||!d.string)return "";return ObjC.unwrap(d.string);}';
    var path = file.fsName.replace(/'/g, "'\\''");
    var cmd = "/usr/bin/osascript -l JavaScript -e '" + script + "' '" + path + "' 2>&1";
    var out = "";
    try { out = system.callSystem(cmd); } catch (e) { return { text: "", error: "callSystem failed: " + e.toString() }; }
    out = out || "";
    if (/execution error|osascript:|command not found|not permitted/i.test(out.substring(0, 400)) && out.length < 600) {
      return { text: "", error: out };
    }
    return { text: out, error: "" };
  }

  function showPreview(raw, bpmV, barsV) {
    var text = toBreakdown(raw, bpmV, barsV);
    if (!text) {
      alert("No lyric sections found. Section headers need to be ALL CAPS on their own line.");
      return false;
    }
    var dlg = new Window("dialog", "Preview (read only)");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    var box = dlg.add("edittext", undefined, text.replace(/\n/g, "\r"),
      { multiline: true, readonly: true, scrollable: true });
    box.preferredSize = [480, 460];
    try { box.graphics.font = ScriptUI.newFont("Menlo", "REGULAR", 12); } catch (e) {}
    var btns = dlg.add("group");
    btns.alignment = "right";
    var backBtn = btns.add("button", undefined, "Back to edit");
    var buildBtn = btns.add("button", undefined, "Build Comps");
    var wantBuild = false;
    backBtn.onClick = function () { dlg.close(); };
    buildBtn.onClick = function () { wantBuild = true; dlg.close(); };
    dlg.show();
    return wantBuild;
  }

  function buildUI(thisObj) {
    var win = (thisObj instanceof Panel) ? thisObj
      : new Window("palette", "Lyric Breakout", undefined, { resizeable: true });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    var top = win.add("group");
    var pdfBtn = top.add("button", undefined, "Choose PDF...");
    var cleanBtn = top.add("button", undefined, "Clean Up");
    var prevBtn = top.add("button", undefined, "Preview");

    var chart = win.add("edittext", undefined, "", { multiline: true, scrollable: true });
    chart.preferredSize = [340, 280];
    chart.alignment = ["fill", "fill"];

    win.add("statictext", undefined, "New line or  /   =  separate comps");
    win.add("statictext", undefined, "  |   =  two lines inside one comp");

    var row = win.add("group");
    row.add("statictext", undefined, "BPM:");
    var bpmF = row.add("edittext", undefined, "");
    bpmF.characters = 5;
    row.add("statictext", undefined, "Bars/line:");
    var barsF = row.add("edittext", undefined, "2");
    barsF.characters = 3;
    row.add("statictext", undefined, "FPS:");
    var fpsList = ["23.976", "24", "25", "29.97", "30", "59.94"];
    var fpsF = row.add("dropdownlist", undefined, fpsList);
    fpsF.selection = 3;

    var row2 = win.add("group");
    row2.add("statictext", undefined, "Master:");
    var layoutF = row2.add("dropdownlist", undefined, ["Flat + section markers", "Nested section comps"]);
    layoutF.selection = 0;

    var summary = win.add("statictext", undefined, "Paste a chart or choose a PDF.", { multiline: true });
    var go = win.add("button", undefined, "Build Comps");
    var snapBtn = win.add("button", undefined, "Snap Open Comp to Markers");

    function guard(name, fn) {
      return function () {
        try { fn(); } catch (e) { alert(name + " error: " + e.toString() + " (line " + e.line + ")"); }
      };
    }

    function bars() { return parseFloat(barsF.text) || 2; }
    function bpm() { return parseFloat(bpmF.text) || 0; }

    function refresh() {
      try {
        summary.text = trim(chart.text) ? summarize(chart.text, bpm(), bars()) : "Paste a chart or choose a PDF.";
      } catch (e) { summary.text = ""; }
    }

    function previewFrom(raw) {
      var info = parseChart(raw);
      if (!info.order.length) {
        chart.text = raw.replace(/\r\n|\n/g, "\r");
        alert("No section headers found. Headers need to be ALL CAPS on their own line.");
      } else {
        chart.text = toPreviewText(info).replace(/\n/g, "\r");
      }
      refresh();
    }

    pdfBtn.onClick = function () {
      try {
        var f = File.openDialog("Choose a lyric chart PDF", function (x) {
          return (x instanceof Folder) || /\.pdf$/i.test(x.name);
        });
        if (!f) return;
        var res = extractPdfText(f);
        if (res.error) { alert("Couldn't read that PDF.\n\n" + res.error); return; }
        if (!trim(res.text)) { alert("The PDF came back with no text (it may be scanned images). Try copying the text and pasting it instead."); return; }
        previewFrom(res.text);
      } catch (e) {
        alert("Choose PDF error: " + e.toString() + " (line " + e.line + ")");
      }
    };

    function runBuild() {
      build(chart.text, bpm(), bars(), parseFloat(fpsList[fpsF.selection.index]), layoutF.selection.index === 0);
    }

    cleanBtn.onClick = guard("Clean Up", function () {
      if (!trim(chart.text)) { alert("Paste a lyric chart first."); return; }
      previewFrom(chart.text);
    });

    prevBtn.onClick = guard("Preview", function () {
      if (!trim(chart.text)) { alert("Paste a lyric chart first."); return; }
      if (showPreview(chart.text, bpm(), bars())) runBuild();
    });

    chart.onChanging = refresh;
    bpmF.onChange = refresh;
    barsF.onChange = refresh;

    go.onClick = guard("Build", function () {
      if (!trim(chart.text)) { alert("Paste a lyric chart first."); return; }
      runBuild();
    });

    snapBtn.onClick = guard("Snap", snapActiveComp);

    win.onResizing = win.onResize = function () { this.layout.resize(); };
    win.layout.layout(true);
    return win;
  }

  var ui = buildUI(thisObj);
  if (ui instanceof Window) { ui.center(); ui.show(); }

})(this);
