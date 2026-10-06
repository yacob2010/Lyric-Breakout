# Lyric Breakout

An After Effects ScriptUI panel that turns a worship lyric chart into a timed lyric-video skeleton: one comp per lyric line, a master comp in song order, and a way to snap every line to markers you tap on the audio.

It handles the setup so you can spend your time on the animation. Kinetic type presets are planned as a separate script that works on the line comps this one makes (see [CHANGELOG.md](CHANGELOG.md)).

## What it does

1. Parses a pasted chart (or a PDF) into sections and lines.
2. Cleans the text: punctuation stripped except apostrophes, syllable hyphens joined (`ex - plain` becomes `explain`).
3. Shows you a read-only preview of every comp and break before anything is built.
4. Builds the comps.
5. Retimes the lines in your master to markers you tap on the song.

## Install

Copy `Lyric_Breakout.jsx` into your After Effects ScriptUI Panels folder:

- **macOS:** `/Applications/Adobe After Effects <version>/Scripts/ScriptUI Panels/`

Restart After Effects, then open **Lyric Breakout** from the Window menu. You can also run it once without installing via **File > Scripts > Run Script File...**.

Developed and used on macOS. The panel should also work on Windows, but that is untested, and **Choose PDF** is macOS only.

## Usage

### 1. Load a chart

Paste your lyric chart into the edit box, or click **Choose PDF...** (macOS) to extract the text from a PDF. A loaded PDF is cleaned up into the edit box automatically. If a PDF has no real text (scanned images), copy and paste the text instead.

### 2. Edit the breaks

What you type in the edit box stays exactly as typed. Two kinds of break:

| You type | What you get |
| --- | --- |
| A new line, or `/` | A new comp (hard break) |
| `\|` | A second line inside the same comp (soft break) |

For example, these make two comps:

```
First half of the line
second half of the line
```

and this makes one comp with two stacked lines:

```
First half of the line | second half of the line
```

**Clean Up** rewrites the edit box with the cleaned version of your chart (punctuation gone, `/` turned into real new lines, ` | ` spaced out).

### 3. Preview

**Preview** opens a read-only window showing:

- the song order, with consecutive repeats collapsed (`CHORUS 1 x2 > VERSE 1 > ...`)
- every section's comps, where `[n]` starts a comp and an indented line under it is a second line in the same comp
- comp length, how many times each section plays, and the total comp count
- how many markers snapping will need

Nothing is built until you click **Build Comps**, either in the preview or the main panel.

### 4. Build

Settings next to the edit box:

- **BPM** — leave blank to read it from the chart header (`125 bpm`), or type one.
- **Bars/line** — placeholder length of each line, in 4/4 bars (default 2).
- **FPS** — frame rate for all comps.
- **Master** — how the master comp is laid out:
  - *Flat + section markers* (default): every line comp sits directly in the master timeline, with a comp marker at each section start and a layer label color per section. This is the layout to use for lining lyrics up to audio.
  - *Nested section comps*: the master holds one comp per section.

Build creates a `<Title> - Lyrics` folder in the project panel with a `Lines` folder (and `Sections` for the nested layout), plus `<Title> - MASTER`. Repeated sections reuse the same line comps, so you animate a line once and every repeat picks it up.

### 5. Snap to markers

Placeholder timing is evenly spaced. To time it to the real song:

1. Drop your audio into the master (or work in the comp that holds the audio) and play it.
2. Select the audio layer and tap a layer marker at the start of every line, in song order, repeats included (**Layer > Add Marker**, or its keyboard shortcut). Preview tells you how many you need.
3. With that layer still selected, click **Snap Open Comp to Markers**.

Each line layer moves onto its marker and ends at the next one. Line comps are lengthened if a line runs longer than its placeholder, and the section markers move to where each section now starts. It's a single undo step.

How it picks the comp to retime: if the open comp has line layers, it retimes that one. Otherwise it looks for the newest flat `... - MASTER` comp in the project and uses the markers from the selected layer in the open comp.

Notes:

- Too few markers: the leftover lines are left in sequence after the last marker. Too many: the extras are ignored. The result popup tells you which.
- The last line keeps its placeholder length, so trim it by hand.
- A line stays on screen until the next marker, including through instrumental gaps.
- Snapping needs the flat master. A nested master has no line layers to move.

## Chart format

Written around typical worship lyric charts: section headers in capitals, one lyric line per row. A chart looks like this (placeholder text):

```
My Song [Lyrics, 120 bpm, 4/4]
[Artist] by Writer One and Writer Two
INTRO
CHORUS 1 (2X)
First line of the chorus
Second line of the chorus
VERSE 1
First line of the verse
Second line of the verse
PRE-CHORUS
First line of the pre-chorus
PRE-CHORUS > CHORUS 1
```

- **Section headers** are ALL CAPS on their own line, with an optional `(2X)` repeat count.
- **Pointer headers** like `PRE-CHORUS > CHORUS 1` play those sections in order using the comps already built for them.
- Sections with no lyrics (like an empty `INTRO`) are skipped, and the result popup says so.
- The title and BPM come from the first line before any section. Byline, copyright, CCLI lines, and stray page numbers are ignored.

## Output details

- Comps are 1920 x 1080. Text is white, centered, and auto-sized so long lines fit, with the anchor point centered on the text so scale and rotation animations pivot from the middle. Font and color are left at After Effects defaults to restyle however you like.
- Timing assumes 4/4.

## Limitations

- Comp size is fixed at 1920 x 1080 and timing assumes 4/4 (both are constants near the top of the script).
- Choose PDF uses macOS PDFKit through `osascript`. Extracted PDFs sometimes merge or reorder lines, so check the preview.
- Snapping assumes the audio sits at the same position in the comp the markers were tapped in and in the master.

## Repository contents

- `Lyric_Breakout.jsx` — the script / panel
- `CHANGELOG.md` — version history
- `README.md` — this file
