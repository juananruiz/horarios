// Variable para gestionar la celda que se está editando en la vista de profesor
let currentTeacherEditingCell = null;

/**
 * Inicializa la página de horarios por profesor.
 */
function initProfesoresPage() {
    initializeAppData();
    renderCompactTeacherSchedule();
    addProfesoresEventListeners();
}

/**
 * Añade los listeners de eventos para los elementos de la página de profesores.
 */
function addProfesoresEventListeners() {
    document.getElementById('assignSubjectBtn').addEventListener('click', assignSubjectForTeacher);
    document.getElementById('removeSubjectBtn').addEventListener('click', () => removeSubjectForTeacher(true));
    document.getElementById('cancelBtn').addEventListener('click', closeTeacherModal);
    document.getElementById('groupSelect').addEventListener('change', populateSubjectSelectForTeacher);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTeacherModal();
        }
    });
}

/**
 * Abre el modal de edición para una celda específica del horario del profesor.
 * @param {HTMLElement} cell - La celda HTML que se ha clicado.
 * @param {string} teacherName - El nombre del profesor.
 * @param {string} day - El día de la semana.
 * @param {string} time - La hora de inicio.
 */
function openTeacherModal(cell, teacherName, day, time) {
    const scheduleData = getScheduleDataFromCell(teacherName, day, time);
    currentTeacherEditingCell = { cell, teacherName, day, time, scheduleData };

    const modal = document.getElementById('subjectSelector');
    const groupSelect = document.getElementById('groupSelect');
    const subjectSelect = document.getElementById('subjectSelect');
    const durationSelect = document.getElementById('durationSelect');
    const removeBtn = document.getElementById('removeSubjectBtn');

    // Resetear selects
    groupSelect.innerHTML = '<option value="">-- Seleccionar Grupo --</option>';
    subjectSelect.innerHTML = '<option value="">-- Seleccionar Asignatura --</option>';

    // Llenar el selector de grupos
    Object.keys(groups).sort((a, b) => (groups[a].orden || 0) - (groups[b].orden || 0)).forEach(groupName => {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        groupSelect.appendChild(option);
    });

    if (scheduleData && scheduleData.isStart) {
        // Editando una clase existente
        groupSelect.value = scheduleData.group;
        populateSubjectSelectForTeacher();
        subjectSelect.value = scheduleData.subject;
        durationSelect.value = scheduleData.duration;
        removeBtn.style.display = 'inline-block';
    } else {
        // Añadiendo una nueva clase
        groupSelect.value = '';
        subjectSelect.value = '';
        durationSelect.value = '1';
        removeBtn.style.display = 'none';
    }

    modal.style.display = 'block';
}

/**
 * Popula el selector de asignaturas basándose en el grupo seleccionado.
 * Solo muestra las asignaturas impartidas por el profesor actual.
 */
function populateSubjectSelectForTeacher() {
    const groupName = document.getElementById('groupSelect').value;
    const subjectSelect = document.getElementById('subjectSelect');
    subjectSelect.innerHTML = '<option value="">-- Seleccionar Asignatura --</option>';

    if (groupName && groups[groupName] && groups[groupName].subjects) {
        Object.keys(groups[groupName].subjects).forEach(subjectName => {
            if (groups[groupName].subjects[subjectName].teacher === currentTeacherEditingCell.teacherName) {
                const option = document.createElement('option');
                option.value = subjectName;
                option.textContent = subjectName;
                subjectSelect.appendChild(option);
            }
        });
    }
}

/**
 * Asigna una asignatura a un profesor en un hueco horario.
 */
function assignSubjectForTeacher() {
    if (!currentTeacherEditingCell) return;

    const group = document.getElementById('groupSelect').value;
    const subject = document.getElementById('subjectSelect').value;
    const duration = parseFloat(document.getElementById('durationSelect').value);
    const { day, time, teacherName } = currentTeacherEditingCell;

    if (!group || !subject) {
        alert('Por favor, selecciona un grupo y una asignatura.');
        return;
    }
    
    const teacherForSubject = groups[group].subjects[subject]?.teacher;
    if (teacherForSubject !== teacherName) {
        alert(`La asignatura '${subject}' no la imparte ${teacherName}, sino ${teacherForSubject || 'nadie'}.`);
        return;
    }

    const numSlots = (duration * 60) / 15;
    const timeSlotsToOccupy = Array.from({ length: numSlots }, (_, i) => {
        let d = new Date(`1970-01-01T${time}:00`);
        d.setMinutes(d.getMinutes() + i * 15);
        return d.toTimeString().substring(0, 5);
    });

    if (new Date(`1970-01-01T${timeSlotsToOccupy[timeSlotsToOccupy.length - 1]}:00`) >= new Date(`1970-01-01T14:00:00`)) {
        alert('La clase no puede terminar después de las 14:00.');
        return;
    }

    for (const slot of timeSlotsToOccupy) {
        if (slot >= "12:00" && slot < "12:30") {
            alert('La clase no puede solaparse con el recreo.');
            return;
        }
        // Modificamos la validación para permitir la superposición de profesores en un mismo grupo.
        // Ahora solo dará error si el MISMO profesor ya tiene una clase en ese slot (evitando duplicados).
        const itemsInSlot = schedules[group]?.[day]?.[slot] || [];
        const isSameTeacherAssigned = itemsInSlot.some(item => item.isStart && item.teacher === teacherName);

        // La condición `slot !== time` previene que la validación falle al editar una clase existente.
        if (isSameTeacherAssigned && slot !== time) {
            alert(`El profesor '${teacherName}' ya tiene una clase asignada para el grupo '${group}' en este espacio de tiempo.`);
            return;
        }
    }

    if (currentTeacherEditingCell.scheduleData) {
        removeSubjectForTeacher(false); // No renderizar
    }

    // Asegurarse de que el slot es un array y añadir la nueva clase.
    // Esto alinea la lógica con scripts.js y permite la coexistencia de clases.
    if (!Array.isArray(schedules[group][day][time])) {
        schedules[group][day][time] = [];
    }
    schedules[group][day][time].push({
        subject: subject,
        teacher: teacherName,
        duration: duration,
        isStart: true
    });

    for (let i = 1; i < timeSlotsToOccupy.length; i++) {
        // Las celdas de continuación también deben ser arrays.
        const slot = timeSlotsToOccupy[i];
        if (!Array.isArray(schedules[group][day][slot])) {
            schedules[group][day][slot] = [];
        }
        schedules[group][day][slot].push({ isContinuation: true, startTime: time });
    }

    closeTeacherModal();
    saveSchedulesToStorage();
    renderCompactTeacherSchedule();
}

/**
 * Elimina una asignatura del horario.
 * @param {boolean} shouldRender - Indica si se debe re-renderizar el horario.
 */
function removeSubjectForTeacher(shouldRender = true) {
    if (!currentTeacherEditingCell || !currentTeacherEditingCell.scheduleData) return;

    const { group, day, time } = currentTeacherEditingCell.scheduleData;
    // Encontrar la hora de inicio real, ya que podríamos estar en una celda de continuación
    const scheduleItems = schedules[group]?.[day]?.[time] || [];
    const firstItem = scheduleItems.find(item => !item.isContinuation);
    let startTime = time;
    if (!firstItem && scheduleItems.length > 0 && scheduleItems[0].isContinuation) {
        startTime = scheduleItems[0].startTime;
    }
    
    const startSlotItems = schedules[group]?.[day]?.[startTime] || [];
    // Encontrar el item específico a borrar basado en el profesor y la asignatura
    const itemToRemoveIndex = startSlotItems.findIndex(item => 
        item.teacher === currentTeacherEditingCell.teacherName && 
        item.subject === currentTeacherEditingCell.scheduleData.subject
    );

    if (itemToRemoveIndex !== -1) {
        const scheduleToRemove = startSlotItems[itemToRemoveIndex];
        const numSlots = (scheduleToRemove.duration * 60) / 15;

        // Eliminar el item del slot de inicio
        startSlotItems.splice(itemToRemoveIndex, 1);

        // Limpiar las celdas de continuación
        for (let i = 0; i < numSlots; i++) {
            let d = new Date(`1970-01-01T${startTime}:00`);
            d.setMinutes(d.getMinutes() + i * 15);
            const slotToRemove = d.toTimeString().substring(0, 5);
            if (schedules[group]?.[day]?.[slotToRemove]) {
                const itemsInSlot = schedules[group][day][slotToRemove];
                // Filtramos para quitar la continuación correcta, por si hay dos clases a la vez
                const filteredItems = itemsInSlot.filter(item => !(item.isContinuation && item.startTime === startTime));
                // Aseguramos que el resultado sea siempre un array.
                schedules[group][day][slotToRemove] = filteredItems.length > 0 ? filteredItems : [];
            }
        }
    }

    if (shouldRender) {
        closeTeacherModal();
        saveSchedulesToStorage();
        renderCompactTeacherSchedule();
    }
}

/**
 * Cierra el modal de edición.
 */
function closeTeacherModal() {
    document.getElementById('subjectSelector').style.display = 'none';
    currentTeacherEditingCell = null;
}

/**
 * Obtiene los datos de una clase a partir de la celda del profesor.
 * @param {string} teacherName - El nombre del profesor.
 * @param {string} day - El día.
 * @param {string} time - La hora.
 * @returns {object|null} - Los datos de la clase o null si no se encuentra.
 */
function getScheduleDataFromCell(teacherName, day, time) {
    for (const groupName of Object.keys(schedules)) {
        const scheduleItems = schedules[groupName]?.[day]?.[time];
        if (Array.isArray(scheduleItems) && scheduleItems.length > 0) {
            const itemForTeacher = scheduleItems.find(item => item.teacher === teacherName);
            if (itemForTeacher && itemForTeacher.isStart) {
                return { ...itemForTeacher, group: groupName, day, time };
            }

            const continuationItem = scheduleItems.find(item => item.isContinuation);
            if (continuationItem) {
                const startItems = schedules[groupName]?.[day]?.[continuationItem.startTime];
                const originalItem = startItems?.find(item => item.teacher === teacherName);
                if (originalItem) {
                    return { ...originalItem, group: groupName, day: day, time: continuationItem.startTime };
                }
            }
        }
    }
    return null;
}



/**
 * Renderiza el horario compacto por profesor.
 */
function renderCompactTeacherSchedule() {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = '';

    // Ordenar la lista de profesores por el nuevo campo ID
    // Los que no tienen ID van al final
    teachers.sort((a, b) => (a.id || 'ZZZZZ').localeCompare(b.id || 'ZZZZZ'));
    const sortedTeachers = teachers.map(teacher => teacher.name);

    const teacherSchedules = buildTeacherSchedules(schedules);
    const dayInitials = { "Lunes": "L", "Martes": "M", "Miércoles": "X", "Jueves": "J", "Viernes": "V" };

    const table = document.createElement('table');
    table.className = 'schedule-table teacher-schedule-compact';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th></th>';
    sortedTeachers.forEach(teacherName => {
        headerRow.innerHTML += `<th>${teacherName}</th>`;
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    days.forEach(day => {
        const dayRow = document.createElement('tr');
        const dayCell = document.createElement('td');
        dayCell.colSpan = sortedTeachers.length + 1;
        dayCell.className = 'day-separator';
        dayCell.textContent = day.toUpperCase().split('').join(' ');
        dayRow.appendChild(dayCell);
        tbody.appendChild(dayRow);

        timeIntervals.forEach(time => {
            if (time >= "12:00" && time < "12:30") {
                if (time === "12:00") {
                    const recreoRow = document.createElement('tr');
                    const recreoCell = document.createElement('td');
                    recreoCell.colSpan = sortedTeachers.length + 1;
                    recreoCell.className = 'recreo';
                    recreoCell.textContent = 'RECREO';
                    recreoRow.appendChild(recreoCell);
                    tbody.appendChild(recreoRow);
                }
                return;
            }

            const hourRow = document.createElement('tr');
            const timeCell = document.createElement('td');
            timeCell.className = 'time-slot';
            timeCell.textContent = `${dayInitials[day]} ${time}`;
            hourRow.appendChild(timeCell);

            sortedTeachers.forEach(teacherName => {
                const cell = document.createElement('td');
                cell.dataset.teacher = teacherName;
                cell.dataset.day = day;
                cell.dataset.time = time;
                cell.addEventListener('click', () => openTeacherModal(cell, teacherName, day, time));

                const schedule = teacherSchedules[teacherName]?.[day]?.[time];

                if (schedule && schedule.length > 0 && schedule[0].isStart) {
                    const firstItem = schedule[0];
                    cell.innerHTML = `<div>${firstItem.subject}</div><div class="group-info">${firstItem.group}</div>`;
                    const numSlots = (firstItem.duration * 60) / 15;
                    if (numSlots > 1) cell.rowSpan = numSlots;
                    cell.classList.add('occupied');

                    // Añadir clase de color para la asignatura
                    const colorClass = getSubjectClass(firstItem.subject);
                    if (colorClass) {
                        cell.classList.add(colorClass);
                    }
                } else if (schedule && schedule.length > 0 && schedule[0].isContinuation) {
                    return;
                } else {
                    cell.innerHTML = '&nbsp;';
                }
                hourRow.appendChild(cell);
            });
            tbody.appendChild(hourRow);
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
    
    setTimeout(checkAllConflicts, 100);
}

// Iniciar la página al cargar el script
window.addEventListener('load', initProfesoresPage);