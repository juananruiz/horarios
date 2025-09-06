// TEST PAGE - Estructura inspirada en Google Calendar
// Datos hardcodeados para testing

const timeIntervals = [
    "09:00", "09:15", "09:30", "09:45",
    "10:00", "10:15", "10:30", "10:45", 
    "11:00", "11:15", "11:30", "11:45",
    "12:00", "12:15", "12:30", "12:45",
    "13:00", "13:15", "13:30", "13:45",
    "14:00"
];

const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"]; // Solo para referencia

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Datos de prueba para Primero A
const testGroup = {
    name: "Primero A",
    tutor: "María García",
    subjects: {
        "Lengua": { teacher: "María García", hours: 6 },
        "Mates": { teacher: "María García", hours: 5 },
        "Cono": { teacher: "María García", hours: 2 },
        "Inglés": { teacher: "Ana López", hours: 2 },
        "Ed. Física": { teacher: "Carlos Ruiz", hours: 2 },
        "Música": { teacher: "Laura Martín", hours: 1 },
        "Plástica": { teacher: "María García", hours: 1 },
        "Religión": { teacher: "Carmen Jiménez", hours: 1.5 }
    }
};

// Horario de ejemplo para testing - estructura simplificada
let testSchedule = {
    "Lunes": [
        { 
            id: "1", 
            subject: "Lengua", 
            teacher: "María García", 
            startTime: "09:00", 
            duration: 1
        },
        {
            id: "2", 
            subject: "Mates", 
            teacher: "María García", 
            startTime: "10:15", 
            duration: 0.75 // 45 minutos, termina a las 11:00
        },
        {
            id: "3", 
            subject: "Inglés", 
            teacher: "Ana López", 
            startTime: "13:00", 
            duration: 1
        }
    ],
    "Martes": [
        {
            id: "4", 
            subject: "Cono", 
            teacher: "María García", 
            startTime: "09:30", // Empieza a las 9:30
            duration: 0.5 // 30 minutos
        }
    ],
    "Miércoles": [],
    "Jueves": [],
    "Viernes": []
};

let currentEditingCell = null;
let clickedSlot = null;

function getSubjectClass(subjectName) {
    const classMap = {
        'lengua': 'subject-lengua',
        'mates': 'subject-mates',
        'cono': 'subject-cono',
        'inglés': 'subject-ingles',
        'ed. física': 'subject-fisica',
        'música': 'subject-musica',
        'plástica': 'subject-plastica',
        'religión': 'subject-religion'
    };
    
    return classMap[subjectName.toLowerCase()] || 'subject-lengua';
}

function calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + (duration * 60);
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToPixels(minutes, startMinute = 540) { // 540 = 9:00 AM
    const relativeMinutes = minutes - startMinute;
    return relativeMinutes; // 1 minuto = 1 pixel
}

function calculateEventPosition(startTime, duration) {
    // Mapear las horas a índices en timeIntervals
    const timeIndex = timeIntervals.indexOf(startTime);
    if (timeIndex === -1) {
        console.warn('Hora no encontrada:', startTime);
        return { top: 0, height: 15 };
    }
    
    const top = timeIndex * 15; // Cada slot = 15px
    const height = duration * 60; // 1 hora = 60px (4 slots * 15px)
    
    return { top, height };
}

function renderTimeColumn() {
    const timeColumn = document.getElementById('timeColumn');
    timeColumn.innerHTML = '';
    
    // Crear el header spacer específicamente para alinearse con el header de días
    const headerSpacer = document.createElement('div');
    headerSpacer.className = 'time-header-spacer';
    headerSpacer.style.height = '50px'; // Mismo height que days-header
    headerSpacer.style.borderBottom = '1px solid #dadce0';
    timeColumn.appendChild(headerSpacer);
    
    // Solo las horas principales, sin slots vacíos
    const mainHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
    
    mainHours.forEach(time => {
        // Crear 4 slots para cada hora (00, 15, 30, 45)
        for (let i = 0; i < 4; i++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            
            // Mostrar la hora solo en el primer slot de cada hora
            if (i === 0) {
                timeSlot.textContent = time;
                timeSlot.style.fontWeight = '500';
            } else {
                timeSlot.textContent = '';
            }
            
            timeColumn.appendChild(timeSlot);
        }
    });
}

function renderWeekGrid() {
    const weekGrid = document.getElementById('weekGrid');
    weekGrid.innerHTML = '';
    
    days.forEach(day => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        dayColumn.dataset.day = day;
        
        // Crear slots de 15 minutos para cada día
        timeIntervals.forEach((time, index) => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot-15';
            timeSlot.dataset.time = time;
            timeSlot.dataset.day = day;
            
            // Primer slot vacío (header spacer)
            if (index === 0) {
                timeSlot.style.pointerEvents = 'none';
            }
            // Recreo especial
            else if (time === '12:00' || time === '12:15') {
                timeSlot.classList.add('recreo-slot');
                if (time === '12:00') {
                    timeSlot.textContent = 'RECREO';
                    timeSlot.style.height = '30px'; // 2 slots de 15min
                    timeSlot.style.zIndex = '5';
                }
                if (time === '12:15') {
                    timeSlot.style.display = 'none'; // Ocultar porque el recreo ocupa 2 slots
                }
                timeSlot.style.pointerEvents = 'none';
            } 
            // Slots normales clickeables
            else {
                // Indicador de añadir
                const addIndicator = document.createElement('div');
                addIndicator.className = 'add-indicator';
                addIndicator.textContent = '+';
                timeSlot.appendChild(addIndicator);
                
                timeSlot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    clickedSlot = { day: day, time: time };
                    openSubjectModal();
                });
            }
            
            dayColumn.appendChild(timeSlot);
        });
        
        // Renderizar eventos de este día
        renderDayEvents(dayColumn, day);
        
        weekGrid.appendChild(dayColumn);
    });
}

function renderDayEvents(dayColumn, day) {
    const events = testSchedule[day] || [];
    
    events.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = `class-event ${getSubjectClass(event.subject)}`;
        eventEl.dataset.eventId = event.id;
        
        // Recalcular posición basada en tiempo
        const position = calculateEventPosition(event.startTime, event.duration);
        eventEl.style.top = `${position.top}px`;
        eventEl.style.height = `${position.height}px`;
        
        const endTime = calculateEndTime(event.startTime, event.duration);
        const timeRange = `${event.startTime}-${endTime}`;
        
        eventEl.innerHTML = `
            <div class="class-content">
                <div class="class-subject">${event.subject}</div>
                <div class="class-teacher">${event.teacher}</div>
            </div>
            <div class="class-time">${timeRange}</div>
        `;
        
        // Click para editar
        eventEl.addEventListener('click', (e) => {
            e.stopPropagation();
            clickedSlot = { 
                day: day, 
                time: event.startTime,
                existingEvent: event
            };
            openSubjectModal();
        });
        
        dayColumn.appendChild(eventEl);
    });
}

function openSubjectModal() {
    const modal = document.getElementById('subjectModal');
    const subjectSelect = document.getElementById('subjectSelect');
    const durationSelect = document.getElementById('durationSelect');
    
    // Llenar opciones de asignatura
    subjectSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    Object.keys(testGroup.subjects).forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = `${subject} (${testGroup.subjects[subject].teacher})`;
        subjectSelect.appendChild(option);
    });
    
    // Pre-llenar si hay evento existente
    if (clickedSlot && clickedSlot.existingEvent) {
        subjectSelect.value = clickedSlot.existingEvent.subject;
        durationSelect.value = clickedSlot.existingEvent.duration;
    } else {
        subjectSelect.value = '';
        durationSelect.value = '1';
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('subjectModal').style.display = 'none';
    clickedSlot = null;
}

function assignSubject() {
    if (!clickedSlot) return;
    
    const subject = document.getElementById('subjectSelect').value;
    const duration = parseFloat(document.getElementById('durationSelect').value);
    
    if (!subject) {
        alert('Por favor selecciona una asignatura');
        return;
    }
    
    const { day, time } = clickedSlot;
    const teacher = testGroup.subjects[subject].teacher;
    
    // Si hay evento existente, eliminarlo primero
    if (clickedSlot.existingEvent) {
        removeEventById(clickedSlot.existingEvent.id, day);
    }
    
    // Verificar conflictos de tiempo
    if (hasTimeConflict(day, time, duration)) {
        alert('Esta franja horaria está ocupada o se solapa con otra clase.');
        return;
    }
    
    // Crear nuevo evento
    const position = calculateEventPosition(time, duration);
    const newEvent = {
        id: Date.now().toString(),
        subject: subject,
        teacher: teacher,
        startTime: time,
        duration: duration,
        top: position.top,
        height: position.height
    };
    
    // Añadir al horario
    if (!testSchedule[day]) {
        testSchedule[day] = [];
    }
    testSchedule[day].push(newEvent);
    
    closeModal();
    renderWeekGrid();
}

function removeSubject() {
    if (!clickedSlot || !clickedSlot.existingEvent) {
        alert('No hay asignatura para eliminar');
        return;
    }
    
    const { day } = clickedSlot;
    const eventId = clickedSlot.existingEvent.id;
    
    removeEventById(eventId, day);
    closeModal();
    renderWeekGrid();
}

function removeEventById(eventId, day) {
    if (testSchedule[day]) {
        testSchedule[day] = testSchedule[day].filter(event => event.id !== eventId);
    }
}

function hasTimeConflict(day, startTime, duration) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + (duration * 60);
    
    const events = testSchedule[day] || [];
    
    return events.some(event => {
        if (clickedSlot.existingEvent && event.id === clickedSlot.existingEvent.id) {
            return false; // Ignorar el evento que estamos editando
        }
        
        const eventStart = timeToMinutes(event.startTime);
        const eventEnd = eventStart + (event.duration * 60);
        
        // Verificar solapamiento
        return (startMinutes < eventEnd && endMinutes > eventStart);
    });
}

function refreshSchedule() {
    renderTimeColumn();
    renderWeekGrid();
}

// Event listeners y inicialización
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('refreshBtn').addEventListener('click', refreshSchedule);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('subjectModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape') closeModal(); 
    });
    
    // Render inicial
    refreshSchedule();
});
