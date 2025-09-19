import { authService, requireAuth } from '../../services/auth.js';
import { dataService } from '../../services/data-service.js';

// Variable para gestionar la celda que se está editando en la vista completa
let currentFullScheduleEditingCell = null;

/**
 * Inicializa la página de horario completo.
 */
async function initFullSchedulePage() {
    // Verificar autenticación
    if (!requireAuth()) {
        return;
    }

    try {
        // Inicializar datos de la aplicación
        await window.initializeAppData();
        
        // Añadir estilos y renderizar
        addFullScheduleStyles();
        renderFullScheduleView();
        addFullScheduleEventListeners();
        
        console.log('Página de horario completo inicializada');
    } catch (error) {
        console.error('Error inicializando página de horario completo:', error);
        window.showNotification('Error cargando la página', 'error');
    }
}

/**
 * Añade estilos CSS para la vista de horario completo basada en divs
 */
function addFullScheduleStyles() {
    const existingStyle = document.getElementById('fullScheduleStyles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'fullScheduleStyles';
    style.textContent = `
        /* Estilos para la vista de horario completo */
        .full-schedule-container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-top: 1.5rem;
        }
        
        .full-schedule-grid {
            display: grid;
            grid-template-columns: 80px repeat(var(--teacher-count), 1fr);
            min-width: 100%;
            overflow-x: auto;
        }
        
        .time-header {
            background: var(--secondary-color, #2c3e50);
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: 600;
            border-right: 1px solid #ddd;
            border-bottom: 2px solid #ddd;
            position: sticky;
            left: 0;
            z-index: 2;
        }
        
        .teacher-header {
            background: var(--primary-color, #3498db);
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: 600;
            border-right: 1px solid #ddd;
            border-bottom: 2px solid #ddd;
            font-size: 12px;
        }
        
        .time-cell {
            background: var(--secondary-color, #2c3e50);
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: 500;
            border-right: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            position: sticky;
            left: 0;
            z-index: 1;
            font-size: 11px;
        }
        
        .schedule-cell {
            min-height: 40px;
            border-right: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            cursor: pointer;
            transition: background-color 0.2s;
            position: relative;
            padding: 2px;
        }
        
        .schedule-cell:hover {
            background-color: #f8f9fa;
        }
        
        .schedule-item {
            background: var(--primary-color, #3498db);
            color: white;
            padding: 2px 4px;
            margin: 1px;
            border-radius: 3px;
            font-size: 10px;
            line-height: 1.2;
            text-align: center;
            word-wrap: break-word;
            overflow: hidden;
        }
        
        .schedule-item.multiple {
            background: var(--warning-color, #f39c12);
        }
        
        /* Colores por asignatura */
        .subject-color--cono { background-color: #e74c3c !important; }
        .subject-color--ingles { background-color: #9b59b6 !important; }
        .subject-color--frances { background-color: #8e44ad !important; }
        .subject-color--musica { background-color: #f39c12 !important; }
        .subject-color--plastica { background-color: #e67e22 !important; }
        .subject-color--religion { background-color: #95a5a6 !important; }
        .subject-color--mates-lengua { background-color: #3498db !important; }
        .subject-color--ed-fisica { background-color: #27ae60 !important; }
        .subject-color--refuerzo { background-color: #34495e !important; }
        .subject-color--at-edu { background-color: #16a085 !important; }
        .subject-color--coord-admin { background-color: #2c3e50 !important; }
        
        .teaching-load {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
        }
        
        /* Modal para selección de asignaturas */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 500px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        }
        
        .close {
            color: #aaa;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .close:hover {
            color: #000;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .form-group select,
        .form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        
        .btn-primary {
            background: var(--primary-color, #3498db);
            color: white;
        }
        
        .btn-primary:hover {
            background: #2980b9;
        }
        
        .btn-danger {
            background: var(--danger-color, #e74c3c);
            color: white;
        }
        
        .btn-danger:hover {
            background: #c0392b;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #545b62;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .full-schedule-grid {
                font-size: 10px;
            }
            
            .teacher-header,
            .time-cell {
                padding: 4px;
            }
            
            .schedule-item {
                font-size: 8px;
                padding: 1px 2px;
            }
            
            .modal-content {
                width: 95%;
                margin: 10% auto;
            }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Añade event listeners para la vista de horario completo
 */
function addFullScheduleEventListeners() {
    // Event listener para cerrar modal con Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeFullScheduleModal();
        }
    });

    // Event listener para cerrar modal haciendo clic fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('fullScheduleModal');
        if (event.target === modal) {
            closeFullScheduleModal();
        }
    });
}

/**
 * Renderiza la vista de horario completo
 */
function renderFullScheduleView() {
    const container = document.getElementById('fullScheduleContainer');
    if (!container) {
        console.error('Contenedor de horario completo no encontrado');
        return;
    }

    // Obtener profesores únicos de todos los horarios
    const allTeachers = new Set();
    Object.values(window.schedules).forEach(groupSchedule => {
        Object.values(groupSchedule).forEach(daySchedule => {
            Object.values(daySchedule).forEach(timeSlots => {
                timeSlots.forEach(item => {
                    if (item.teacher) {
                        allTeachers.add(item.teacher);
                    }
                });
            });
        });
    });

    const teacherList = Array.from(allTeachers).sort();
    
    // Establecer variable CSS para el número de profesores
    document.documentElement.style.setProperty('--teacher-count', teacherList.length);

    let html = '<div class="full-schedule-container"><div class="full-schedule-grid">';
    
    // Header con nombres de profesores
    html += '<div class="time-header">Hora</div>';
    teacherList.forEach(teacher => {
        const teacherObj = window.teachers.find(t => t.name === teacher);
        const displayName = teacherObj ? teacherObj.id : teacher.substring(0, 8);
        html += `<div class="teacher-header" title="${teacher}">${displayName}</div>`;
    });

    // Filas de tiempo
    window.timeIntervals.forEach(time => {
        html += `<div class="time-cell">${time}</div>`;
        
        teacherList.forEach(teacher => {
            const cellData = getTeacherScheduleForTime(teacher, time);
            const cellId = `cell-${teacher.replace(/\s+/g, '_')}-${time}`;
            
            html += `<div class="schedule-cell" 
                        id="${cellId}" 
                        onclick="openFullScheduleModal(this, '${teacher}', '', '${time}')"
                        data-teacher="${teacher}" 
                        data-time="${time}">`;
            
            if (cellData.length > 0) {
                cellData.forEach(item => {
                    const subjectClass = window.getSubjectClass(item.subject);
                    const displayText = item.group ? `${item.group}` : item.subject;
                    html += `<div class="schedule-item ${subjectClass}" title="${item.subject} - ${item.group}">${displayText}</div>`;
                });
            }
            
            html += '</div>';
        });
    });

    html += '</div></div>';
    
    // Añadir información de carga lectiva
    html += '<div class="teaching-load-summary">';
    teacherList.forEach(teacher => {
        const load = calculateTeachingLoadForTeacher(teacher);
        html += `<div class="teaching-load"><strong>${teacher}:</strong> ${load} horas/semana</div>`;
    });
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Obtiene el horario de un profesor para una hora específica
 */
function getTeacherScheduleForTime(teacher, time) {
    const result = [];
    
    Object.keys(window.schedules).forEach(groupName => {
        window.days.forEach(day => {
            const daySchedule = window.schedules[groupName][day];
            if (daySchedule && daySchedule[time]) {
                daySchedule[time].forEach(item => {
                    if (item.teacher === teacher) {
                        result.push({
                            ...item,
                            group: groupName,
                            day: day
                        });
                    }
                });
            }
        });
    });
    
    return result;
}

/**
 * Calcula la carga lectiva de un profesor
 */
function calculateTeachingLoadForTeacher(teacherName) {
    let totalHours = 0;
    
    Object.values(window.schedules).forEach(groupSchedule => {
        Object.values(groupSchedule).forEach(daySchedule => {
            Object.values(daySchedule).forEach(timeSlots => {
                timeSlots.forEach(item => {
                    if (item.teacher === teacherName) {
                        totalHours += item.duration || 1;
                    }
                });
            });
        });
    });
    
    return totalHours;
}

/**
 * Abre el modal para editar horario completo
 */
function openFullScheduleModal(element, teacherName, day, time) {
    // Obtener todos los elementos para este profesor y hora
    const items = getTeacherScheduleForTime(teacherName, time);
    
    if (items.length === 0) {
        // No hay elementos, mostrar selector de asignaturas
        showFullScheduleItemSelector(element, teacherName, day, time, []);
    } else if (items.length === 1) {
        // Un elemento, editar directamente
        showFullScheduleItemSelector(element, teacherName, day, time, items);
    } else {
        // Múltiples elementos, mostrar lista para seleccionar
        showFullScheduleItemSelector(element, teacherName, day, time, items);
    }
}

/**
 * Muestra el selector de elementos para el horario completo
 */
function showFullScheduleItemSelector(element, teacherName, day, time, items) {
    currentFullScheduleEditingCell = {
        element: element,
        teacher: teacherName,
        day: day,
        time: time,
        items: items
    };

    // Crear modal si no existe
    let modal = document.getElementById('fullScheduleModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fullScheduleModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    let modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Horario - ${teacherName} (${time})</h3>
                <span class="close" onclick="closeFullScheduleModal()">&times;</span>
            </div>
    `;

    if (items.length === 0) {
        // Nuevo elemento
        modalContent += `
            <div class="form-group">
                <label for="fullScheduleGroupSelect">Grupo:</label>
                <select id="fullScheduleGroupSelect">
                    <option value="">Seleccionar grupo...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="fullScheduleSubjectSelect">Asignatura:</label>
                <select id="fullScheduleSubjectSelect">
                    <option value="">Seleccionar asignatura...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="fullScheduleDuration">Duración (horas):</label>
                <input type="number" id="fullScheduleDuration" value="1" min="0.25" max="4" step="0.25">
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="assignSubjectForFullSchedule()">Asignar</button>
                <button class="btn btn-secondary" onclick="closeFullScheduleModal()">Cancelar</button>
            </div>
        `;
    } else {
        // Elementos existentes
        modalContent += '<div class="existing-items">';
        items.forEach((item, index) => {
            modalContent += `
                <div class="item-row" style="padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; border-radius: 4px;">
                    <strong>${item.group}</strong> - ${item.subject}
                    <div style="margin-top: 5px;">
                        <button class="btn btn-danger" onclick="removeSubjectForFullSchedule(${index})">Eliminar</button>
                    </div>
                </div>
            `;
        });
        modalContent += '</div>';
        
        modalContent += `
            <hr>
            <h4>Añadir nueva asignatura</h4>
            <div class="form-group">
                <label for="fullScheduleGroupSelect">Grupo:</label>
                <select id="fullScheduleGroupSelect">
                    <option value="">Seleccionar grupo...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="fullScheduleSubjectSelect">Asignatura:</label>
                <select id="fullScheduleSubjectSelect">
                    <option value="">Seleccionar asignatura...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="fullScheduleDuration">Duración (horas):</label>
                <input type="number" id="fullScheduleDuration" value="1" min="0.25" max="4" step="0.25">
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="assignSubjectForFullSchedule()">Añadir</button>
                <button class="btn btn-secondary" onclick="closeFullScheduleModal()">Cerrar</button>
            </div>
        `;
    }

    modalContent += '</div>';
    modal.innerHTML = modalContent;
    modal.style.display = 'block';

    // Poblar selectores
    populateGroupSelectForFullSchedule();
    populateSubjectSelectForFullSchedule();
}

/**
 * Pobla el selector de grupos
 */
function populateGroupSelectForFullSchedule() {
    const select = document.getElementById('fullScheduleGroupSelect');
    if (!select) return;

    Object.keys(window.groups).forEach(groupName => {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        select.appendChild(option);
    });

    // Event listener para actualizar asignaturas cuando cambie el grupo
    select.addEventListener('change', populateSubjectSelectForFullSchedule);
}

/**
 * Pobla el selector de asignaturas basado en el grupo seleccionado
 */
function populateSubjectSelectForFullSchedule() {
    const groupSelect = document.getElementById('fullScheduleGroupSelect');
    const subjectSelect = document.getElementById('fullScheduleSubjectSelect');
    
    if (!groupSelect || !subjectSelect) return;

    // Limpiar opciones existentes
    subjectSelect.innerHTML = '<option value="">Seleccionar asignatura...</option>';

    const selectedGroup = groupSelect.value;
    if (selectedGroup && window.groups[selectedGroup]) {
        const subjects = window.groups[selectedGroup].asignaturas || {};
        Object.keys(subjects).forEach(subjectName => {
            const option = document.createElement('option');
            option.value = subjectName;
            option.textContent = subjectName;
            subjectSelect.appendChild(option);
        });
    }
}

/**
 * Asigna una asignatura en el horario completo
 */
async function assignSubjectForFullSchedule() {
    const groupName = document.getElementById('fullScheduleGroupSelect').value;
    const subject = document.getElementById('fullScheduleSubjectSelect').value;
    const duration = parseFloat(document.getElementById('fullScheduleDuration').value) || 1;

    if (!groupName || !subject) {
        window.showNotification('Por favor selecciona grupo y asignatura', 'warning');
        return;
    }

    const { teacher, time } = currentFullScheduleEditingCell;

    try {
        // Buscar el día correspondiente para este profesor y hora
        let targetDay = null;
        window.days.forEach(day => {
            const daySchedule = window.schedules[groupName][day];
            if (daySchedule && daySchedule[time]) {
                const existingItems = daySchedule[time].filter(item => item.teacher === teacher);
                if (existingItems.length === 0) {
                    targetDay = day;
                }
            }
        });

        // Si no se encuentra un día específico, usar el primer día disponible
        if (!targetDay) {
            targetDay = window.days[0];
        }

        // Crear el nuevo elemento
        const newItem = {
            id: window.generateUniqueId(),
            subject: subject,
            teacher: teacher,
            duration: duration
        };

        // Asegurar que existe la estructura del horario
        if (!window.schedules[groupName]) {
            window.schedules[groupName] = {};
        }
        if (!window.schedules[groupName][targetDay]) {
            window.schedules[groupName][targetDay] = {};
        }
        if (!window.schedules[groupName][targetDay][time]) {
            window.schedules[groupName][targetDay][time] = [];
        }

        // Añadir el elemento al horario
        window.schedules[groupName][targetDay][time].push(newItem);

        // Guardar en Supabase
        await window.saveScheduleToSupabase(groupName, targetDay, time, newItem);

        // Actualizar la vista
        renderFullScheduleView();
        closeFullScheduleModal();

        window.showNotification('Asignatura asignada correctamente', 'success');

    } catch (error) {
        console.error('Error asignando asignatura:', error);
        window.showNotification('Error asignando asignatura: ' + error.message, 'error');
    }
}

/**
 * Elimina una asignatura del horario completo
 */
async function removeSubjectForFullSchedule(itemIndex) {
    if (!currentFullScheduleEditingCell || !currentFullScheduleEditingCell.items) {
        return;
    }

    const item = currentFullScheduleEditingCell.items[itemIndex];
    if (!item) {
        return;
    }

    try {
        // Encontrar y eliminar el elemento del horario local
        const groupName = item.group;
        const day = item.day;
        const time = currentFullScheduleEditingCell.time;

        if (window.schedules[groupName] && 
            window.schedules[groupName][day] && 
            window.schedules[groupName][day][time]) {
            
            const timeSlots = window.schedules[groupName][day][time];
            const elementIndex = timeSlots.findIndex(slot => 
                slot.subject === item.subject && 
                slot.teacher === item.teacher
            );

            if (elementIndex !== -1) {
                const removedItem = timeSlots.splice(elementIndex, 1)[0];
                
                // Eliminar de Supabase si tiene ID
                if (removedItem.id) {
                    await window.deleteScheduleFromSupabase(removedItem.id);
                }
            }
        }

        // Actualizar la vista
        renderFullScheduleView();
        closeFullScheduleModal();

        window.showNotification('Asignatura eliminada correctamente', 'success');

    } catch (error) {
        console.error('Error eliminando asignatura:', error);
        window.showNotification('Error eliminando asignatura: ' + error.message, 'error');
    }
}

/**
 * Cierra el modal del horario completo
 */
function closeFullScheduleModal() {
    const modal = document.getElementById('fullScheduleModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentFullScheduleEditingCell = null;
}

// Exportar funciones para uso global
window.initFullSchedulePage = initFullSchedulePage;
window.openFullScheduleModal = openFullScheduleModal;
window.assignSubjectForFullSchedule = assignSubjectForFullSchedule;
window.removeSubjectForFullSchedule = removeSubjectForFullSchedule;
window.closeFullScheduleModal = closeFullScheduleModal;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initFullSchedulePage);

// Mock data para pruebas
const mockData = {
    teachers: [
        { id: 'MAR', name: 'María García' },
        { id: 'JUA', name: 'Juan Pérez' },
        { id: 'ANA', name: 'Ana López' },
        { id: 'CAR', name: 'Carlos Ruiz' },
        { id: 'LUI', name: 'Luis Martín' },
        { id: 'SOF', name: 'Sofía Hernández' }
    ],
    groups: [
        { id: '1A', name: 'Primero A' },
        { id: '1B', name: 'Primero B' },
        { id: '2A', name: 'Segundo A' },
        { id: '2B', name: 'Segundo B' },
        { id: '3A', name: 'Tercero A' },
        { id: '3B', name: 'Tercero B' }
    ],
    subjects: [
        { id: 'MAT', name: 'Matemáticas' },
        { id: 'LEN', name: 'Lengua' },
        { id: 'CN', name: 'Ciencias Naturales' },
        { id: 'EF', name: 'Educación Física' },
        { id: 'ING', name: 'Inglés' },
        { id: 'HIS', name: 'Historia' }
    ],
    schedules: [
        // Lunes
        { teacher_id: 'MAR', group_id: '1A', subject_id: 'MAT', day: 'Lunes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'JUA', group_id: '2A', subject_id: 'LEN', day: 'Lunes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'ANA', group_id: '1B', subject_id: 'CN', day: 'Lunes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'CAR', group_id: '3A', subject_id: 'EF', day: 'Lunes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'LUI', group_id: '2B', subject_id: 'ING', day: 'Lunes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'SOF', group_id: '3B', subject_id: 'HIS', day: 'Lunes', start_time: '09:00', end_time: '10:00' },
        
        { teacher_id: 'MAR', group_id: '2A', subject_id: 'MAT', day: 'Lunes', start_time: '10:00', end_time: '11:00' },
        { teacher_id: 'JUA', group_id: '1A', subject_id: 'LEN', day: 'Lunes', start_time: '10:00', end_time: '11:00' },
        { teacher_id: 'ANA', group_id: '3A', subject_id: 'CN', day: 'Lunes', start_time: '10:00', end_time: '11:00' },
        { teacher_id: 'CAR', group_id: '1B', subject_id: 'EF', day: 'Lunes', start_time: '10:00', end_time: '11:00' },
        
        // Martes
        { teacher_id: 'MAR', group_id: '1B', subject_id: 'MAT', day: 'Martes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'JUA', group_id: '3A', subject_id: 'LEN', day: 'Martes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'ANA', group_id: '2A', subject_id: 'CN', day: 'Martes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'CAR', group_id: '2B', subject_id: 'EF', day: 'Martes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'LUI', group_id: '1A', subject_id: 'ING', day: 'Martes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'SOF', group_id: '3B', subject_id: 'HIS', day: 'Martes', start_time: '09:00', end_time: '10:00' },
        
        // Miércoles
        { teacher_id: 'MAR', group_id: '3A', subject_id: 'MAT', day: 'Miércoles', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'JUA', group_id: '1B', subject_id: 'LEN', day: 'Miércoles', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'ANA', group_id: '2B', subject_id: 'CN', day: 'Miércoles', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'CAR', group_id: '1A', subject_id: 'EF', day: 'Miércoles', start_time: '09:00', end_time: '10:00' },
        
        // Jueves
        { teacher_id: 'MAR', group_id: '2B', subject_id: 'MAT', day: 'Jueves', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'JUA', group_id: '3B', subject_id: 'LEN', day: 'Jueves', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'ANA', group_id: '1A', subject_id: 'CN', day: 'Jueves', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'CAR', group_id: '3A', subject_id: 'EF', day: 'Jueves', start_time: '09:00', end_time: '10:00' },
        
        // Viernes
        { teacher_id: 'MAR', group_id: '3B', subject_id: 'MAT', day: 'Viernes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'JUA', group_id: '2B', subject_id: 'LEN', day: 'Viernes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'ANA', group_id: '3A', subject_id: 'CN', day: 'Viernes', start_time: '09:00', end_time: '10:00' },
        { teacher_id: 'LUI', group_id: '1B', subject_id: 'ING', day: 'Viernes', start_time: '09:00', end_time: '10:00' }
    ]
};

// Horarios y días de la semana
const timeSlots = [
    '09:00', '10:00', '11:00', '11:30', '12:30', '13:30'
];

const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

/**
 * Inicializa la página de horario completo
 */
function initFullSchedulePage() {
    console.log('Inicializando página de horario completo...');
    
    try {
        renderFullScheduleView();
        setupButtons();
        console.log('Página de horario completo inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando página de horario completo:', error);
    }
}

/**
 * Renderiza la vista completa del horario estilo Gmail
 */
function renderFullScheduleView() {
    const container = document.getElementById('scheduleContainer');
    if (!container) {
        console.error('No se encontró el contenedor del horario');
        return;
    }

    // Crear estructura principal estilo Gmail
    container.innerHTML = `
        <div class="gmail-schedule-wrapper">
            <!-- Header con días de la semana -->
            <div class="schedule-header">
                <div class="time-column-header">Hora</div>
                ${weekDays.map(day => `
                    <div class="day-column-header">${day}</div>
                `).join('')}
            </div>
            
            <!-- Contenido del horario -->
            <div class="schedule-content">
                ${timeSlots.map(time => `
                    <div class="time-row" data-time="${time}">
                        <div class="time-label">${time}</div>
                        ${weekDays.map(day => `
                            <div class="schedule-cell" data-day="${day}" data-time="${time}">
                                ${renderClassesForTimeAndDay(time, day)}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    console.log('Vista de horario completo renderizada');
}

/**
 * Renderiza las clases para un horario y día específicos
 */
function renderClassesForTimeAndDay(time, day) {
    const classes = mockData.schedules.filter(schedule => 
        schedule.start_time === time && schedule.day === day
    );

    if (classes.length === 0) {
        return '<div class="empty-slot">Libre</div>';
    }

    return classes.map(classItem => {
        const teacher = mockData.teachers.find(t => t.id === classItem.teacher_id);
        const group = mockData.groups.find(g => g.id === classItem.group_id);
        const subject = mockData.subjects.find(s => s.id === classItem.subject_id);

        return `
            <div class="class-card" data-teacher="${classItem.teacher_id}">
                <div class="class-subject">${subject?.name || 'Sin asignatura'}</div>
                <div class="class-group">${group?.name || 'Sin grupo'}</div>
                <div class="class-teacher">${teacher?.name || 'Sin profesor'}</div>
            </div>
        `;
    }).join('');
}

/**
 * Configura los botones de la toolbar
 */
function setupButtons() {
    const printBtn = document.getElementById('printBtn');
    const exportBtn = document.getElementById('exportBtn');
    const editBtn = document.getElementById('editBtn');

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportScheduleToCSV();
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            alert('Función de edición en desarrollo');
        });
    }
}

/**
 * Exporta el horario a CSV
 */
function exportScheduleToCSV() {
    let csvContent = 'Hora,Lunes,Martes,Miércoles,Jueves,Viernes\n';
    
    timeSlots.forEach(time => {
        let row = time;
        weekDays.forEach(day => {
            const classes = mockData.schedules.filter(schedule => 
                schedule.start_time === time && schedule.day === day
            );
            
            const classText = classes.map(classItem => {
                const teacher = mockData.teachers.find(t => t.id === classItem.teacher_id);
                const group = mockData.groups.find(g => g.id === classItem.group_id);
                const subject = mockData.subjects.find(s => s.id === classItem.subject_id);
                return `${subject?.name} - ${group?.name} (${teacher?.name})`;
            }).join('; ') || 'Libre';
            
            row += ',"' + classText + '"';
        });
        csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'horario_completo.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Exponer funciones globalmente
window.initFullSchedulePage = initFullSchedulePage;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initFullSchedulePage);
