# Pomodoro Timer — macOS Native Style (Tauri 2)

A desktop Pomodoro timer application designed to look and feel native on macOS. Built using **Tauri 2** (HTML/CSS/JS frontend and **Rust** backend).

## Features

*   **macOS Native UI**: Dark mode by default, SF Pro system fonts, and transparent titlebar support (retains native traffic light buttons).
*   **Customizable Sessions**: 25 min work, 5 min short break, and 15 min long break sessions, fully customizable via the Options tab.
*   **Menu Bar Icon (System Tray)**: Left-clicking the menu bar icon toggles window visibility (hides it when visible, focuses/shows it when hidden).
*   **Native Notifications & Sounds**: Triggers native macOS notifications via AppleScript and plays the native system alert sound (`Glass.aiff`) when a timer ends.
*   **Persistent Statistics**: Tracks completed Pomodoros per day, calculates weekly focus hours, and draws a clean weekly bar chart, all persisted locally using Tauri's built-in store plugin.

## Project Structure

*   `src/`: Frontend interface (Vanilla HTML, CSS, and JavaScript).
*   `src-tauri/`: Rust backend (Window configurations, tray icon setup, and native OS command wrappers).

## Development Prerequisites

Ensure you have installed:
*   [Node.js](https://nodejs.org/) (version 16+ recommended)
*   [Rust & Cargo](https://www.rust-lang.org/) (if not in your PATH, run `. "$HOME/.cargo/env"`)

## Getting Started

1.  Install JavaScript dependencies:
    ```bash
    npm install
    ```
2.  Run the application in development mode:
    ```bash
    npm run tauri dev
    ```

## Build Native App Bundle (`.app` / `.dmg`)

To compile the production release optimized app:

```bash
npm run tauri build
```

The compiled standalone `.app` bundle will be generated in:
`src-tauri/target/release/bundle/macos/pomodoro-timer.app`

## Cleaning Temporary Build Files

Rust creates a temporary compilation directory (`src-tauri/target`) which can grow to around 2.5 GB. To free up this space without deleting your source code, run:

```bash
cd src-tauri
cargo clean
```
