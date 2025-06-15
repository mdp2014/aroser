document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentDate = new Date();
    let selectedDate = new Date();
    let tasks = JSON.parse(localStorage.getItem('gardenTasks')) || {};
    let currentTaskId = null;
    
    // Éléments DOM
    const currentMonthEl = document.getElementById('currentMonth');
    const calendarDaysEl = document.getElementById('calendarDays');
    const selectedDateEl = document.getElementById('selectedDate');
    const taskListEl = document.getElementById('taskList');
    const emptyStateEl = document.getElementById('emptyState');
    const taskModal = document.getElementById('taskModal');
    const taskDetailModal = document.getElementById('taskDetailModal');
    const tipsModal = document.getElementById('tipsModal');
    const infoModal = document.getElementById('infoModal');
    
    // Emojis pour les mois
    const monthEmojis = {
        0: '❄️', // Janvier
        1: '❄️', // Février
        2: '🌱', // Mars
        3: '🌷', // Avril
        4: '🌸', // Mai
        5: '☀️', // Juin
        6: '🌞', // Juillet
        7: '🌻', // Août
        8: '🍁', // Septembre
        9: '🍂', // Octobre
        10: '🍄', // Novembre
        11: '🎄'  // Décembre
    };
    
    // Emojis pour les catégories
    const categoryEmojis = {
        arrosage: '💧',
        plantation: '🌱',
        recolte: '🥕',
        entretien: '✂️',
        autre: '📝'
    };
    
    // Emojis pour les saisons
    const seasonEmojis = {
        'Printemps': '🌷',
        'Été': '☀️',
        'Automne': '🍂',
        'Hiver': '❄️'
    };
    
    // Initialisation
    renderCalendar();
    updateTaskList();
    
    // Gestionnaires d'événements pour la navigation des mois
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        addButtonAnimation('prevMonth');
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        addButtonAnimation('nextMonth');
    });
    
    // Gestionnaire pour l'ajout de tâche
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        currentTaskId = null;
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskCategory').value = 'arrosage';
        document.getElementById('taskNotes').value = '';
        document.getElementById('taskModalEmoji').textContent = '🌿';
        showModal(taskModal);
    });
    
    // Mise à jour de l'emoji lors du changement de catégorie
    document.getElementById('taskCategory').addEventListener('change', function() {
        document.getElementById('taskModalEmoji').textContent = categoryEmojis[this.value];
    });
    
    // Soumission du formulaire de tâche
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const category = document.getElementById('taskCategory').value;
        const notes = document.getElementById('taskNotes').value;
        
        const dateKey = formatDateKey(selectedDate);
        
        if (!tasks[dateKey]) {
            tasks[dateKey] = [];
        }
        
        if (currentTaskId !== null) {
            // Modification d'une tâche existante
            const taskIndex = tasks[dateKey].findIndex(task => task.id === currentTaskId);
            if (taskIndex !== -1) {
                tasks[dateKey][taskIndex] = {
                    id: currentTaskId,
                    title,
                    category,
                    notes
                };
            }
        } else {
            // Nouvelle tâche
            tasks[dateKey].push({
                id: Date.now(),
                title,
                category,
                notes
            });
        }
        
        localStorage.setItem('gardenTasks', JSON.stringify(tasks));
        hideModal(taskModal);
        updateTaskList();
        renderCalendar(); // Pour mettre à jour les indicateurs de tâches
        
        // Animation de confirmation
        showToast(currentTaskId ? 'Tâche modifiée ✅' : 'Tâche ajoutée ✅');
    });
    
    // Gestionnaires pour fermer les modals
    document.getElementById('closeTaskModal').addEventListener('click', () => hideModal(taskModal));
    document.getElementById('closeDetailModal').addEventListener('click', () => hideModal(taskDetailModal));
    document.getElementById('closeTipsModal').addEventListener('click', () => hideModal(tipsModal));
    document.getElementById('closeInfoModal').addEventListener('click', () => hideModal(infoModal));
    
    // Gestionnaire pour le bouton de conseils saisonniers
    document.getElementById('seasonalTipsBtn').addEventListener('click', showSeasonalTips);
    
    // Gestionnaire pour le bouton d'info
    document.getElementById('infoBtn').addEventListener('click', () => showModal(infoModal));
    
    // Gestionnaire pour la suppression de tâche
    document.getElementById('deleteTaskBtn').addEventListener('click', deleteCurrentTask);
    
    // Gestionnaire pour la modification de tâche
    document.getElementById('editTaskBtn').addEventListener('click', editCurrentTask);
    
    // Fonctions
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Mise à jour de l'en-tête du mois
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        currentMonthEl.innerHTML = `${monthEmojis[month]} ${monthNames[month]} ${year}`;
        
        // Calcul du premier jour du mois
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Ajustement pour commencer par lundi (1) au lieu de dimanche (0)
        let startingDayOfWeek = firstDay.getDay() - 1;
        if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Dimanche devient le 7ème jour
        
        // Nombre total de jours à afficher
        const totalDays = startingDayOfWeek + lastDay.getDate();
        // Nombre de semaines nécessaires
        const weeksNeeded = Math.ceil(totalDays / 7);
        
        // Vider le calendrier
        calendarDaysEl.innerHTML = '';
        
        // Ajouter les jours vides avant le premier jour du mois
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty bg-gray-100 rounded-md opacity-50';
            calendarDaysEl.appendChild(emptyDay);
        }
        
        // Ajouter les jours du mois
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day relative bg-white rounded-md flex items-center justify-center font-medium cursor-pointer hover:bg-green-50 transition';
            
            const currentDayDate = new Date(year, month, day);
            const dateKey = formatDateKey(currentDayDate);
            
            // Vérifier si ce jour a des tâches
            if (tasks[dateKey] && tasks[dateKey].length > 0) {
                dayEl.classList.add('has-tasks');
            }
            
            // Vérifier si c'est le jour sélectionné
            if (selectedDate.getDate() === day && 
                selectedDate.getMonth() === month && 
                selectedDate.getFullYear() === year) {
                dayEl.classList.add('active');
            }
            
            // Vérifier si c'est aujourd'hui
            const today = new Date();
            if (today.getDate() === day && 
                today.getMonth() === month && 
                today.getFullYear() === year) {
                dayEl.classList.add('ring-2', 'ring-green-500');
            }
            
            dayEl.textContent = day;
            dayEl.dataset.date = dateKey;
            
            dayEl.addEventListener('click', () => {
                // Mettre à jour la date sélectionnée
                selectedDate = new Date(year, month, day);
                
                // Mettre à jour l'affichage
                document.querySelectorAll('.calendar-day').forEach(el => {
                    el.classList.remove('active');
                });
                dayEl.classList.add('active');
                
                updateTaskList();
            });
            
            calendarDaysEl.appendChild(dayEl);
        }
        
        // Ajouter les jours vides après le dernier jour du mois pour compléter la grille
        const remainingCells = weeksNeeded * 7 - (startingDayOfWeek + lastDay.getDate());
        for (let i = 0; i < remainingCells; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty bg-gray-100 rounded-md opacity-50';
            calendarDaysEl.appendChild(emptyDay);
        }
    }
    
    function updateTaskList() {
        // Mise à jour de l'en-tête de date
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const formattedDate = selectedDate.toLocaleDateString('fr-FR', options);
        const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
        
        // Déterminer l'emoji du mois
        const monthEmoji = monthEmojis[selectedDate.getMonth()];
        selectedDateEl.innerHTML = `<span class="mr-2">${monthEmoji}</span> ${capitalizedDate}`;
        
        // Récupérer les tâches pour la date sélectionnée
        const dateKey = formatDateKey(selectedDate);
        const dayTasks = tasks[dateKey] || [];
        
        // Vider la liste des tâches
        taskListEl.innerHTML = '';
        
        // Afficher les tâches ou l'état vide
        if (dayTasks.length === 0) {
            emptyStateEl.classList.remove('hidden');
        } else {
            emptyStateEl.classList.add('hidden');
            
            dayTasks.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = `task-item ${task.category} bg-white rounded-lg p-4 shadow-sm flex items-center grow-animation`;
                
                // Icônes par catégorie
                const icons = {
                    arrosage: 'fa-droplet',
                    plantation: 'fa-seedling',
                    recolte: 'fa-carrot',
                    entretien: 'fa-scissors',
                    autre: 'fa-circle-info'
                };
                
                taskEl.innerHTML = `
                    <div class="category-icon bg-${task.category} mr-4">
                        <i class="fas ${icons[task.category]}"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium flex items-center">
                            ${task.title}
                        </h4>
                        ${task.notes ? `<p class="text-xs text-gray-500 mt-1 line-clamp-1">${task.notes}</p>` : ''}
                    </div>
                    <button class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                `;
                
                // Ajouter des effets spéciaux selon la catégorie
                if (task.category === 'arrosage') {
                    addRainEffect(taskEl);
                }
                
                taskEl.addEventListener('click', () => showTaskDetails(task));
                taskListEl.appendChild(taskEl);
            });
        }
    }
    
    function showTaskDetails(task) {
        currentTaskId = task.id;
        
        // Remplir les détails
        document.getElementById('detailTitle').textContent = task.title;
        document.getElementById('detailEmoji').textContent = categoryEmojis[task.category];
        
        const categoryNames = {
            arrosage: 'Arrosage',
            plantation: 'Plantation',
            recolte: 'Récolte',
            entretien: 'Entretien',
            autre: 'Autre'
        };
        
        document.getElementById('detailCategory').textContent = `${categoryEmojis[task.category]} ${categoryNames[task.category]}`;
        document.getElementById('detailNotes').textContent = task.notes || 'Aucune note';
        
        showModal(taskDetailModal);
    }
    
    function editCurrentTask() {
        if (!currentTaskId) return;
        
        const dateKey = formatDateKey(selectedDate);
        const task = tasks[dateKey].find(t => t.id === currentTaskId);
        
        if (task) {
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskNotes').value = task.notes || '';
            document.getElementById('taskModalEmoji').textContent = categoryEmojis[task.category];
            
            hideModal(taskDetailModal);
            showModal(taskModal);
        }
    }
    
    function deleteCurrentTask() {
        if (!currentTaskId) return;
        
        const dateKey = formatDateKey(selectedDate);
        
        if (tasks[dateKey]) {
            tasks[dateKey] = tasks[dateKey].filter(task => task.id !== currentTaskId);
            
            if (tasks[dateKey].length === 0) {
                delete tasks[dateKey];
            }
            
            localStorage.setItem('gardenTasks', JSON.stringify(tasks));
            hideModal(taskDetailModal);
            updateTaskList();
            renderCalendar(); // Pour mettre à jour les indicateurs de tâches
            
            // Animation de confirmation
            showToast('Tâche supprimée ✅');
        }
    }
    
    function showSeasonalTips() {
        const seasons = [
            { name: 'Printemps', months: [2, 3, 4] }, // Mars, Avril, Mai
            { name: 'Été', months: [5, 6, 7] }, // Juin, Juillet, Août
            { name: 'Automne', months: [8, 9, 10] }, // Septembre, Octobre, Novembre
            { name: 'Hiver', months: [11, 0, 1] } // Décembre, Janvier, Février
        ];
        
        const currentMonth = currentDate.getMonth();
        const currentSeason = seasons.find(season => season.months.includes(currentMonth));
        
        document.getElementById('seasonTitle').textContent = `Conseils pour le ${currentSeason.name}`;
        document.getElementById('seasonEmoji').textContent = seasonEmojis[currentSeason.name];
        
        const tipsContent = document.getElementById('seasonalTipsContent');
        tipsContent.innerHTML = '';
        
        const tips = getSeasonalTips(currentSeason.name);
        
        tips.forEach((tip, index) => {
            const tipEl = document.createElement('div');
            tipEl.className = 'tip-card bg-white rounded-lg p-4 shadow-sm';
            tipEl.style.animationDelay = `${index * 0.1}s`;
            tipEl.innerHTML = `
                <div class="flex items-start">
                    <div class="text-3xl mr-4">${tip.emoji}</div>
                    <div>
                        <h4 class="font-medium text-gray-800">${tip.title}</h4>
                        <p class="text-gray-600 mt-2">${tip.description}</p>
                    </div>
                </div>
            `;
            tipsContent.appendChild(tipEl);
            
            // Animation d'entrée
            setTimeout(() => {
                tipEl.classList.add('grow-animation');
            }, index * 100);
        });
        
        showModal(tipsModal);
    }
    
    function getSeasonalTips(season) {
        const tips = {
            'Printemps': [
                {
                    emoji: '🌱',
                    title: 'Semis et plantations',
                    description: 'C\'est le moment idéal pour semer les légumes d\'été comme les tomates, courgettes et aubergines en intérieur.'
                },
                {
                    emoji: '🌷',
                    title: 'Bulbes à fleurs',
                    description: 'Plantez les bulbes à floraison estivale comme les dahlias, glaïeuls et bégonias.'
                },
                {
                    emoji: '🐛',
                    title: 'Prévention des nuisibles',
                    description: 'Surveillez l\'apparition des premiers pucerons et intervenez rapidement avec des solutions naturelles.'
                },
                {
                    emoji: '🌿',
                    title: 'Taille de printemps',
                    description: 'Taillez les arbustes à floraison estivale et les rosiers pour favoriser une belle floraison.'
                },
                {
                    emoji: '🥬',
                    title: 'Légumes feuilles',
                    description: 'Semez les salades, épinards et autres légumes feuilles qui apprécient la fraîcheur du printemps.'
                }
            ],
            'Été': [
                {
                    emoji: '💧',
                    title: 'Arrosage régulier',
                    description: 'Arrosez tôt le matin ou tard le soir pour limiter l\'évaporation et économiser l\'eau.'
                },
                {
                    emoji: '🥒',
                    title: 'Récoltes estivales',
                    description: 'Récoltez régulièrement les légumes d\'été pour stimuler la production et éviter qu\'ils ne deviennent trop gros.'
                },
                {
                    emoji: '🌞',
                    title: 'Protection contre la chaleur',
                    description: 'Paillez le sol pour conserver l\'humidité et protéger les racines des plantes de la chaleur.'
                },
                {
                    emoji: '🌱',
                    title: 'Semis pour l\'automne',
                    description: 'Semez les légumes d\'automne et d\'hiver comme les choux, épinards et laitues d\'hiver.'
                },
                {
                    emoji: '🍅',
                    title: 'Entretien des tomates',
                    description: 'Supprimez les gourmands des tomates et attachez les tiges principales pour soutenir le poids des fruits.'
                }
            ],
            'Automne': [
                {
                    emoji: '🍂',
                    title: 'Nettoyage du jardin',
                    description: 'Ramassez les feuilles mortes pour faire du compost ou protéger les plantes sensibles au froid.'
                },
                {
                    emoji: '🌰',
                    title: 'Plantation d\'arbres',
                    description: 'C\'est la période idéale pour planter les arbres, arbustes et vivaces qui s\'enracineront avant l\'hiver.'
                },
                {
                    emoji: '🧄',
                    title: 'Bulbes de printemps',
                    description: 'Plantez les bulbes à floraison printanière comme les tulipes, narcisses et crocus.'
                },
                {
                    emoji: '🥕',
                    title: 'Récolte des légumes racines',
                    description: 'Récoltez les carottes, betteraves et pommes de terre avant les premières gelées.'
                },
                {
                    emoji: '🍏',
                    title: 'Récolte des fruits',
                    description: 'Récoltez les pommes, poires et autres fruits d\'automne à pleine maturité.'
                }
            ],
            'Hiver': [
                {
                    emoji: '❄️',
                    title: 'Protection contre le gel',
                    description: 'Protégez les plantes sensibles avec du voile d\'hivernage ou de la paille.'
                },
                {
                    emoji: '✂️',
                    title: 'Taille d\'hiver',
                    description: 'Taillez les arbres fruitiers et les arbustes à feuilles caduques pendant leur repos végétatif.'
                },
                {
                    emoji: '📝',
                    title: 'Planification du jardin',
                    description: 'Profitez de l\'hiver pour planifier votre jardin de l\'année prochaine et commander vos graines.'
                },
                {
                    emoji: '🐦',
                    title: 'Nourrissage des oiseaux',
                    description: 'Installez des mangeoires pour aider les oiseaux à passer l\'hiver, ils vous aideront à lutter contre les insectes nuisibles.'
                },
                {
                    emoji: '🌿',
                    title: 'Entretien des outils',
                    description: 'Nettoyez, affûtez et huilez vos outils de jardinage pour qu\'ils soient prêts au printemps.'
                }
            ]
        };
        
        return tips[season] || [];
    }
    
    function formatDateKey(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
    
    function showModal(modal) {
        modal.classList.remove('hidden');
        const modalContent = modal.querySelector('div');
        modalContent.classList.remove('slide-down');
        modalContent.classList.add('slide-up');
    }
    
    function hideModal(modal) {
        const modalContent = modal.querySelector('div');
        modalContent.classList.remove('slide-up');
        modalContent.classList.add('slide-down');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    
    function addButtonAnimation(buttonId) {
        const button = document.getElementById(buttonId);
        button.classList.add('animate-pulse');
        setTimeout(() => {
            button.classList.remove('animate-pulse');
        }, 300);
    }
    
    function addRainEffect(element) {
        // Créer des gouttes de pluie
        for (let i = 0; i < 3; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${20 + i * 10}px`;
            drop.style.animationDelay = `${i * 0.2}s`;
            drop.style.animation = 'rain 1.5s ease-in infinite';
            
            const iconContainer = element.querySelector('.category-icon');
            iconContainer.style.position = 'relative';
            iconContainer.style.overflow = 'hidden';
            iconContainer.appendChild(drop);
        }
    }
    
    function showToast(message) {
        // Créer un toast
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        
        document.body.appendChild(toast);
        
        // Afficher le toast
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // Cacher et supprimer le toast
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }
});
