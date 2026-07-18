# 🚀 Hackathon Installation & Quickstart Guide

This guide provides instructions on how to install and run the PAKDE desktop application.

### 📥 Direct Downloads (v1.0.3)
*   **[Download for Windows (.exe)](https://github.com/okihita/PAKDE/releases/download/v1.0.3/PAKDE_1.0.3_x64-setup.exe)**
*   **[Download for macOS (.dmg)](https://github.com/okihita/PAKDE/releases/download/v1.0.3/PAKDE_1.0.3_universal.dmg)**

For other versions, Linux packages, or alternative installer formats, please visit the [Releases](https://github.com/okihita/PAKDE/releases) page.

---

## 💻 macOS Installation & Gatekeeper Workaround

Since this is a hackathon development build and does not have an Apple Developer signature, macOS Gatekeeper will block it by default with the message: 
> *“Apple could not verify 'pakde-tauri' is free of malware...”*

You can easily bypass this using one of the two methods below:

### Method 1: Right-Click (UI Workaround)
1. Open the downloaded `.dmg` file and drag the app into your **Applications** folder.
2. In Finder, navigate to your **Applications** folder.
3. **Right-click (or Control-click)** the app icon and select **Open** from the context menu.
4. A warning dialog will appear, but it will now include an **Open** button. Click **Open** to run the app.
*(You only need to do this once. Future launches will work normally by double-clicking the app icon).*

### Method 2: Command Line (Fastest)
If you prefer the terminal, remove the macOS quarantine attribute after dragging the app to Applications:
```bash
xattr -cr /Applications/pakde-tauri.app
```
Then, double-click the app to launch it normally.

---

## 🪟 Windows Installation

1. Download the `.msi` or `.exe` installer from the Releases page.
2. Run the installer. 
3. If Windows SmartScreen blocks execution (shows a blue banner saying *“Windows protected your PC”*):
   * Click **More info**.
   * Click **Run anyway**.

---

## 🛠️ Development Setup & Run from Source

If you want to run the application in development mode instead of installing pre-built binaries:

### Prerequisites
- [Node.js](https://nodejs.org/) (v22 LTS recommended)
- [Rust](https://www.rust-lang.org/) (via rustup)
- [pnpm](https://pnpm.io/) package manager

### Steps
1. Clone this repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the application in development mode:
   ```bash
   pnpm tauri dev
   ```
