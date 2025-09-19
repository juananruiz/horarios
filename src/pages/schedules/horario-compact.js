/**
 * Convierte nombres de grupos reemplazando ordinales por números
 * y abreviando el resto de palabras a 3 letras
 */
function formatGroupName(groupName) {
    if (!groupName) return '';
    
    // Reemplazar ordinales por números
    const replacements = {
        'Primero': '1',
        'Segundo': '2',
        'Tercero': '3',
        'Cuarto': '4',
        'Quinto': '5',
        'Sexto': '6'
    };
    
    // Primero intentar encontrar y reemplazar ordinales
    for (const [ordinal, numero] of Object.entries(replacements)) {
        const regex = new RegExp(`^${ordinal}\\b`, 'i');
        if (regex.test(groupName)) {
            const afterOrdinal = groupName.replace(regex, '').trim();
            if (afterOrdinal.length > 0) {
                if (afterOrdinal.length === 1 && /[A-Za-z]/.test(afterOrdinal)) {
                    return `${numero}${afterOrdinal}`;
                } else {
                    return `${numero}${afterOrdinal.substring(0, 3)}`;
                }
            } else {
                return numero;
            }
        }
    }
    
    // Si no es un grupo con ordinal, abreviar a 3 letras
    return groupName
        .split(' ')
        .map(word => word.substring(0, 3))
        .join('');
}

// Datos de prueba
const mockTeachers = [
    { id: 'MAR', name: 'María García', email: 'maria@centro.edu' },
    { id: 'JUA', name: 'Juan Pérez', email: 'juan@centro.edu' },
    { id: 'ANA', name: 'Ana López', email: 'ana@centro.edu' },
    { id: 'CAR', name: 'Carlos Ruiz', email: 'carlos@centro.edu' }
];

const mockGroups = [
    { id: '1A', name: 'Primero A' },
    { id: '1B', name: 'Primero B' },
    { id: '2A', name: 'Segundo A' },
    { id: '3A', name: 'Tercero A' }
];

const mockSubjects = [
    { id: 'MAT', name: 'Matemáticas' },
    { id: 'LEN', name: 'Lengua' },
    { id: 'CN', name: 'Ciencias Naturales' },
    { id: 'EF', name: 'Educación Física' }
];

const mockSchedules = [
    {
        teacher_id: 'MAR',
        group_id: '1A',
        subject_id: 'MAT',
        day: 'Lunes',
        start_time: '09:00',
        end_time: '10:00'
    },
    {
        teacher_id: 'JUA',
        group_id: '2A',
        subject_id: 'LEN',
        day: 'Lunes',
        start_time: '09:00',
        end_time: '10:00'
    },
    {
        teacher_id: 'ANA',
        group_id: '1B',
        subject_id: 'CN',
        day: 'Lunes',
        start_time: '10:00',
        end_time: '11:00'
    },
    {
        teacher_id: 'CAR',
        group_id: '3A',
        subject_id: 'EF',
        day: 'Martes',
        start_time: '09:00',
        end_time: '10:00'
    },
    {
        teacher_id: 'MAR',
        group_id: '2A',
        subject_id: 'MAT',
        day: 'Martes',
        start_time: '10:00',
        end_time: '11:00'
    },
    {
        teacher_id: 'JUA',
        group_id: '1A',
        subject_id: 'LEN',
        day: 'Miércoles',
        start_time: '09:00',
        end_time: '10:00'
    }
];

/**
 * Inicializa la página de horario compacto.
 */
function initCompactSchedulePage() {
    console.log('Inicializando página de horario compacto...');
    
    // Usar datos de prueba
    window.teachers = mockTeachers;
    window.groups = mockGroups;
    window.subjects = mockSubjects;
    window.schedules = mockSchedules;
    
    // Renderizar la vista compacta
    setTimeout(() => {
        renderCompactScheduleView();
    }, 100);
    
    // Agregar event listeners para botones
    addCompactSchedulePrintListeners();
    
    console.log('Datos cargados:', {
        teachers: window.teachers.length,
        groups: window.groups.length,
        subjects: window.subjects.length,
        schedules: window.schedules.length
    });
}

/**
 * Renderiza la vista de horario compacto como tabla unificada para impresión
 */
function renderCompactScheduleView() {
    const container = document.getElementById('compactScheduleContainer');
    if (!container) {
        console.error('No se encontró el contenedor del horario compacto');
        return;
    }
    
    console.log('Renderizando vista compacta...');
    container.innerHTML = '';

    const teachers = window.teachers || [];
    const schedules = window.schedules || [];
    
    console.log('Datos para renderizar:', { teachers: teachers.length, schedules: schedules.length });

    // Ordenar profesores por ID
    teachers.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

    // Establecer variable CSS para número de profesores
    document.documentElement.style.setProperty('--teacher-count', teachers.length);

    // Crear tabla principal
    const table = document.createElement('table');
    table.className = 'compact-schedule-table';

    // Crear encabezado
    const thead = document.createElement('thead');

    // Fila para los IDs de los profesores
    const idRow = document.createElement('tr');
    const idHeaderCell = document.createElement('th');
    idHeaderCell.className = 'compact-day-header';
    idHeaderCell.textContent = 'PROF';
    idRow.appendChild(idHeaderCell);

    teachers.forEach(teacher => {
        const idCell = document.createElement('th');
        idCell.className = 'compact-teacher-id';
        idCell.textContent = teacher.id || '';
        idRow.appendChild(idCell);
    });

    // Fila para los nombres de los profesores
    const nameRow = document.createElement('tr');
    const nameHeaderCell = document.createElement('th');
    nameHeaderCell.className = 'compact-day-header';
    nameHeaderCell.textContent = 'NOMBRE';
    nameRow.appendChild(nameHeaderCell);

    teachers.forEach(teacher => {
        const nameCell = document.createElement('th');
        nameCell.className = 'compact-teacher-name';
        nameCell.textContent = getInitials(teacher.name || '');
        nameRow.appendChild(nameCell);
    });

    thead.appendChild(idRow);
    thead.appendChild(nameRow);
    table.appendChild(thead);

    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    
    const timeSlots = [
        '09:00-10:00',
        '10:00-11:00',
        '11:00-11:30',
        '11:30-12:30',
        '12:30-13:30'
    ];
    
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    days.forEach(day => {
        timeSlots.forEach(timeSlot => {
            const row = document.createElement('tr');
            
            // Celda de tiempo
            const timeCell = document.createElement('td');
            timeCell.className = 'compact-time-cell';
            timeCell.textContent = `${day.substring(0, 3)} ${timeSlot}`;
            row.appendChild(timeCell);

            // Celdas para cada profesor
            teachers.forEach(teacher => {
                const cell = document.createElement('td');
                cell.className = 'compact-schedule-cell';
                
                // Buscar eventos para este profesor y horario
                const [startTime] = timeSlot.split('-');
                const events = schedules.filter(schedule => 
                    schedule.teacher_id === teacher.id &&
                    schedule.day === day &&
                    schedule.start_time === startTime
                );
                
                console.log(`Buscando eventos para ${teacher.id} en ${day} ${startTime}:`, events);
                
                if (events.length === 0) {
                    if (timeSlot === '11:00-11:30') {
                        cell.classList.add('recreo');
                        cell.innerHTML = '<span class="subject-info">RECREO</span>';
                    } else {
                        cell.classList.add('empty');
                    }
                } else if (events.length === 1) {
                    const event = events[0];
                    cell.classList.add('occupied');
                    
                    const subject = window.subjects.find(s => s.id === event.subject_id);
                    const group = window.groups.find(g => g.id === event.group_id);
                    
                    cell.innerHTML = `
                        <span class="subject-info">${getSubjectInitials(subject?.name || '')}</span>
                        <span class="group-info">${formatGroupName(group?.name || '')}</span>
                    `;
                } else {
                    cell.classList.add('multiple-subjects');
                    cell.innerHTML = '<span class="subject-info">MÚLT</span>';
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
    
    console.log('Vista compacta renderizada correctamente');
}

/**
 * Obtiene las iniciales de un nombre completo
 */
function getInitials(fullName) {
    if (!fullName) return '';
    return fullName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 3);
}

/**
 * Obtiene las iniciales de una asignatura
 */
function getSubjectInitials(subjectName) {
    if (!subjectName) return '';
    
    // Casos especiales
    const specialCases = {
        'Matemáticas': 'MAT',
        'Lengua Castellana': 'LEN',
        'Lengua': 'LEN',
        'Ciencias Naturales': 'CN',
        'Ciencias Sociales': 'CS',
        'Educación Física': 'EF',
        'Educación Artística': 'EA',
        'Inglés': 'ING',
        'Francés': 'FR',
        'Religión': 'REL',
        'Valores': 'VAL'
    };
    
    if (specialCases[subjectName]) {
        return specialCases[subjectName];
    }
    
    // Para otros casos, tomar las primeras letras
    return subjectName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 3);
}

/**
 * Configura los event listeners para impresión
 */
function addCompactSchedulePrintListeners() {
    const printBtn = document.getElementById('printBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('Funcionalidad de exportación PDF en desarrollo');
        });
    }
}

// Hacer la función disponible globalmente
window.initCompactSchedulePage = initCompactSchedulePage;
