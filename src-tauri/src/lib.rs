use std::process::Command;
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[tauri::command]
fn send_session_notification(title: String, body: String) {
    // macOS native notification using osascript
    // We escape double quotes to avoid syntax errors in AppleScript
    let escaped_title = title.replace("\"", "\\\"");
    let escaped_body = body.replace("\"", "\\\"");
    let script = format!(
        "display notification \"{}\" with title \"{}\" sound name \"Glass\"",
        escaped_body, escaped_title
    );
    let _ = Command::new("osascript")
        .args(&["-e", &script])
        .output();
}

#[tauri::command]
fn play_alert_sound() {
    let _ = Command::new("afplay")
        .arg("/System/Library/Sounds/Glass.aiff")
        .spawn();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            send_session_notification,
            play_alert_sound
        ])
        .setup(|app| {
            // Build the tray icon
            if let Some(icon) = app.default_window_icon() {
                let _tray = TrayIconBuilder::new()
                    .icon(icon.clone())
                    .icon_as_template(true)
                    .on_tray_icon_event(|tray, event| match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        _ => {}
                    })
                    .build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
