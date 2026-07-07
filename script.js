document.addEventListener('DOMContentLoaded', () => {
    // State
    let state = {
        semesters: [],
        whatIfMode: false
    };

    // DOM Elements
    const semestersContainer = document.getElementById('semesters-container');
    const overallCgpaEl = document.getElementById('overall-cgpa');
    const totalCreditsEl = document.getElementById('total-credits');
    const addSemesterBtn = document.getElementById('add-semester-btn');
    const addSimulatedSemesterBtn = document.getElementById('add-simulated-semester-btn');
    const whatIfSwitch = document.getElementById('what-if-switch');
    const resetBtn = document.getElementById('reset-btn');

    // Templates
    const semesterTemplate = document.getElementById('semester-template');
    const subjectTemplate = document.getElementById('subject-template');

    // Utility: Generate Unique ID
    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    // Initial Setup
    init();

    function init() {
        // Event Listeners
        addSemesterBtn.addEventListener('click', () => addSemester(false));
        addSimulatedSemesterBtn.addEventListener('click', () => addSemester(true));
        whatIfSwitch.addEventListener('change', handleWhatIfToggle);
        resetBtn.addEventListener('click', resetAll);

        // Add an initial semester
        addSemester(false);
    }

    // Handlers
    function handleWhatIfToggle(e) {
        state.whatIfMode = e.target.checked;
        
        if (state.whatIfMode) {
            addSimulatedSemesterBtn.classList.remove('hidden');
        } else {
            addSimulatedSemesterBtn.classList.add('hidden');
            // Remove simulated semesters when disabling what-if mode
            state.semesters = state.semesters.filter(s => !s.isSimulated);
            renderAllSemesters();
        }
        
        calculateCGPA();
    }

    function resetAll() {
        if(confirm("Are you sure you want to reset all data?")) {
            state.semesters = [];
            state.whatIfMode = false;
            whatIfSwitch.checked = false;
            addSimulatedSemesterBtn.classList.add('hidden');
            semestersContainer.innerHTML = '';
            addSemester(false);
            calculateCGPA();
        }
    }

    // State Modifiers
    function addSemester(isSimulated) {
        const newSemester = {
            id: generateId(),
            isSimulated: isSimulated,
            subjects: [createEmptySubject(), createEmptySubject(), createEmptySubject()]
        };
        state.semesters.push(newSemester);
        renderSemester(newSemester);
        updateSemesterNumbers();
        calculateCGPA();
    }

    function removeSemester(semesterId) {
        state.semesters = state.semesters.filter(s => s.id !== semesterId);
        const semElement = document.querySelector(`.semester-card[data-id="${semesterId}"]`);
        if(semElement) {
            semElement.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                semElement.remove();
                updateSemesterNumbers();
                calculateCGPA();
            }, 300);
        } else {
            updateSemesterNumbers();
            calculateCGPA();
        }
    }

    function createEmptySubject() {
        return {
            id: generateId(),
            name: '',
            credits: 0,
            grade: null
        };
    }

    function addSubject(semesterId) {
        const semester = state.semesters.find(s => s.id === semesterId);
        if (semester) {
            const newSubject = createEmptySubject();
            semester.subjects.push(newSubject);
            
            // DOM Update
            const subjectsList = document.querySelector(`.semester-card[data-id="${semesterId}"] .subjects-list`);
            const subjectNode = createSubjectNode(newSubject, semesterId);
            subjectsList.appendChild(subjectNode);
        }
    }

    function removeSubject(semesterId, subjectId) {
        const semester = state.semesters.find(s => s.id === semesterId);
        if (semester) {
            semester.subjects = semester.subjects.filter(sub => sub.id !== subjectId);
            
            // DOM Update
            const subjectRow = document.querySelector(`.subject-row[data-id="${subjectId}"]`);
            if (subjectRow) {
                subjectRow.remove();
                calculateGPA(semesterId);
                calculateCGPA();
            }
        }
    }

    function updateSubject(semesterId, subjectId, field, value) {
        const semester = state.semesters.find(s => s.id === semesterId);
        if (semester) {
            const subject = semester.subjects.find(sub => sub.id === subjectId);
            if (subject) {
                subject[field] = value;
                calculateGPA(semesterId);
                calculateCGPA();
            }
        }
    }

    // Render logic
    function renderAllSemesters() {
        semestersContainer.innerHTML = '';
        state.semesters.forEach(sem => renderSemester(sem));
        updateSemesterNumbers();
    }

    function renderSemester(semester) {
        const clone = semesterTemplate.content.cloneNode(true);
        const card = clone.querySelector('.semester-card');
        card.setAttribute('data-id', semester.id);
        
        if (semester.isSimulated) {
            card.classList.add('simulated');
            clone.querySelector('.semester-title').innerHTML = `Simulated Semester <span class="sem-number"></span>`;
        }

        const subjectsList = clone.querySelector('.subjects-list');
        semester.subjects.forEach(subject => {
            const subjectNode = createSubjectNode(subject, semester.id);
            subjectsList.appendChild(subjectNode);
        });

        // Event Listeners for Semester Card
        clone.querySelector('.remove-sem-btn').addEventListener('click', () => removeSemester(semester.id));
        clone.querySelector('.add-subject-btn').addEventListener('click', () => addSubject(semester.id));

        semestersContainer.appendChild(clone);
    }

    function createSubjectNode(subject, semesterId) {
        const clone = subjectTemplate.content.cloneNode(true);
        const row = clone.querySelector('.subject-row');
        row.setAttribute('data-id', subject.id);

        const nameInput = clone.querySelector('.subject-name-input');
        const creditsInput = clone.querySelector('.subject-credits-input');
        const gradeSelect = clone.querySelector('.subject-grade-select');

        nameInput.value = subject.name;
        creditsInput.value = subject.credits || '';
        
        if (subject.grade !== null) {
            gradeSelect.value = subject.grade;
        }

        // Event Listeners for Subject Inputs
        nameInput.addEventListener('input', (e) => updateSubject(semesterId, subject.id, 'name', e.target.value));
        creditsInput.addEventListener('input', (e) => updateSubject(semesterId, subject.id, 'credits', parseFloat(e.target.value) || 0));
        gradeSelect.addEventListener('change', (e) => updateSubject(semesterId, subject.id, 'grade', parseInt(e.target.value)));

        clone.querySelector('.remove-subject-btn').addEventListener('click', () => removeSubject(semesterId, subject.id));

        return row;
    }

    function updateSemesterNumbers() {
        let actualCount = 1;
        let simCount = 1;
        state.semesters.forEach(sem => {
            const numSpan = document.querySelector(`.semester-card[data-id="${sem.id}"] .sem-number`);
            if(numSpan) {
                if(sem.isSimulated) {
                    numSpan.textContent = simCount++;
                } else {
                    numSpan.textContent = actualCount++;
                }
            }
        });
    }

    // Calculation Logic
    function calculateGPA(semesterId) {
        const semester = state.semesters.find(s => s.id === semesterId);
        if (!semester) return;

        let totalCredits = 0;
        let totalPoints = 0;

        semester.subjects.forEach(sub => {
            if (sub.credits > 0 && sub.grade !== null && !isNaN(sub.grade)) {
                totalCredits += sub.credits;
                totalPoints += (sub.credits * sub.grade);
            }
        });

        const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
        semester.gpa = gpa;
        semester.totalCredits = totalCredits;

        // Update DOM
        const gpaSpan = document.querySelector(`.semester-card[data-id="${semesterId}"] .sem-gpa`);
        if (gpaSpan) {
            gpaSpan.textContent = gpa.toFixed(2);
        }
    }

    function calculateCGPA() {
        let totalCredits = 0;
        let totalPoints = 0;

        state.semesters.forEach(sem => {
            sem.subjects.forEach(sub => {
                if (sub.credits > 0 && sub.grade !== null && !isNaN(sub.grade)) {
                    totalCredits += sub.credits;
                    totalPoints += (sub.credits * sub.grade);
                }
            });
        });

        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
        
        // Update DOM
        overallCgpaEl.textContent = cgpa.toFixed(2);
        totalCreditsEl.textContent = totalCredits;
        
        // Update styling based on what-if mode
        if (state.whatIfMode) {
            document.querySelector('.metric-card h3').textContent = "Projected CGPA";
            overallCgpaEl.style.color = "var(--secondary)";
            overallCgpaEl.style.textShadow = "0 0 20px rgba(16, 185, 129, 0.4)";
        } else {
            document.querySelector('.metric-card h3').textContent = "Overall CGPA";
            overallCgpaEl.style.color = "var(--primary)";
            overallCgpaEl.style.textShadow = "0 0 20px rgba(139, 92, 246, 0.4)";
        }
    }
});
