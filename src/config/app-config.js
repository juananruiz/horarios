// Configuración general de la aplicación
export const APP_CONFIG = {
  // Información de la aplicación
  name: 'Gestor de Horarios',
  version: '2.0.0',
  description: 'Gestor de horarios para centros de primaria - Multiusuario y multicentro',
  
  // Configuración de horarios
  schedule: {
    daysOfWeek: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    timeSlots: [
      '09:00', '10:00', '11:00', '11:30', '12:30', '13:30', '14:30'
    ],
    breakTime: '11:00-11:30', // Recreo
    maxHoursPerDay: 7,
    maxHoursPerWeek: 25
  },
  
  // Configuración de roles y permisos
  roles: {
    admin: {
      name: 'Administrador',
      permissions: ['all']
    },
    director: {
      name: 'Director',
      permissions: ['manage_center', 'view_all_schedules', 'manage_teachers', 'manage_groups']
    },
    profesor: {
      name: 'Profesor',
      permissions: ['view_own_schedule', 'view_center_schedules']
    }
  },
  
  // Configuración de la interfaz
  ui: {
    theme: 'light',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  },
  
  // Configuración de exportación
  export: {
    formats: ['pdf', 'excel', 'json'],
    defaultFormat: 'pdf'
  },
  
  // Configuración de validación
  validation: {
    minPasswordLength: 6,
    maxNameLength: 100,
    maxGroupsPerTeacher: 10
  }
};

// Configuración de desarrollo/producción
export const ENV_CONFIG = {
  development: {
    debug: true,
    logLevel: 'debug',
    apiTimeout: 10000
  },
  production: {
    debug: false,
    logLevel: 'error',
    apiTimeout: 5000
  }
};

// Obtener configuración actual basada en el entorno
export function getCurrentConfig() {
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  return {
    ...APP_CONFIG,
    env: isDevelopment ? ENV_CONFIG.development : ENV_CONFIG.production
  };
}