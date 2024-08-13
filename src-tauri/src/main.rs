// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent};
use tauri::Manager;

use argon2::{password_hash::SaltString, Argon2, PasswordHasher, PasswordVerifier, PasswordHash};

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
    Ok(parsed_hash) => {
      match argon2.verify_password(password.as_bytes(), &parsed_hash) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
      }
    }
    Err(e) => Err(e.to_string()),
  }
}

fn main() {
  let show_item = CustomMenuItem::new("show", "Show"); //Создать кнопки
  let exit_item = CustomMenuItem::new("exit", "Exit");

  let tray_menu = SystemTrayMenu::new() //Добавить кнопки в меню
      .add_item(show_item)
      .add_item(exit_item);

  let system_tray = SystemTray::new().with_menu(tray_menu);

  tauri::Builder::default()
    .system_tray(system_tray)
    .on_window_event(|event| match event.event() {
      tauri::WindowEvent::CloseRequested { api, .. } => {
        event.window().hide().unwrap(); //Свернуть в трей при нажатии на крестик
        api.prevent_close();
      }
      _ => {}
    })
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::LeftClick {
        position: _,
        size: _,
        ..
      } => {
        let window = app.get_window("main").unwrap();
        window.show().unwrap(); //Отобразить при лкм
        window.unminimize().unwrap(); //Развернуть при лкм
        window.set_focus().unwrap(); //Установить фокус на окне
      }
      SystemTrayEvent::MenuItemClick { id, .. } => { //Открыть меню при пкм
        match id.as_str() {
          "exit" => {
            std::process::exit(0);
          }
          "show" => {
            let window = app.get_window("main").unwrap();
            window.show().unwrap();
            window.unminimize().unwrap();
            window.set_focus().unwrap();
          }
          _ => {}
        }
      }
      _ => {}
    })
    .invoke_handler(tauri::generate_handler![hash_password, verify_password])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// #[tauri::command]
// fn hash_password(password: &str) -> Result<String, String> {
//     // Генерация соли
//     let salt: [u8; 32] = rand::thread_rng().gen(); // Случайная соль
//     let config = Config::default();

//     // Хеширование пароля
//     match argon2::hash_encoded(password.as_bytes(), &salt, &config) {
//         Ok(hash) => Ok(hash),
//         Err(e) => Err(format!("Hashing failed: {:?}", e)),
//     }
// }

// #[tauri::command]
// fn verify_password(password: &str, hash: &str) -> Result<bool, String> {
//     match argon2::verify_encoded(hash, password.as_bytes()) {
//         Ok(valid) => Ok(valid),
//         Err(e) => Err(format!("Verification failed: {:?}", e)),
//     }
// }

// fn main() {
//     tauri::Builder::default()
//         .invoke_handler(tauri::generate_handler![hash_password, verify_password])
//         .run(tauri::generate_context!())
//         .expect("Error running Tauri application");
// }