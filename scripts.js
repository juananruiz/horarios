let groups = {};
let teachers = [];

function loadGroupsData() {
    const storedGroups = localStorage.getItem('horariosGroups');
    groups = storedGroups ? JSON.parse(storedGroups) : {};
}

function saveGroupsData() {
    localStorage.setItem('horariosGroups', JSON.stringify(groups));
}

function loadTeachersData() {
    const storedTeachers = localStorage.getItem('horariosTeachers');
    teachers = storedTeachers ? JSON.parse(storedTeachers) : [];
}

function saveTeachersData() {
    localStorage.setItem('horariosTeachers', JSON.stringify(teachers));
}



function generateTimeSlots(start, end, interval) {
    const slots = [];
    let current = new Date(`1970-01-01T${start}:00`);
    const endDate = new Date(`1970-01-01T${end}:00`);

    while (current < endDate) {
        slots.push(current.toTimeString().substring(0, 5));
        current.setMinutes(current.getMinutes() + interval);
    }
    return slots;
}

const timeIntervals = generateTimeSlots("09:00", "14:00", 15);
const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

let schedules = {};
let currentEditingCell = null;

function initializeAppData() {
    loadGroupsData();
    loadTeachersData();
    loadSchedulesFromStorage();

    // Reconciliación de datos: asegurar que cada grupo tiene un horario.
    Object.keys(groups).forEach(groupName => {
        ensureScheduleExistsForGroup(groupName);
    });
    saveSchedulesToStorage(); // Guardar por si se ha creado algún horario para un grupo que no lo tenía
}

// --- Persistencia de Datos ---
function saveSchedulesToStorage() {
    localStorage.setItem('horariosSchedules', JSON.stringify(schedules));
}

function loadSchedulesFromStorage() {
    const savedSchedules = localStorage.getItem('horariosSchedules');
    // Solo cargar si existen datos y no es un objeto vacío. Previene borrados.
    if (savedSchedules && savedSchedules !== '{}') {
        schedules = JSON.parse(savedSchedules);
    } else {
        initializeSchedules();
    }
}

// --- Inicializadores de Página ---

// Se llama desde index.html
function initIndexPage() {
    initializeAppData();
    addEventListeners();
    populateGroupFilter();
    renderSchedules();
    updateStats();
}

function buildTeacherSchedules(schedules) {
    const teacherSchedules = {};
    
    teachers.forEach(teacher => {
        teacherSchedules[teacher] = {};
        days.forEach(day => {
            teacherSchedules[teacher][day] = {};
            timeIntervals.forEach(time => {
                teacherSchedules[teacher][day][time] = null;
            });
        });
    });

    Object.keys(schedules).forEach(groupName => {
        Object.keys(schedules[groupName]).forEach(day => {
            Object.keys(schedules[groupName][day]).forEach(time => {
                const scheduleItem = schedules[groupName][day][time];
                if (scheduleItem && scheduleItem.isStart) {
                    const teacher = scheduleItem.teacher;
                    if (teachers.includes(teacher)) {
                        teacherSchedules[teacher][day][time] = {
                            subject: scheduleItem.subject,
                            group: groupName,
                            duration: scheduleItem.duration,
                            isStart: true
                        };
                        
                        const numSlots = (scheduleItem.duration * 60) / 15;
                        let currentTime = new Date(`1970-01-01T${time}:00`);
                        for (let i = 1; i < numSlots; i++) {
                            currentTime.setMinutes(currentTime.getMinutes() + 15);
                            const slotTime = currentTime.toTimeString().substring(0, 5);
                            if (teacherSchedules[teacher][day][slotTime] !== undefined) {
                                teacherSchedules[teacher][day][slotTime] = { isContinuation: true };
                            }
                        }
                    }
                }
            });
        });
    });
    return teacherSchedules;
}

function initializeSchedules() {
    Object.keys(groups).forEach(group => {
        schedules[group] = {};
        days.forEach(day => {
            schedules[group][day] = {};
            timeIntervals.forEach(time => {
                schedules[group][day][time] = null;
            });
        });
    });
}

function ensureScheduleExistsForGroup(groupName) {
    if (!schedules[groupName]) {
        schedules[groupName] = {};
        days.forEach(day => {
            schedules[groupName][day] = {};
            timeIntervals.forEach(time => {
                schedules[groupName][day][time] = null;
            });
        });
    }
}

function populateGroupFilter() {
    const filter = document.getElementById('groupFilter');
    const currentValue = filter.value;
    filter.innerHTML = '<option value="">Todos los grupos</option>'; // Limpiar opciones anteriores
    Object.keys(groups).sort().forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        filter.appendChild(option);
    });
    filter.value = currentValue;
}

function renderSchedules() {
    const container = document.getElementById('scheduleContainer');
    const filter = document.getElementById('groupFilter').value;
    container.innerHTML = '';

    const groupsToShow = filter ? [filter] : Object.keys(groups);
    
    groupsToShow.forEach(groupName => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group-schedule';
        
        const title = document.createElement('div');
        title.className = 'group-title';
        title.innerHTML = `${groupName}<br><small>Tutor: ${groups[groupName].tutor}</small>`;
        
        const assignedHours = calculateAssignedHours(groupName);
        const totalRequiredHours = calculateTotalRequiredHours(groupName);
        
        let remainingHoursHtml = '';
        const statusLines = [];
        let hasSurplus = false;

        Object.keys(totalRequiredHours).forEach(subject => {
            const assigned = assignedHours[subject] || 0;
            const required = totalRequiredHours[subject];
            const remaining = required - assigned;
            
            if (remaining > 0) {
                statusLines.push(`<span>${subject}: Faltan ${remaining}h</span>`);
            } else if (remaining < 0) {
                statusLines.push(`<span class="surplus-subject">${subject}: Sobran ${Math.abs(remaining)}h</span>`);
                hasSurplus = true;
            }
        });

        if (statusLines.length > 0) {
            remainingHoursHtml = `<div class="remaining-hours ${hasSurplus ? 'has-surplus' : ''}">${statusLines.join('<br>')}</div>`;
        } else {
            remainingHoursHtml = `<div class="remaining-hours">Todas las horas asignadas</div>`;
        }

        title.innerHTML += remainingHoursHtml;
        
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
            
            if (index % 4 === 0) {
                const timeCell = document.createElement('td');
                timeCell.className = 'time-slot';
                timeCell.rowSpan = 4;
                timeCell.textContent = time;
                row.appendChild(timeCell);
            }

            if (time >= "12:00" && time < "12:30") {
                if (time === "12:00") {
                    const cell = document.createElement('td');
                    cell.className = 'recreo';
                    cell.textContent = 'RECREO';
                    cell.colSpan = days.length;
                    cell.rowSpan = 2; // 2 * 15min = 30min
                    row.appendChild(cell);
                }
            } else {
                days.forEach(day => {
                    const schedule = schedules[groupName][day][time];

                    if (schedule && schedule.isContinuation) {
                        return;
                    }

                    const cell = document.createElement('td');
                    cell.className = 'class-slot';
                    cell.dataset.group = groupName;
                    cell.dataset.day = day;
                    cell.dataset.time = time;
                    cell.addEventListener('click', () => openSubjectSelector(cell));

                    if (schedule && schedule.isStart) {
                        const numSlots = (schedule.duration * 60) / 15;
                        cell.rowSpan = numSlots;
                        cell.classList.add('occupied');
                        cell.innerHTML = `
                            <div class="class-info">${schedule.subject}</div>
                            <div class="teacher-info">${schedule.teacher}</div>
                        `;
                    } else {
                        cell.innerHTML = '+';
                    }
                    row.appendChild(cell);
                });
            }
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        groupDiv.appendChild(title);
        groupDiv.appendChild(table);
        container.appendChild(groupDiv);
    });
    
    setTimeout(checkAllConflicts, 100);
}

function openSubjectSelector(cell) {
    const { group, day, time } = cell.dataset;
    currentEditingCell = { group, day, time, cell };
    
    const modal = document.getElementById('subjectSelector');
    const subjectSelect = document.getElementById('subjectSelect');
    
    subjectSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    
    Object.keys(groups[group].subjects).forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = `${subject} (${groups[group].subjects[subject].teacher})`;
        subjectSelect.appendChild(option);
    });
    
    const currentSchedule = schedules[group][day][time];
    if (currentSchedule && currentSchedule.isStart) {
        subjectSelect.value = currentSchedule.subject;
        document.getElementById('durationSelect').value = currentSchedule.duration || "1";
    } else {
        subjectSelect.value = "";
        document.getElementById('durationSelect').value = "1";
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
    
    const { group, day, time } = currentEditingCell;
    const teacher = groups[group].subjects[subject].teacher;

    const numSlots = (duration * 60) / 15;
    const timeSlotsToOccupy = [];
    let currentTime = new Date(`1970-01-01T${time}:00`);
    for (let i = 0; i < numSlots; i++) {
        timeSlotsToOccupy.push(currentTime.toTimeString().substring(0, 5));
        currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    // --- NUEVA VALIDACIÓN ---
    const lastSlot = timeSlotsToOccupy[timeSlotsToOccupy.length - 1];
    if (new Date(`1970-01-01T${lastSlot}:00`) >= new Date(`1970-01-01T14:00:00`)) {
        alert('La clase no puede terminar después de las 14:00.');
        return;
    }

    for (const slot of timeSlotsToOccupy) {
        if (slot === "12:00" || slot === "12:15") {
            alert('La clase no puede solaparse con el recreo.');
            return;
        }
        if (schedules[group][day][slot] && schedules[group][day][slot].isStart && slot !== time) {
            alert('Hay otra clase en este espacio de tiempo. Por favor, quítela primero.');
            return;
        }
    }
    // --- FIN DE LA VALIDACIÓN ---

    removeSubject(false);

    schedules[group][day][time] = {
        subject: subject,
        teacher: teacher,
        duration: duration,
        isStart: true
    };
    
    for (let i = 1; i < timeSlotsToOccupy.length; i++) {
        schedules[group][day][timeSlotsToOccupy[i]] = {
            isContinuation: true,
            startTime: time
        };
    }
    
    closeModal();
    renderSchedules();
    updateStats();
    saveSchedulesToStorage();
}

function removeSubject(shouldRender = true) {
    if (!currentEditingCell) return;
    
    const { group, day, time } = currentEditingCell;
    
    let startTime = time;
    const clickedSchedule = schedules[group][day][time];
    if (clickedSchedule && clickedSchedule.isContinuation) {
        startTime = clickedSchedule.startTime;
    }

    const scheduleToRemove = schedules[group][day][startTime];

    if (scheduleToRemove && scheduleToRemove.isStart) {
        const duration = scheduleToRemove.duration;
        const numSlots = (duration * 60) / 15;
        let currentTime = new Date(`1970-01-01T${startTime}:00`);

        for (let i = 0; i < numSlots; i++) {
            const slotToRemove = currentTime.toTimeString().substring(0, 5);
            schedules[group][day][slotToRemove] = null;
            currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
    } else {
         schedules[group][day][time] = null;
    }

    if (shouldRender) {
        closeModal();
        renderSchedules();
        updateStats();
        saveSchedulesToStorage();
    }
}

function closeModal() {
    document.getElementById('subjectSelector').style.display = 'none';
    currentEditingCell = null;
}

function checkAllConflicts() {
    const conflicts = [];
    const teacherSchedule = {};
    
    Object.keys(schedules).forEach(group => {
        Object.keys(schedules[group]).forEach(day => {
            timeIntervals.forEach(time => {
                const schedule = schedules[group][day][time];
                if (schedule && schedule.isStart) {
                    const teacher = schedule.teacher;
                    const duration = schedule.duration;
                    const numSlots = (duration * 60) / 15;
                    let currentTime = new Date(`1970-01-01T${time}:00`);

                    for (let i = 0; i < numSlots; i++) {
                        const slotTime = currentTime.toTimeString().substring(0, 5);
                        const key = `${day}-${slotTime}`;
                        
                        if (!teacherSchedule[teacher]) {
                            teacherSchedule[teacher] = {};
                        }
                        
                        if (!teacherSchedule[teacher][key]) {
                            teacherSchedule[teacher][key] = [];
                        }
                        
                        teacherSchedule[teacher][key].push({
                            group: group,
                            subject: schedule.subject
                        });

                        currentTime.setMinutes(currentTime.getMinutes() + 15);
                    }
                }
            });
        });
    });
    
    Object.keys(teacherSchedule).forEach(teacher => {
        Object.keys(teacherSchedule[teacher]).forEach(timeKey => {
            if (teacherSchedule[teacher][timeKey].length > 1) {
                conflicts.push({
                    teacher: teacher,
                    time: timeKey,
                    groups: teacherSchedule[teacher][timeKey]
                });
            }
        });
    });
    
    displayConflicts(conflicts);
    highlightConflicts(conflicts);
    updateStats();
}

function displayConflicts(conflicts) {
    const panel = document.getElementById('conflictsPanel');
    const list = document.getElementById('conflictsList');
    
    const uniqueConflicts = Array.from(new Set(conflicts.map(c => JSON.stringify(c)))).map(s => JSON.parse(s));
    
    document.getElementById('conflictCount').textContent = uniqueConflicts.length;
    
    if (uniqueConflicts.length === 0) {
        panel.classList.remove('show');
        return;
    }
    
    panel.classList.add('show');
    list.innerHTML = '';
    
    uniqueConflicts.forEach(conflict => {
        const item = document.createElement('div');
        item.className = 'conflict-item';
        const [day, time] = conflict.time.split('-', 2);
        const groupNames = conflict.groups.map(g => `${g.group} (${g.subject})`).join(', ');
        item.innerHTML = `
            <strong>${conflict.teacher}</strong> tiene conflicto el <strong>${day}</strong> 
            a las <strong>${time}</strong>: ${groupNames}
        `;
        list.appendChild(item);
    });
}

function highlightConflicts(conflicts) {
    document.querySelectorAll('.class-slot.conflict').forEach(cell => {
        cell.classList.remove('conflict');
    });
    
    conflicts.forEach(conflict => {
        const [day, time] = conflict.time.split('-', 2);
        conflict.groups.forEach(groupInfo => {
            let startTime = time;
            let schedule = schedules[groupInfo.group][day][time];
            if (schedule && schedule.isContinuation) {
                startTime = schedule.startTime;
            }

            const cell = document.querySelector(`.class-slot[data-group="${groupInfo.group}"][data-day="${day}"][data-time="${startTime}"]`);
            if (cell) {
                cell.classList.add('conflict');
            }
        });
    });
}

function updateStats() {
    let totalAssigned = 0;
    let totalRequired = 0;
    
    Object.keys(groups).forEach(group => {
        Object.keys(groups[group].subjects).forEach(subject => {
            totalRequired += groups[group].subjects[subject].hours;
        });
        
        Object.keys(schedules[group]).forEach(day => {
            Object.keys(schedules[group][day]).forEach(time => {
                const schedule = schedules[group][day][time];
                if (schedule && schedule.isStart) {
                    totalAssigned += schedule.duration || 1;
                } else if (schedule && schedule.isContinuation) {
                    // Las continuaciones no añaden horas al total asignado
                }
            });
        });
    });
    
    document.getElementById('totalClasses').textContent = Math.round(totalAssigned * 100) / 100;
    
    const completionRate = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;
    document.getElementById('completionRate').textContent = completionRate + '%';
}

function calculateAssignedHours(groupName) {
    const assigned = {};
    if (!schedules[groupName]) return assigned; // No schedule for this group yet

    days.forEach(day => {
        timeIntervals.forEach(time => {
            const scheduleItem = schedules[groupName][day][time];
            if (scheduleItem && scheduleItem.isStart) {
                const subject = scheduleItem.subject;
                const duration = scheduleItem.duration || 1;
                assigned[subject] = (assigned[subject] || 0) + duration;
            }
        });
    });
    return assigned;
}

function calculateTotalRequiredHours(groupName) {
    const required = {};
    const groupSubjects = groups[groupName] ? groups[groupName].subjects : {};
    Object.entries(groupSubjects).forEach(([subjectName, details]) => {
        required[subjectName] = details.hours;
    });
    return required;
}



function exportData() {
    const data = {
        groups: groups,
        teachers: teachers,
        schedules: schedules,
        timestamp: new Date().toISOString(),
        version: "3.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horarios_completo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('importFile').click();
}

function addEventListeners() {
    document.getElementById('groupFilter').addEventListener('change', renderSchedules);
    document.getElementById('checkConflictsBtn').addEventListener('click', checkAllConflicts);
    
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', importData);

    document.getElementById('assignSubjectBtn').addEventListener('click', assignSubject);
    document.getElementById('removeSubjectBtn').addEventListener('click', () => removeSubject(true));
    document.getElementById('cancelBtn').addEventListener('click', closeModal);

    document.getElementById('importFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                let message = '';

                if (data.groups) {
                    groups = data.groups;
                    saveGroupsData();
                    message += 'Datos de grupos importados. ';
                }

                if (data.teachers) {
                    teachers = data.teachers;
                    saveTeachersData();
                    message += 'Datos de profesores importados. ';
                }

                if (data.schedules) {
                    schedules = data.schedules;
                    saveSchedulesToStorage();
                    message += 'Datos de horarios importados.';
                }

                if (message) {
                    alert(message + ' La página se recargará para aplicar los cambios.');
                    location.reload();
                } else {
                    alert('El archivo no contiene datos reconocibles (groups, teachers o schedules).');
                }

            } catch (error) {
                alert('Error al importar el archivo: ' + error.message);
            }
        };
        reader.readAsText(file);
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

