# Pomo-Timer — macOS & Windows Desktop App (Tauri 2)

A beautiful, lightweight, and distraction-free Pomodoro timer application designed to run natively on both **macOS** and **Windows**. Built using **Tauri 2** (HTML/CSS/JS frontend and **Rust** backend).

## Features

*   **Native UI Design**: Elegant dark-themed interface, using system-matching fonts and titlebar support.
*   **Customizable Sessions**: 25 min work, 5 min short break, and 15 min long break sessions, fully customizable via the Options tab.
*   **System Tray Icon (Menu Bar)**: Closes/toggles window visibility to keep it out of your way, accessible with a click in the menu bar (macOS) or system tray (Windows).
*   **Cross-Platform Native Notifications & Sounds**:
    *   **macOS**: Triggers macOS notifications via AppleScript and plays native system alert sound (`Glass.aiff`).
    *   **Windows**: Triggers native notification windows and plays native System exclamation alerts.
*   **Persistent Statistics**: Tracks completed Pomodoros per day, calculates weekly focus hours, and draws a clean weekly bar chart, all persisted locally using Tauri's built-in store plugin.
*   **Automated Cloud Releases**: Pre-compiled binaries for Windows (`.msi` / `.exe`) and macOS (`.dmg`) are automatically generated and uploaded to GitHub Releases using GitHub Actions.

## Project Structure

*   `src/`: Frontend interface (Vanilla HTML, CSS, and JavaScript).
*   `src-tauri/`: Rust backend (Window configurations, tray icon setup, and conditional compilation for native OS commands).

## Development Prerequisites

Ensure you have installed:
*   [Node.js](https://nodejs.org/) (version 16+ recommended)
*   [Rust & Cargo](https://www.rust-lang.org/)

## Getting Started

1.  Install JavaScript dependencies:
    ```bash
    npm install
    ```
2.  Run the application in development mode:
    ```bash
    npm run tauri dev
    ```

## Build Native App Bundle

To compile the production release optimized app:

```bash
npm run tauri build
```

*   On macOS, the compiled standalone `.app` bundle will be generated in `src-tauri/target/release/bundle/macos/`.
*   On Windows, the compiled standalone `.msi` and `.exe` installers will be generated in `src-tauri/target/release/bundle/msi/` and `/nsis/`.

## Cleaning Temporary Build Files

Rust creates a temporary compilation directory (`src-tauri/target`) which can grow to around 2.5 GB. To free up this space without deleting your source code, run:

```bash
cd src-tauri
cargo clean
```
