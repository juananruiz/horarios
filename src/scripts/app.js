import { authService, requireAuth } from '../services/auth.js';
import { getCurrentConfig } from '../config/app-config.js';

class App {
  constructor() {
    this.config = getCurrentConfig();
    this.currentPage = 'dashboard';
    this.init();
  }

  async init() {
    // Verificar autenticación
    if (!requireAuth()) {
      return;
    }

    // Inicializar la interfaz
    this.initUI();
    
    // Cargar datos iniciales
    await this.loadInitialData();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    console.log('App inicializada correctamente');
  }

  initUI() {
    // Mostrar información del usuario
    this.updateUserInfo();
    
    // Configurar navegación
    this.setupNavigation();
    
    // Mostrar/ocultar elementos según permisos
    this.setupPermissions();
  }

  updateUserInfo() {
    const user = authService.getCurrentUser();
    const centro = authService.getCurrentCentro();
    
    if (user) {
      document.getElementById('currentUser').textContent = user.nombre;
    }
    
    if (centro) {
      document.getElementById('currentCentro').textContent = centro.nombre;
    }
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  setupPermissions() {
    // Mostrar card de administración solo para admins
    if (authService.hasPermission('admin')) {
      const adminCard = document.getElementById('adminCard');
      if (adminCard) {
        adminCard.style.display = 'block';
      }
    }
  }

  navigateTo(page) {
    // Ocultar todas las páginas
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });
    
    // Remover clase active de todos los nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Mostrar página seleccionada
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
    }
    
    // Activar nav link correspondiente
    const activeLink = document.querySelector(`[data-page="${page}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
    
    this.currentPage = page;
  }

  async loadInitialData() {
    try {
      // Aquí cargaremos datos iniciales según sea necesario
      console.log('Cargando datos iniciales...');
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }

  setupEventListeners() {
    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const result = await authService.signOut();
        if (result.success) {
          authService.redirectToLogin();
        }
      });
    }
  }
}

// Funciones globales para el dashboard
window.showCentrosManagement = function() {
  if (!authService.hasPermission('admin')) {
    alert('No tienes permisos para gestionar centros');
    return;
  }
  // TODO: Implementar gestión de centros
  console.log('Gestión de centros - TODO');
};

window.showUsersManagement = function() {
  if (!authService.hasPermission('admin')) {
    alert('No tienes permisos para gestionar usuarios');
    return;
  }
  // TODO: Implementar gestión de usuarios
  console.log('Gestión de usuarios - TODO');
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new App();
});