// =========================================================================
// CONFIGURACIÓN DE CREDENCIALES DE SUPABASE
// =========================================================================
// Puedes definir tus credenciales fijas aquí abajo para que la aplicación
// las cargue de forma automática, o dejarlas vacías y configurarlas
// directamente desde la pestaña "Configuración" en la propia aplicación web
// (las cuales se guardan de forma segura en el almacenamiento local de tu navegador).

const SUPABASE_CONFIG = {
  // Pegar aquí la URL de tu proyecto Supabase (ej: "https://xyz.supabase.co")
  url: window.localStorage.getItem('supabase_url') || "",

  // Pegar aquí la Anon Key pública (la que dice 'public / anon')
  anonKey: window.localStorage.getItem('supabase_anon_key') || ""
};
