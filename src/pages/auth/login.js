import { authService } from '../../services/auth.js';
import { dataService } from '../../services/data-service.js';

class LoginPage {
  constructor() {
    this.init();
  }

  async init() {
    // Verificar si ya está autenticado
    if (authService.isAuthenticated()) {
      authService.redirectToDashboard();
      return;
    }

    this.setupEventListeners();
    await this.loadCentros();
  }

  setupEventListeners() {
    // Formulario de login
    const loginForm = document.getElementById('loginFormElement');
    loginForm.addEventListener('submit', (e) => this.handleLogin(e));

    // Formulario de registro
    const registerForm = document.getElementById('registerFormElement');
    registerForm.addEventListener('submit', (e) => this.handleRegister(e));
  }

  async loadCentros() {
    try {
      const result = await dataService.getCentros();
      if (result.success) {
        const select = document.getElementById('registerCentro');
        result.data.forEach(centro => {
          const option = document.createElement('option');
          option.value = centro.id;
          option.textContent = centro.nombre;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error cargando centros:', error);
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');

    try {
      const result = await authService.signIn(email, password);
      
      if (result.success) {
        messageDiv.innerHTML = '<div class="success-message">Iniciando sesión...</div>';
        setTimeout(() => {
          authService.redirectToDashboard();
        }, 1000);
      } else {
        messageDiv.innerHTML = `<div class="error-message">${result.error}</div>`;
      }
    } catch (error) {
      messageDiv.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const nombre = document.getElementById('registerNombre').value;
    const nombreCorto = document.getElementById('registerNombreCorto').value;
    const centroId = document.getElementById('registerCentro').value;
    const rol = document.getElementById('registerRol').value;
    const messageDiv = document.getElementById('registerMessage');

    try {
      const result = await authService.signUp(email, password, nombre, nombreCorto, centroId, rol);
      
      if (result.success) {
        messageDiv.innerHTML = '<div class="success-message">Registro exitoso. Revisa tu email para confirmar tu cuenta.</div>';
        // Limpiar formulario
        document.getElementById('registerFormElement').reset();
      } else {
        messageDiv.innerHTML = `<div class="error-message">${result.error}</div>`;
      }
    } catch (error) {
      messageDiv.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
  }
}

// Función global para alternar formularios
window.toggleForms = function() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  loginForm.classList.toggle('hidden');
  registerForm.classList.toggle('hidden');
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new LoginPage();
});