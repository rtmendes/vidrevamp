# VidRevamp Chrome Extension

A SortFeed-style Chrome Extension that integrates with the VidRevamp platform.

## Features
- **Sort by Views** — Click "Sort by Views" to re-order any Instagram Reels grid, TikTok profile, or YouTube Shorts feed by view count, highest first
- **Outlier Score Badges** — Each video card gets a colored badge showing its outlier score vs the median of all visible videos (green = mega outlier, amber = outlier, gray = average)
- **Save to Vault** — Hover over any video card and click "Save Hook" to instantly save it to your VidRevamp Vault
- **Floating Sort Bar** — A persistent panel on the right side of supported pages with quick access to sort and open your Vault
- **Quick Nav** — Popup links to Videos, Vault, Hook Lab, and Script pages

## Supported Platforms
- Instagram (Reels on profile pages)
- TikTok (Video grid on profile pages)
- YouTube (Shorts and video grids)

## Installation (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (toggle top-right)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder
5. The VidRevamp icon will appear in your extensions bar

## Icons
You need to add icon files at:
- `icons/icon16.png`
- `icons/icon32.png`
- `icons/icon48.png`
- `icons/icon128.png`

A simple violet square with a lightning bolt works well. Generate using any icon tool.

## Configuration
The extension connects to VidRevamp at `http://localhost:3001` by default.
To change this, update `VIDREVAMP_URL` in `background.js`.
