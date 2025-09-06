// TEST PAGE - Solo para experimentar con Primero A
// Datos hardcodeados para testing

const timeIntervals = ["09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45"];
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

// Horario de ejemplo para testing
let testSchedule = {
    "Lunes": {
        "09:00": [{ id: "1", subject: "Lengua", teacher: "María García", duration: 1, isStart: true }],
        "09:15": [{ id: "2", parentId: "1", isContinuation: true, startTime: "09:00" }],
        "09:30": [{ id: "3", parentId: "1", isContinuation: true, startTime: "09:00" }],
        "09:45": [{ id: "4", parentId: "1", isContinuation: true, startTime: "09:00" }],
        "10:00": [{ id: "5", subject: "Mates", teacher: "María García", duration: 1, isStart: true }],
        "10:15": [{ id: "6", parentId: "5", isContinuation: true, startTime: "10:00" }],
        "10:30": [{ id: "7", parentId: "5", isContinuation: true, startTime: "10:00" }],
        "10:45": [{ id: "8", parentId: "5", isContinuation: true, startTime: "10:00" }],
        "11:00": [],
        "11:15": [],
        "11:30": [],
        "11:45": [],
        "12:00": [], // Recreo
        "12:15": [], // Recreo
        "12:30": [{ id: "9", subject: "Inglés", teacher: "Ana López", duration: 1, isStart: true }],
        "12:45": [{ id: "10", parentId: "9", isContinuation: true, startTime: "12:30" }],
        "13:00": [{ id: "11", parentId: "9", isContinuation: true, startTime: "12:30" }],
        "13:15": [{ id: "12", parentId: "9", isContinuation: true, startTime: "12:30" }],
        "13:30": [],
        "13:45": []
    },
    "Martes": {},
    "Miércoles": {},
    "Jueves": {},
    "Viernes": {}
};

// Inicializar días vacíos
days.forEach(day => {
    if (!testSchedule[day]) {
        testSchedule[day] = {};
        timeIntervals.forEach(time => {
            if (!testSchedule[day][time]) {
                testSchedule[day][time] = [];
            }
        });
    }
});

let currentEditingCell = null;

const subjectClassMapping = {
    'cono': 'cono',
    'inglés': 'ingles',
    'francés': 'frances',
    'música': 'musica',
    'plástica': 'plastica',
    'religión': 'religion',
    'mates': 'mates-lengua',
    'lengua': 'mates-lengua',
    'fisica': 'ed-fisica',
    'refuerzo': 'refuerzo'
};

function getSubjectClass(subjectName) {
    if (!subjectName) return '';
    
    const lowerSubject = subjectName.toLowerCase();
    const mappingKey = Object.keys(subjectClassMapping).find(key => 
        lowerSubject.includes(key)
    );
    
    return mappingKey ? `subject-color--${subjectClassMapping[mappingKey]}` : '';
}

function renderTestSchedule() {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = '';
    
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-schedule';
    
    const title = document.createElement('div');
    title.className = 'group-title';
    title.innerHTML = `${testGroup.name}<br><small>Tutor: ${testGroup.tutor}</small>`;
    
    const table = document.createElement('table');
    table.className = 'schedule-table';
    
    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Hora</th>';
    days.forEach(day => {
        headerRow.innerHTML += `<th>${day}</th>`;
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    timeIntervals.forEach((time, index) => {
        const row = document.createElement('tr');
        
        // Añadir celda de tiempo cada 4 intervalos (cada hora)
        if (index % 4 === 0) {
            const timeCell = document.createElement('td');
            timeCell.className = 'time-slot';
            timeCell.rowSpan = 4;
            timeCell.textContent = time;
            row.appendChild(timeCell);
        }

        // Manejar recreo
        if (time >= "12:00" && time < "12:30") {
            if (time === "12:00") {
                const cell = document.createElement('td');
                cell.className = 'recreo';
                cell.textContent = 'RECREO';
                cell.colSpan = days.length;
                cell.rowSpan = 2;
                row.appendChild(cell);
            }
            // Para 12:15, no añadir nada (cubierto por rowspan)
        } else {
            // Añadir celdas para cada día
            days.forEach(day => {
                const schedule = testSchedule[day][time] || [];
                
                // Verificar si es continuación
                const isContinuation = schedule.length > 0 && schedule.every(item => item.isContinuation);
                
                if (!isContinuation) {
                    const cell = document.createElement('td');
                    cell.className = 'class-slot';
                    cell.dataset.day = day;
                    cell.dataset.time = time;
                    cell.addEventListener('click', () => openSubjectSelector(cell));

                    if (schedule.length > 0) {
                        const startItem = schedule.find(s => s.isStart);
                        if (startItem) {
                            cell.classList.add('occupied');
                            const numSlots = (startItem.duration * 60) / 15;
                            if (numSlots > 1) {
                                cell.rowSpan = numSlots;
                            }
                            
                            const colorClass = getSubjectClass(startItem.subject);
                            cell.innerHTML = `<div class="class-info-wrapper ${colorClass}">
                                                <div class="class-info">${startItem.subject}</div>
                                                <div class="teacher-info">${startItem.teacher}</div>
                                            </div>`;
                        }
                    } else {
                        cell.innerHTML = '+';
                    }
                    row.appendChild(cell);
                }
            });
        }
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    groupDiv.appendChild(title);
    groupDiv.appendChild(table);
    container.appendChild(groupDiv);
}

function openSubjectSelector(cell) {
    const { day, time } = cell.dataset;
    currentEditingCell = { day, time, cell };
    
    const modal = document.getElementById('subjectSelector');
    const subjectSelect = document.getElementById('subjectSelect');
    
    subjectSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    
    Object.keys(testGroup.subjects).forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = `${subject} (${testGroup.subjects[subject].teacher})`;
        subjectSelect.appendChild(option);
    });
    
    // Pre-llenar si hay una asignatura existente
    const schedule = testSchedule[day][time];
    if (schedule && schedule.length > 0) {
        const startItem = schedule.find(item => item.isStart);
        if (startItem) {
            subjectSelect.value = startItem.subject;
            document.getElementById('durationSelect').value = startItem.duration || 1;
        }
    }
    
    modal.style.display = 'block';
}

function assignSubject() {
    if (!currentEditingCell) return;
    
    const subject = document.getElementById('subjectSelect').value;
    const duration = parseFloat(document.getElementById('durationSelect').value);
    
    if (!subject) {
        alert('Por favor selecciona una asignatura');
        return;
    }
    
    const { day, time } = currentEditingCell;
    const teacher = testGroup.subjects[subject].teacher;
    
    // Limpiar slot actual
    testSchedule[day][time] = [];
    
    // Crear nuevo item
    const newId = Date.now().toString();
    const newItem = {
        id: newId,
        subject: subject,
        teacher: teacher,
        duration: duration,
        isStart: true
    };
    
    testSchedule[day][time].push(newItem);
    
    // Crear continuaciones si es necesario
    const numSlots = (duration * 60) / 15;
    let currentTime = new Date(`1970-01-01T${time}:00`);
    
    for (let i = 1; i < numSlots; i++) {
        currentTime.setMinutes(currentTime.getMinutes() + 15);
        const slotTime = currentTime.toTimeString().substring(0, 5);
        
        if (testSchedule[day][slotTime]) {
            testSchedule[day][slotTime] = [{
                id: Date.now().toString() + i,
                parentId: newId,
                isContinuation: true,
                startTime: time
            }];
        }
    }
    
    closeModal();
    renderTestSchedule();
}

function removeSubject() {
    if (!currentEditingCell) return;
    
    const { day, time } = currentEditingCell;
    const schedule = testSchedule[day][time];
    
    if (schedule && schedule.length > 0) {
        const startItem = schedule.find(item => item.isStart);
        
        if (startItem) {
            // Eliminar continuaciones
            const numSlots = (startItem.duration * 60) / 15;
            let currentTime = new Date(`1970-01-01T${time}:00`);
            
            for (let i = 0; i < numSlots; i++) {
                const slotTime = currentTime.toTimeString().substring(0, 5);
                testSchedule[day][slotTime] = [];
                currentTime.setMinutes(currentTime.getMinutes() + 15);
            }
        } else {
            // Es continuación, buscar el inicio
            const continuation = schedule[0];
            if (continuation.startTime) {
                removeSubjectByStartTime(day, continuation.startTime);
            }
        }
    }
    
    closeModal();
    renderTestSchedule();
}

function removeSubjectByStartTime(day, startTime) {
    const schedule = testSchedule[day][startTime];
    if (schedule && schedule.length > 0) {
        const startItem = schedule.find(item => item.isStart);
        if (startItem) {
            const numSlots = (startItem.duration * 60) / 15;
            let currentTime = new Date(`1970-01-01T${startTime}:00`);
            
            for (let i = 0; i < numSlots; i++) {
                const slotTime = currentTime.toTimeString().substring(0, 5);
                testSchedule[day][slotTime] = [];
                currentTime.setMinutes(currentTime.getMinutes() + 15);
            }
        }
    }
}

function closeModal() {
    document.getElementById('subjectSelector').style.display = 'none';
    currentEditingCell = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('refreshBtn').addEventListener('click', renderTestSchedule);
    document.getElementById('assignSubjectBtn').addEventListener('click', assignSubject);
    document.getElementById('removeSubjectBtn').addEventListener('click', removeSubject);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape') closeModal(); 
    });
    
    // Render inicial
    renderTestSchedule();
});
