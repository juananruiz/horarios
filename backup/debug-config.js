// Configuración de depuración para el sistema de horarios
// Cambia DEBUG_MODE a false para ocultar todos los console.log en producción
const DEBUG_MODE = false;

// Función para logs condicionales
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// Función para logs importantes (migraciones, errores críticos)
function infoLog(...args) {
    console.log(...args);
}

// Función para logs de operaciones importantes del usuario
function operationLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}
