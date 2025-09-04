function initDataManagementPage() {
    initializeAppData();
    addGestionDatosEventListeners();
    renderTeachers();
    renderGroupsList();
    document.getElementById('group-details-container').style.display = 'none';
}

function addGestionDatosEventListeners() {
    document.getElementById('add-teacher-btn').addEventListener('click', addTeacher);
    document.getElementById('new-group-btn').addEventListener('click', () => {
        selectGroup(null); // Abrir para crear un nuevo grupo
    });
    document.getElementById('group-form').addEventListener('submit', saveGroupDetails);
    document.getElementById('delete-group-btn').addEventListener('click', deleteSelectedGroup);
    document.getElementById('add-subject-btn').addEventListener('click', addSubjectToTable);
}

// --- Teacher Management ---

function renderTeachers() {
    const list = document.getElementById('teacher-list');
    list.innerHTML = '';
    teachers.sort((a, b) => a.name.localeCompare(b.name)).forEach((teacher, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="teacher-details">
                <span class="teacher-name">${teacher.name}</span>
                <span class="teacher-id-display" style="color: #666; font-size: 0.8em; margin-left: 8px;">(ID: ${teacher.id || 'N/A'})</span>
            </div>
            <div class="teacher-actions">
                <button class="button-edit-small">Editar</button>
                <button class="button-danger-small">Borrar</button>
            </div>
        `;

        item.querySelector('.button-danger-small').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTeacher(index);
        });

        item.querySelector('.button-edit-small').addEventListener('click', (e) => {
            e.stopPropagation();
            editTeacher(item, index);
        });

        list.appendChild(item);
    });
}

function addTeacher() {
    const nameInput = document.getElementById('new-teacher-name');
    const idInput = document.getElementById('new-teacher-id');
    const name = nameInput.value.trim();
    const id = idInput.value.trim().toUpperCase();

    if (!name) {
        alert('El nombre del profesor no puede estar vacío.');
        return;
    }
    if (teachers.some(t => t.name === name)) {
        alert('Ya existe un profesor con este nombre.');
        return;
    }
    if (id && teachers.some(t => t.id === id)) {
        alert('Ya existe un profesor con este ID.');
        return;
    }

    teachers.push({ name, id });
    saveTeachersData();
    renderTeachers();
    nameInput.value = '';
    idInput.value = '';
}

function editTeacher(item, index) {
    const teacher = teachers[index];
    const detailsDiv = item.querySelector('.teacher-details');
    detailsDiv.innerHTML = `
        <input type="text" class="edit-teacher-name" value="${teacher.name}" style="width: 60%;">
        <input type="text" class="edit-teacher-id" value="${teacher.id || ''}" placeholder="ID" maxlength="5" style="width: 30%;">
    `;
    const actionsDiv = item.querySelector('.teacher-actions');
    actionsDiv.innerHTML = `
        <button class="button-save-small">Guardar</button>
        <button class="button-cancel-small">Cancelar</button>
    `;

    actionsDiv.querySelector('.button-save-small').addEventListener('click', () => saveTeacherEdit(index, item));
    actionsDiv.querySelector('.button-cancel-small').addEventListener('click', renderTeachers);
}

function saveTeacherEdit(index, item) {
    const newName = item.querySelector('.edit-teacher-name').value.trim();
    const newId = item.querySelector('.edit-teacher-id').value.trim().toUpperCase();
    const oldName = teachers[index].name;

    if (!newName) {
        alert('El nombre no puede estar vacío.');
        return;
    }

    if (teachers.some((t, i) => i !== index && t.name === newName)) {
        alert('Ya existe otro profesor con este nombre.');
        return;
    }
    if (newId && newId.length > 0 && teachers.some((t, i) => i !== index && t.id === newId)) {
        alert('Ya existe otro profesor con este ID.');
        return;
    }

    teachers[index] = { name: newName, id: newId };

    if (oldName !== newName) {
        Object.values(groups).forEach(group => {
            Object.values(group.subjects).forEach(subject => {
                if (subject.teacher === oldName) {
                    subject.teacher = newName;
                }
            });
            if (group.tutor === oldName) {
                group.tutor = newName;
            }
        });
    }

    saveTeachersData();
    saveGroupsData();
    renderTeachers();
}

function deleteTeacher(index) {
    const teacherToDelete = teachers[index].name;
    if (confirm(`¿Seguro que quieres borrar a ${teacherToDelete}? Se eliminará de todas las asignaturas y tutorías.`)) {
        Object.values(groups).forEach(group => {
            Object.values(group.subjects).forEach(subject => {
                if (subject.teacher === teacherToDelete) {
                    subject.teacher = '';
                }
            });
            if (group.tutor === teacherToDelete) {
                group.tutor = '';
            }
        });

        teachers.splice(index, 1);
        saveTeachersData();
        saveGroupsData();
        renderTeachers();
        renderGroupsList(); // Actualizar por si un tutor ha cambiado
    }
}

// --- Group Management ---

let selectedGroup = null;

function renderGroupsList() {
    const list = document.getElementById('group-list');
    list.innerHTML = '';
    Object.keys(groups).sort((a, b) => (groups[a].orden || 0) - (groups[b].orden || 0)).forEach(groupName => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.textContent = groupName;
        if (groupName === selectedGroup) {
            item.classList.add('selected');
        }
        item.addEventListener('click', () => selectGroup(groupName));
        list.appendChild(item);
    });
}

function selectGroup(groupName) {
    selectedGroup = groupName;
    document.getElementById('group-details-container').style.display = 'block';
    renderGroupsList();
    renderGroupDetails();
}

function renderGroupDetails() {
    const form = document.getElementById('group-form');
    const title = document.getElementById('details-title');
    const tutorSelect = document.getElementById('group-tutor');
    const teacherNames = teachers.map(t => t.name).sort();

    // Poblar select de tutores
    tutorSelect.innerHTML = '<option value="">-- Sin tutor --</option>';
    teacherNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        tutorSelect.appendChild(option);
    });

    if (selectedGroup) {
        const group = groups[selectedGroup];
        title.textContent = `Detalles de ${selectedGroup}`;
        form['group-name'].value = selectedGroup;
        form['group-order'].value = group.orden || 0;
        tutorSelect.value = group.tutor || '';
    } else {
        title.textContent = 'Nuevo Grupo';
        form.reset();
    }

    renderSubjectsTable();
}

function renderSubjectsTable() {
    const tbody = document.getElementById('subjects-tbody');
    tbody.innerHTML = '';
    const teacherNames = teachers.map(t => t.name).sort();

    if (selectedGroup && groups[selectedGroup].subjects) {
        Object.entries(groups[selectedGroup].subjects).forEach(([name, details]) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${name}</td>
                <td>${details.teacher}</td>
                <td>${details.hours}</td>
                <td><button type="button" class="button-danger-small">X</button></td>
            `;
            row.querySelector('button').addEventListener('click', () => {
                delete groups[selectedGroup].subjects[name];
                renderSubjectsTable();
            });
        });
    }
    
    // Poblar el select para añadir nueva asignatura
    const newSubjectTeacherSelect = document.getElementById('new-subject-teacher');
    newSubjectTeacherSelect.innerHTML = '<option value="">-- Seleccionar Profesor --</option>';
    teacherNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        newSubjectTeacherSelect.appendChild(option);
    });
}

function addSubjectToTable() {
    const name = document.getElementById('new-subject-name').value.trim();
    const teacher = document.getElementById('new-subject-teacher').value;
    const hours = parseFloat(document.getElementById('new-subject-hours').value);

    if (name && teacher && !isNaN(hours)) {
        if (!groups[selectedGroup].subjects) {
            groups[selectedGroup].subjects = {};
        }
        groups[selectedGroup].subjects[name] = { teacher, hours };
        renderSubjectsTable();
        // Limpiar inputs
        document.getElementById('new-subject-name').value = '';
        document.getElementById('new-subject-teacher').value = '';
        document.getElementById('new-subject-hours').value = '';
    } else {
        alert('Por favor, completa todos los campos de la asignatura.');
    }
}

function saveGroupDetails(event) {
    event.preventDefault();
    const oldGroupName = selectedGroup;
    const newGroupName = document.getElementById('group-name').value.trim();

    if (!newGroupName) {
        alert('El nombre del grupo no puede estar vacío.');
        return;
    }

    // Si es un grupo nuevo o se ha renombrado
    if (!oldGroupName || oldGroupName !== newGroupName) {
        if (groups[newGroupName]) {
            alert('Ya existe un grupo con ese nombre.');
            return;
        }
        // Crear nuevo grupo y copiar datos
        groups[newGroupName] = groups[oldGroupName] || { subjects: {} };
        if (oldGroupName) {
            delete groups[oldGroupName];
            // Actualizar horarios si se renombró
            if (schedules[oldGroupName]) {
                schedules[newGroupName] = schedules[oldGroupName];
                delete schedules[oldGroupName];
                saveSchedulesToStorage();
            }
        }
        selectedGroup = newGroupName;
    }

    // Guardar detalles
    groups[selectedGroup].orden = parseInt(document.getElementById('group-order').value, 10) || 0;
    groups[selectedGroup].tutor = document.getElementById('group-tutor').value;
    
    saveGroupsData();
    alert('¡Grupo guardado!');
    renderGroupsList();
}

function deleteSelectedGroup() {
    if (selectedGroup && confirm(`¿Seguro que quieres eliminar el grupo ${selectedGroup}? Se borrará su horario también.`)) {
        delete groups[selectedGroup];
        delete schedules[selectedGroup];
        saveGroupsData();
        saveSchedulesToStorage();
        selectedGroup = null;
        initDataManagementPage();
    }
}

window.addEventListener('load', initDataManagementPage);
