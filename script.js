/* script.js */

document.addEventListener('DOMContentLoaded', () => {
    // Data Structures
    let exams = [];
    let rooms = [];
    let timeslots = [];
    
    // DOM Elements
    const examForm = document.getElementById('exam-form');
    const roomForm = document.getElementById('room-form');
    const timeslotForm = document.getElementById('timeslot-form');
    const examList = document.getElementById('exam-list');
    const roomList = document.getElementById('room-list');
    const timeslotList = document.getElementById('timeslot-list');
    const scheduleBtn = document.getElementById('schedule-btn');
    const resetBtn = document.getElementById('reset-btn');
    const scheduleTableBody = document.querySelector('#schedule-table tbody');
    
    // Helper Functions
    function addExam(event) {
        event.preventDefault();
        const id = parseInt(document.getElementById('exam-id').value);
        const name = document.getElementById('exam-name').value.trim();
        const numStudents = parseInt(document.getElementById('num-students').value);
        const studentsInput = document.getElementById('students').value.trim();
        const students = studentsInput.split(',').map(s => parseInt(s.trim()));
        
        // Validation
        if (exams.find(e => e.id === id)) {
            alert('Exam ID already exists.');
            return;
        }
        if (isNaN(id) || isNaN(numStudents) || students.some(isNaN)) {
            alert('Please enter valid values.');
            return;
        }
        if (students.length !== numStudents) {
            alert('Number of student IDs does not match the number of students.');
            return;
        }
        
        const exam = { id, name, numStudents, students };
        exams.push(exam);
        displayExams();
        examForm.reset();
    }
    
    function addRoom(event) {
        event.preventDefault();
        const id = parseInt(document.getElementById('room-id').value);
        const capacity = parseInt(document.getElementById('room-capacity').value);
        
        // Validation
        if (rooms.find(r => r.id === id)) {
            alert('Room ID already exists.');
            return;
        }
        if (isNaN(id) || isNaN(capacity)) {
            alert('Please enter valid values.');
            return;
        }
        
        const room = { id, capacity };
        rooms.push(room);
        displayRooms();
        roomForm.reset();
    }
    
    function addTimeslot(event) {
        event.preventDefault();
        const date = document.getElementById('timeslot-date').value;
        const slot = document.getElementById('timeslot-slot').value;
        
        // Validation
        if (!date || !slot) {
            alert('Please select both date and slot.');
            return;
        }
        // Check for duplicate time slots
        if (timeslots.find(ts => ts.date === date && ts.slot === slot)) {
            alert('This date and slot combination already exists.');
            return;
        }
        
        const timeslot = { date, slot };
        timeslots.push(timeslot);
        displayTimeslots();
        timeslotForm.reset();
    }
    
    function displayExams() {
        examList.innerHTML = '';
        exams.forEach(exam => {
            const li = document.createElement('li');
            li.textContent = `ID: ${exam.id}, Name: ${exam.name}, Students: ${exam.numStudents}`;
            examList.appendChild(li);
        });
    }
    
    function displayRooms() {
        roomList.innerHTML = '';
        rooms.forEach(room => {
            const li = document.createElement('li');
            li.textContent = `ID: ${room.id}, Capacity: ${room.capacity}`;
            roomList.appendChild(li);
        });
    }
    
    function displayTimeslots() {
        timeslotList.innerHTML = '';
        timeslots.forEach(ts => {
            const li = document.createElement('li');
            li.textContent = `Date: ${ts.date}, Slot: ${ts.slot}`;
            timeslotList.appendChild(li);
        });
    }
    
    // Scheduling Algorithm (Translated from C++)
    function generateSchedule() {
        // Clear previous schedule
        scheduleTableBody.innerHTML = '';
        
        if (exams.length === 0 || rooms.length === 0 || timeslots.length === 0) {
            alert('Please add exams, rooms, and time slots before scheduling.');
            return;
        }
        
        // Build Conflict Matrix
        let n = exams.length;
        let conflict = Array.from({ length: n }, () => Array(n).fill(false));
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (haveConflict(exams[i], exams[j])) {
                    conflict[i][j] = conflict[j][i] = true;
                }
            }
        }
        
        // Initialize Assignments
        let assignments = Array(n).fill(null); // Each element will be {timeslot, room}
        
        // Initialize Domains
        let domains = exams.map(exam => {
            let possible = [];
            rooms.forEach(room => {
                if (room.capacity >= exam.numStudents) {
                    timeslots.forEach(ts => {
                        possible.push({ timeslot: ts, room: room.id });
                    });
                }
            });
            return possible;
        });
        
        // Backtracking Search
        if (backtrack(assignments, exams, rooms, timeslots, conflict, domains)) {
            // Display Schedule
            assignments.forEach((assign, index) => {
                const exam = exams[index];
                const timeslot = assign.timeslot;
                const room = rooms.find(r => r.id === assign.room);
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${exam.id}</td>
                    <td>${exam.name}</td>
                    <td>${timeslot.date}</td>
                    <td>${timeslot.slot}</td>
                    <td>${room.id}</td>
                `;
                scheduleTableBody.appendChild(tr);
            });
            alert('Scheduling Successful!');
        } else {
            alert('No feasible schedule found.');
        }
    }
    
    // Conflict Detection
    function haveConflict(e1, e2) {
        const set1 = new Set(e1.students);
        for (let student of e2.students) {
            if (set1.has(student)) return true;
        }
        return false;
    }
    
    // Select Unassigned Exam (MRV)
    function selectUnassignedExam(assignments, exams, conflict, rooms, timeslots, domains) {
        let minRemaining = Infinity;
        let selected = -1;
        for (let i = 0; i < exams.length; i++) {
            if (!assignments[i]) {
                if (domains[i].length < minRemaining) {
                    minRemaining = domains[i].length;
                    selected = i;
                }
            }
        }
        return selected;
    }
    
    // Order Domain Values (LCV)
    function orderDomainValues(examIndex, exams, assignments, conflict, rooms, timeslots, domains) {
        // For simplicity, return the domain as-is.
        // Implementing true LCV would require additional logic.
        return domains[examIndex];
    }
    
    // Check if Assignment is Valid
    function isValid(examIndex, assign, assignments, exams, rooms, timeslots, conflict) {
        const ts = assign.timeslot;
        const rm = assign.room;
        
        // Check for room availability and student conflicts
        for (let i = 0; i < exams.length; i++) {
            if (assignments[i]) {
                const assignedTS = assignments[i].timeslot;
                const assignedRoom = assignments[i].room;
                if (assignedTS.date === ts.date && assignedTS.slot === ts.slot) {
                    if (assignedRoom === rm) return false; // Room conflict
                    if (conflict[examIndex][i]) return false; // Student conflict
                }
            }
        }
        return true;
    }
    
    // Backtracking Function
    function backtrack(assignments, exams, rooms, timeslots, conflict, domains) {
        // Check if complete
        if (assignments.every(a => a !== null)) return true;
        
        // Select Unassigned Exam
        const exam = selectUnassignedExam(assignments, exams, conflict, rooms, timeslots, domains);
        if (exam === -1) return false; // No solution
        
        // Order Domain Values
        const ordered = orderDomainValues(exam, exams, assignments, conflict, rooms, timeslots, domains);
        
        for (let assign of ordered) {
            if (isValid(exam, assign, assignments, exams, rooms, timeslots, conflict)) {
                assignments[exam] = assign;
                
                // Forward Checking: Reduce domains of conflicting exams
                let domainsBackup = JSON.parse(JSON.stringify(domains));
                let failed = false;
                
                for (let i = 0; i < exams.length; i++) {
                    if (conflict[exam][i] && !assignments[i]) {
                        // Remove assignments with the same date and slot
                        domains[i] = domains[i].filter(a => !(a.timeslot.date === assign.timeslot.date && a.timeslot.slot === assign.timeslot.slot && a.room === assign.room));
                        if (domains[i].length === 0) {
                            failed = true;
                            break;
                        }
                    }
                }
                
                if (!failed) {
                    if (backtrack(assignments, exams, rooms, timeslots, conflict, domains)) return true;
                }
                
                // Backtrack
                assignments[exam] = null;
                domains = domainsBackup;
            }
        }
        return false;
    }
    
    // Event Listeners
    examForm.addEventListener('submit', addExam);
    roomForm.addEventListener('submit', addRoom);
    timeslotForm.addEventListener('submit', addTimeslot);
    scheduleBtn.addEventListener('click', generateSchedule);
    resetBtn.addEventListener('click', () => {
        exams = [];
        rooms = [];
        timeslots = [];
        examList.innerHTML = '';
        roomList.innerHTML = '';
        timeslotList.innerHTML = '';
        scheduleTableBody.innerHTML = '';
    });
});
