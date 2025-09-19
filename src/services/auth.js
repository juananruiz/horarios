import { supabase } from '../config/supabase-config.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentCentro = null;
    this.init();
  }

  async init() {
    // Verificar si hay una sesión activa
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await this.setCurrentUser(session.user);
    }

    // Escuchar cambios en la autenticación
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await this.setCurrentUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentCentro = null;
        this.redirectToLogin();
      }
    });
  }

  async setCurrentUser(user) {
    // Obtener información completa del usuario
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        centros (
          id,
          nombre,
          codigo
        )
      `)
      .eq('id', user.id)
      .single();

    if (!error && userData) {
      this.currentUser = userData;
      this.currentCentro = userData.centros;
    }
  }

  // Registro de nuevo usuario
  async signUp(email, password, nombre, nombreCorto, centroId, rol = 'profesor') {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Crear registro en la tabla usuarios
        const { error: userError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email,
            nombre,
            nombre_corto: nombreCorto,
            centro_id: centroId,
            rol
          });

        if (userError) throw userError;
      }

      return { success: true, user: authData.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Iniciar sesión
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      this.currentUser = null;
      this.currentCentro = null;
    }
    return { success: !error, error: error?.message };
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Obtener usuario actual
  getCurrentUser() {
    return this.currentUser;
  }

  // Obtener centro actual
  getCurrentCentro() {
    return this.currentCentro;
  }

  // Verificar permisos
  hasPermission(action) {
    if (!this.currentUser) return false;

    const { rol } = this.currentUser;
    
    switch (action) {
      case 'admin':
        return rol === 'admin';
      case 'director':
        return ['admin', 'director'].includes(rol);
      case 'profesor':
        return ['admin', 'director', 'profesor'].includes(rol);
      default:
        return false;
    }
  }

  // Redirigir al login
  redirectToLogin() {
    if (window.location.pathname !== '/src/pages/auth/login.html') {
      window.location.href = '/src/pages/auth/login.html';
    }
  }

  // Redirigir al dashboard
  redirectToDashboard() {
    window.location.href = '/index.html';
  }
}

// Instancia global del servicio de autenticación
export const authService = new AuthService();

// Middleware para proteger páginas
export function requireAuth() {
  if (!authService.isAuthenticated()) {
    authService.redirectToLogin();
    return false;
  }
  return true;
}

// Middleware para verificar permisos
export function requirePermission(permission) {
  if (!requireAuth()) return false;
  
  if (!authService.hasPermission(permission)) {
    alert('No tienes permisos para acceder a esta funcionalidad');
    return false;
  }
  return true;
}