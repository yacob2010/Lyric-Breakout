# Changelog

All notable changes to Lyric Breakout (After Effects ScriptUI panel) are documented in this file.

## [Unreleased]

### Planned


### Changed
- README and script comments use placeholder text instead of real song lyrics, ahead of publishing the repository.

## [0.8.1] - 2026-10-06

### Changed
- **Snap Open Comp to Markers** now works when the markers are in a different comp from the master. If the open comp has no line layers, it finds the newest flat `... - MASTER` comp in the project and retimes that one, using the markers from the selected layer.
- The result popup says which master was snapped and which comp the markers came from.

### Fixed
- The "No line layers found" error now names the comp it checked and how many layers it saw, and explains that nested masters can't be snapped.

## [0.8.0] - 2026-10-06

### Added
- **Snap Open Comp to Markers** button: retimes the line layers in an already-built flat master to the markers on the selected layer (usually the audio layer). Each line starts on its marker and ends at the next one.
- Line comps are lengthened (and their text layers extended with them) when a line runs longer than its placeholder length.
- Section markers in the master move to where each section now starts.
- Preview window reports how many markers snapping needs (one per line layer, repeats included).

### Removed
- The build-time "Snap lines to markers" checkbox from 0.7.0, which always built a new comp. Replaced by the button above.

## [0.7.0] - 2026-10-06

### Added
- "Snap lines to markers" checkbox that read markers from the selected audio layer while building a new master (forced the flat master). Superseded in 0.8.0.

## [0.6.1] - 2026-10-06

### Added
- **Clean Up** button: rewrites the edit box with the cleaned chart (punctuation stripped, `/` turned into new lines, ` | ` spaced out), as the old Preview button used to.

## [0.6.0] - 2026-10-06

### Added
- **Preview** now opens a separate read-only window showing the song order and every comp, with each `[n]` marking one comp and an indented line marking a second line inside the same comp. Includes comp length, play count per section, and total comp count.
- "Back to edit" and "Build Comps" buttons in the Preview window.

### Changed
- Preview no longer rewrites the edit box; what you type, including `/` and `|`, stays exactly as typed.

## [0.5.0] - 2026-10-06

### Added
- **Master** dropdown with two layouts:
  - *Flat + section markers* (default): every line comp sits directly in the master timeline, with a comp marker at each section start and a layer label color per section.
  - *Nested section comps*: the master holds one comp per section, as in earlier versions.

### Changed
- Layers in the master stack in song order, top to bottom.

## [0.4.3] - 2026-10-06

### Changed
- Soft breaks display as ` | ` (spaced) in the preview text.
- The hint under the edit box is split into two short labels so it can't be clipped.

## [0.4.2] - 2026-10-06

### Fixed
- Edit box text now uses Mac-style line breaks so the preview displays correctly on macOS.
- Preview and Build handlers are wrapped so an error shows a popup instead of failing silently.

### Added
- "Preview updated." feedback in the summary line.

## [0.4.1] - 2026-10-06

### Fixed
- **Choose PDF** failures now show the underlying error instead of doing nothing; the command uses the full `/usr/bin/osascript` path and captures its error output.

## [0.4.0] - 2026-10-06

### Added
- Preview step with an editable cleaned-up chart, plus a live summary line (sections, line comps, approximate length).
- **Choose PDF...** button (macOS only) that extracts text from a PDF through PDFKit and loads it into the edit box.
- Two kinds of break: a new line or `/` starts a new comp; `|` puts a second line inside the same comp.
- Stray page numbers in pasted charts are ignored.

## [0.3.0] - 2026-10-06

### Removed
- Automatic splitting of merged lines. It split lines the chart intentionally keeps whole (e.g. CHORUS 3); the chart's own line breaks are now honored exactly.

## [0.2.0] - 2026-10-06

### Added
- One comp per lyric line, nested inside section comps (Lines and Sections folders in the project panel).

### Changed
- Punctuation is stripped from lyrics except apostrophes (`He's`, `who's`). Remaining dashes become spaces.

## [0.1.0] - 2026-10-06

### Added
- Initial ScriptUI panel: paste a lyric chart, parse it into sections, and build one comp per section plus a master comp in song order.
- Chart parsing: ALL CAPS section headers with optional `(2X)` repeat counts, `PRE-CHORUS > CHORUS 2` pointer headers, empty sections skipped, title/byline/copyright/CCLI lines ignored, syllable hyphens (`ex - plain`) joined.
- BPM read from the chart header; line length set by bars per line; frame rate selector.
- Text layers auto-sized to fit the frame, centered, with a centered anchor point for animation.


The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).