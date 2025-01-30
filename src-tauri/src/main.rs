// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use argon2::{password_hash::SaltString, Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[tauri::command]
fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(rand::thread_rng());

    let params = argon2::ParamsBuilder::new()
        .t_cost(1) // Итерации
        .m_cost(1024 * 32) // 24 МБ
        .p_cost(1)
        .output_len(40) //Длина хеша
        .build()
        .unwrap();

    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);

    match argon2.hash_password(password.as_bytes(), &salt) {
        Ok(hash) => Ok(hash.to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn verify_password(password: &str, hash: &str) -> Result<bool, String> {
    let argon2 = Argon2::default();

    match PasswordHash::new(hash) {
        Ok(parsed_hash) => match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        },
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init()) //Включить плагин tauri_plugin_http
        .on_window_event(|app, event| {
            match event {
                WindowEvent::CloseRequested { api, .. } => {
                    app.hide().unwrap(); //Свернуть в трей при нажатии на крестик
                    api.prevent_close();
                }
                _ => {}
            }
        })
        .setup(|app| {
            // app.get_webview_window("main").unwrap().open_devtools();
            app.remove_tray_by_id("main"); //Удаление значка по умолчанию

            let show = MenuItemBuilder::new("Show").id("show").build(app).unwrap(); //Создать кнопки
            let exit = MenuItemBuilder::new("Exit").id("exit").build(app).unwrap();

            let menu = MenuBuilder::new(app)
                .items(&[&show, &exit]) //Добавить кнопки в меню
                .build()
                .unwrap();

            let _ = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false) //По умолчанию в Tauri v2 меню открывается при нажатии на любую кнопку мыши
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        let window = app.get_webview_window("main").unwrap();
                        window.show().unwrap(); //Отобразить при лкм
                        window.unminimize().unwrap(); //Развернуть при лкм
                        window.set_focus().unwrap(); //Установить фокус на окне
                    }
                    "exit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(webview_window) = app.get_webview_window("main") {
                            let _ = webview_window.show();
                            let _ = webview_window.unminimize();
                            let _ = webview_window.set_focus();
                        }
                    }
                })
                .build(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![hash_password, verify_password,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
