document.addEventListener('DOMContentLoaded', () => {
    initializeAppData();
    initializeManagementPage();
});

function initializeManagementPage() {
    // --- Elementos del DOM ---
    // Profesores
    const teacherListDiv = document.getElementById('teacher-list');
    const newTeacherNameInput = document.getElementById('new-teacher-name');
    const addTeacherBtn = document.getElementById('add-teacher-btn');

    // Grupos
    const groupListDiv = document.getElementById('group-list');
    const newGroupBtn = document.getElementById('new-group-btn');
    const groupDetailsContainer = document.getElementById('group-details-container');
    const detailsTitle = document.getElementById('details-title');
    const groupForm = document.getElementById('group-form');
    const groupNameInput = document.getElementById('group-name');
    const groupOrderInput = document.getElementById('group-order');
    const groupTutorSelect = document.getElementById('group-tutor');
    const subjectsTbody = document.getElementById('subjects-tbody');
    const newSubjectNameInput = document.getElementById('new-subject-name');
    const newSubjectTeacherSelect = document.getElementById('new-subject-teacher');
    const newSubjectHoursInput = document.getElementById('new-subject-hours');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const deleteGroupBtn = document.getElementById('delete-group-btn');

    let selectedGroupKey = null;

    // --- LÓGICA DE PROFESORES ---

    function renderTeacherList() {
        teacherListDiv.innerHTML = '';
        teachers.forEach(teacher => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <span class="teacher-name">${teacher}</span>
                <div class="actions">
                    <button class="button-edit-small">Editar</button>
                    <button class="button-danger-small">X</button>
                </div>
            `;
            teacherListDiv.appendChild(item);

            item.querySelector('.button-edit-small').addEventListener('click', (e) => {
                e.stopPropagation();
                handleEditTeacher(item, teacher);
            });
            item.querySelector('.button-danger-small').addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteTeacher(teacher);
            });
        });
    }

    function handleAddTeacher() {
        const newName = newTeacherNameInput.value.trim();
        if (newName && !teachers.includes(newName)) {
            teachers.push(newName);
            teachers.sort();
            saveTeachersData();
            renderTeacherList();
            populateTeacherSelects();
            newTeacherNameInput.value = '';
        } else if (teachers.includes(newName)) {
            alert('El profesor ya existe.');
        } else {
            alert('El nombre del profesor no puede estar vacío.');
        }
    }

    function handleEditTeacher(item, oldName) {
        const span = item.querySelector('.teacher-name');
        const actionsDiv = item.querySelector('.actions');
        
        const originalActionsHTML = actionsDiv.innerHTML;

        span.innerHTML = `<input type="text" value="${oldName}" class="edit-teacher-input">`;
        const input = span.querySelector('input');
        input.focus();

        actionsDiv.innerHTML = '';
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Guardar';
        saveButton.className = 'button-save-small';
        actionsDiv.appendChild(saveButton);

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancelar';
        cancelButton.className = 'button-cancel-small';
        actionsDiv.appendChild(cancelButton);

        const saveAction = () => {
            const newName = input.value.trim();
            if (newName && newName !== oldName) {
                if (teachers.includes(newName)) {
                    alert(`El profesor "${newName}" ya existe.`);
                    span.innerHTML = oldName;
                    actionsDiv.innerHTML = originalActionsHTML;
                    return;
                }
                updateTeacherNameInGroups(oldName, newName);
                const index = teachers.indexOf(oldName);
                if (index > -1) {
                    teachers[index] = newName;
                }
                teachers.sort();
                
                saveTeachersData();
                saveGroupsData();
                renderTeacherList();
                populateTeacherSelects();
                
                if (selectedGroupKey) {
                    renderGroupDetails(selectedGroupKey);
                }
            } else {
                renderTeacherList();
            }
        };

        saveButton.addEventListener('click', saveAction);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveAction();
            } else if (e.key === 'Escape') {
                renderTeacherList();
            }
        });

        cancelButton.addEventListener('click', () => {
            renderTeacherList();
        });
    }

    function updateTeacherNameInGroups(oldName, newName) {
        Object.values(groups).forEach(group => {
            if (group.tutor === oldName) {
                group.tutor = newName;
            }
            Object.values(group.subjects).forEach(subject => {
                if (subject.teacher === oldName) {
                    subject.teacher = newName;
                }
            });
        });
    }

    function isTeacherInUse(teacherName) {
        return Object.values(groups).some(group => {
            if (group.tutor === teacherName) return true;
            return Object.values(group.subjects).some(subject => subject.teacher === teacherName);
        });
    }

    function handleDeleteTeacher(teacherName) {
        if (isTeacherInUse(teacherName)) {
            alert(`No se puede eliminar a "${teacherName}" porque está asignado como tutor o a una asignatura. Por favor, reasigna sus clases primero.`);
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar a "${teacherName}"?`)) {
            teachers = teachers.filter(t => t !== teacherName);
            saveTeachersData();
            renderTeacherList();
            populateTeacherSelects();
        }
    }


    // --- LÓGICA DE GRUPOS ---

    function renderGroupList() {
        groupListDiv.innerHTML = '';
        Object.keys(groups).sort((a, b) => (groups[a].orden || 0) - (groups[b].orden || 0)).forEach(groupKey => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.textContent = groupKey;
            item.dataset.groupKey = groupKey;
            if (groupKey === selectedGroupKey) {
                item.classList.add('selected');
            }
            item.addEventListener('click', () => handleGroupSelect(groupKey));
            groupListDiv.appendChild(item);
        });
    }

    function populateTeacherSelects() {
        [groupTutorSelect, newSubjectTeacherSelect].forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '';
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher;
                option.textContent = teacher;
                select.appendChild(option);
            });
            if (teachers.includes(currentValue)) {
                select.value = currentValue;
            } else {
                select.value = teachers[0] || '';
            }
        });
    }

    function renderGroupDetails(groupKey) {
        const group = groups[groupKey];
        if (!group) return;

        groupDetailsContainer.style.display = 'block';
        detailsTitle.textContent = `Editando: ${groupKey}`;
        groupNameInput.value = groupKey;
        groupOrderInput.value = group.orden || 0;
        populateTeacherSelects();
        groupTutorSelect.value = group.tutor;

        subjectsTbody.innerHTML = '';
        if (group.subjects) {
            Object.entries(group.subjects).forEach(([subjectName, subjectDetails]) => {
                addSubjectRow(subjectName, subjectDetails.teacher, subjectDetails.hours);
            });
        }
    }

    function addSubjectRow(name, teacher, hours) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${name}</td>
            <td>${teacher}</td>
            <td>${hours}</td>
            <td><button type="button" class="button-danger-small">X</button></td>
        `;
        row.querySelector('button').addEventListener('click', () => row.remove());
        subjectsTbody.appendChild(row);
    }

    function handleGroupSelect(groupKey) {
        selectedGroupKey = groupKey;
        renderGroupList();
        renderGroupDetails(groupKey);
    }

    function handleNewGroupClick() {
        selectedGroupKey = null;
        groupDetailsContainer.style.display = 'block';
        detailsTitle.textContent = 'Nuevo Grupo';
        groupForm.reset();
        groupOrderInput.value = 0;
        subjectsTbody.innerHTML = '';
        populateTeacherSelects();
        renderGroupList();
    }

    function handleAddSubject() {
        const name = newSubjectNameInput.value.trim();
        const teacher = newSubjectTeacherSelect.value;
        const hours = parseFloat(newSubjectHoursInput.value);

        if (name && teacher && !isNaN(hours)) {
            addSubjectRow(name, teacher, hours);
            newSubjectNameInput.value = '';
            newSubjectHoursInput.value = '';
        } else {
            alert('Por favor, completa todos los campos de la asignatura.');
        }
    }

    function handleDeleteGroup() {
        if (!selectedGroupKey) {
            alert('No hay un grupo seleccionado para eliminar.');
            return;
        }
        if (confirm(`¿Estás seguro de que quieres eliminar el grupo "${selectedGroupKey}"? Esta acción no se puede deshacer.`)) {
            delete groups[selectedGroupKey];
            delete schedules[selectedGroupKey]; // Eliminar también el horario asociado
            saveGroupsData();
            saveSchedulesToStorage(); // Guardar el cambio en los horarios
            selectedGroupKey = null;
            groupDetailsContainer.style.display = 'none';
            renderGroupList();
        }
    }

    function handleGroupFormSubmit(event) {
        event.preventDefault();
        const newGroupName = groupNameInput.value.trim();
        const originalGroupName = selectedGroupKey;
        if (!newGroupName) {
            alert('El nombre del grupo no puede estar vacío.');
            return;
        }

        if (!originalGroupName && groups[newGroupName]) {
            alert(`El grupo "${newGroupName}" ya existe.`);
            return;
        }

        if (originalGroupName && newGroupName !== originalGroupName && groups[newGroupName]) {
            alert(`No se puede renombrar a "${newGroupName}" porque ya existe otro grupo con ese nombre.`);
            return;
        }

        const subjects = {};
        for (const row of subjectsTbody.rows) {
            const cells = row.cells;
            const subjectName = cells[0].textContent;
            const teacher = cells[1].textContent;
            const hours = parseFloat(cells[2].textContent);
            subjects[subjectName] = { teacher, hours };
        }

        const groupData = {
            tutor: groupTutorSelect.value,
            subjects: subjects,
            orden: parseInt(groupOrderInput.value, 10) || 0
        };

        // Lógica para manejar el horario al crear/renombrar
        if (originalGroupName && newGroupName !== originalGroupName) {
            // Es un renombramiento: mover datos de horario y eliminar el antiguo
            schedules[newGroupName] = schedules[originalGroupName];
            delete schedules[originalGroupName];
            delete groups[originalGroupName];
        } else if (!originalGroupName) {
            // Es un grupo nuevo: asegurar que su horario existe
            ensureScheduleExistsForGroup(newGroupName);
        }

        groups[newGroupName] = groupData;
        
        saveGroupsData();
        saveSchedulesToStorage();

        alert(`Grupo "${newGroupName}" guardado correctamente.`);
        selectedGroupKey = newGroupName;
        renderGroupList();
        renderGroupDetails(newGroupName);
    }

    // --- INICIO ---
    renderTeacherList();
    populateTeacherSelects();
    renderGroupList();
    groupDetailsContainer.style.display = 'none';

    addTeacherBtn.addEventListener('click', handleAddTeacher);
    newGroupBtn.addEventListener('click', handleNewGroupClick);
    addSubjectBtn.addEventListener('click', handleAddSubject);
    groupForm.addEventListener('submit', handleGroupFormSubmit);
    deleteGroupBtn.addEventListener('click', handleDeleteGroup);
}