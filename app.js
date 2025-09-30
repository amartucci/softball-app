document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playerNameInput = document.getElementById('playerNameInput');
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const masterRosterList = document.getElementById('masterRosterList');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const generateLineupBtn = document.getElementById('generateLineupBtn');
    const liveGameSection = document.getElementById('liveGameSection');
    const battingOrderDisplay = document.getElementById('battingOrderDisplay');
    const nextBatterBtn = document.getElementById('nextBatterBtn');
    const positionsDisplay = document.getElementById('positionsDisplay');
    const saveGameBtn = document.getElementById('saveGameBtn');
    const statsDisplay = document.getElementById('statsDisplay');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    const rosterHeader = document.getElementById('rosterHeader');
    const rosterContent = document.getElementById('rosterContent');
    const showManualEntryFormBtn = document.getElementById('showManualEntryFormBtn');
    const manualEntryForm = document.getElementById('manualEntryForm');
    const manualEntryRows = document.getElementById('manualEntryRows');
    const addManualEntryRowBtn = document.getElementById('addManualEntryRowBtn');
    const saveManualGameBtn = document.getElementById('saveManualGameBtn');
    const cancelManualGameBtn = document.getElementById('cancelManualGameBtn');
    const printBtn = document.getElementById('printBtn');
    const generateStatusMessage = document.getElementById('generateStatusMessage');
    const generateBattingOrderCheckbox = document.getElementById('generateBattingOrderCheckbox');
    const battingOrderCard = document.getElementById('battingOrderCard');
    const exportDataBtn = document.getElementById('exportDataBtn'); // **** NEW ****
    const importFile = document.getElementById('importFile'); // **** NEW ****

    // App State
    let masterRoster = [];
    let gameRoster = [];
    let battingOrder = [];
    let positionAssignments = [];
    let seasonStats = {};

    const POSITIONS = {
        IF: ['Pitcher', 'Catcher', '1st Base', '2nd Base', '3rd Base', 'Shortstop'],
        OF: ['Left Field', 'Center Field', 'Right Field']
    };
    const ALL_POSITIONS = [...POSITIONS.IF, ...POSITIONS.OF];

    // --- HELPER FUNCTION FOR STATUS MESSAGES ---
    function displayStatusMessage(message, type) {
        generateStatusMessage.textContent = message;
        generateStatusMessage.className = type;
        setTimeout(() => {
            generateStatusMessage.textContent = '';
            generateStatusMessage.className = '';
        }, 4000);
    }

    // --- DATA PERSISTENCE ---
    function saveAllData() {
        localStorage.setItem('softballMasterRoster', JSON.stringify(masterRoster));
        localStorage.setItem('softballSeasonStats', JSON.stringify(seasonStats));
    }

    function loadAllData() {
        const savedRosterJSON = localStorage.getItem('softballMasterRoster');
        if (savedRosterJSON) {
            let parsedRoster = JSON.parse(savedRosterJSON);
            if (parsedRoster.length > 0 && typeof parsedRoster[0] === 'string') {
                masterRoster = parsedRoster.map(name => ({ name: name, isPitcher: false }));
                saveAllData(); 
            } else {
                masterRoster = parsedRoster;
            }
        }
        const savedStats = localStorage.getItem('softballSeasonStats');
        if (savedStats) {
            seasonStats = JSON.parse(savedStats);
        }
        renderMasterRoster();
        renderSeasonStats();
    }

    // --- **** NEW IMPORT/EXPORT FUNCTIONS **** ---
    function exportData() {
        const headers = ['Name', 'IsPitcher', ...ALL_POSITIONS];
        let csvContent = headers.join(',') + '\n';

        masterRoster.forEach(player => {
            const row = [player.name, player.isPitcher];
            const playerStats = seasonStats[player.name] || {};
            
            ALL_POSITIONS.forEach(pos => {
                row.push(playerStats[pos] || 0);
            });
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `softball-roster-backup-${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            if (!confirm('Are you sure you want to import this data? This will overwrite all existing player and stats data.')) {
                return;
            }

            try {
                const lines = text.split('\n').filter(line => line);
                const headers = lines.shift().split(',').map(h => h.trim());
                
                const newRoster = [];
                const newStats = {};

                lines.forEach(line => {
                    const values = line.split(',');
                    const name = values[0];
                    const isPitcher = values[1] === 'true';

                    newRoster.push({ name, isPitcher });
                    newStats[name] = {};

                    headers.slice(2).forEach((pos, index) => {
                        const count = parseInt(values[index + 2], 10);
                        if (count > 0) {
                            newStats[name][pos] = count;
                        }
                    });
                });

                masterRoster = newRoster;
                seasonStats = newStats;
                saveAllData();
                loadAllData(); // Reload and re-render everything
                alert('Data imported successfully!');
            } catch (error) {
                alert('Failed to import data. Please check the file format.');
                console.error(error);
            } finally {
                // Reset file input to allow re-uploading the same file
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    }

    // --- ROSTER MANAGEMENT ---
    function addPlayer() {
        const playerName = playerNameInput.value.trim();
        if (playerName && !masterRoster.some(p => p.name === playerName)) {
            masterRoster.push({ name: playerName, isPitcher: false });
            saveAllData();
            renderMasterRoster();
            playerNameInput.value = '';
        }
    }

    function removePlayer(playerName) {
        masterRoster = masterRoster.filter(p => p.name !== playerName);
        saveAllData();
        renderMasterRoster();
    }
    
    function togglePitcherStatus(playerName) {
        const player = masterRoster.find(p => p.name === playerName);
        if (player) {
            player.isPitcher = !player.isPitcher;
            saveAllData();
            renderMasterRoster();
        }
    }

    function renderMasterRoster() {
        masterRosterList.innerHTML = '';
        masterRoster.forEach(player => {
            const li = document.createElement('li');
            li.className = 'player-item';
            li.innerHTML = `
                <div class="player-name-and-checkbox">
                    <label>
                        <input type="checkbox" class="player-checkbox" value="${player.name}">
                        ${player.name}
                    </label>
                </div>
                <button class="pitcher-toggle ${player.isPitcher ? 'active' : ''}" data-player-name="${player.name}">P</button>
                <button class="remove-btn" data-player="${player.name}">✖</button>
            `;
            masterRosterList.appendChild(li);
        });
    }
    
    function toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.player-checkbox');
        const shouldSelectAll = checkboxes.length > 0 && !checkboxes[0].checked;
        checkboxes.forEach(cb => {
            cb.checked = shouldSelectAll;
        });
    }

    // --- LINEUP GENERATION ---
    function generateLineup() {
        gameRoster = Array.from(document.querySelectorAll('.player-checkbox:checked')).map(cb => cb.value);
        if (gameRoster.length < ALL_POSITIONS.length) {
            displayStatusMessage(`Failed: Need ${ALL_POSITIONS.length} players.`, 'failure');
            return;
        }
        if (generateBattingOrderCheckbox.checked) {
            battingOrder = shuffleArray([...gameRoster]);
            battingOrderCard.classList.remove('hidden');
        } else {
            battingOrder = [];
            battingOrderCard.classList.add('hidden');
        }
        renderBattingOrder();
        generatePositions();
        renderPositions();
        liveGameSection.classList.remove('hidden');
        saveGameBtn.disabled = false;
        saveGameBtn.textContent = 'Save Game to Stats';
        displayStatusMessage('Lineup generated!', 'success');
    }

    // --- MANUAL ENTRY FUNCTIONS ---
    function showManualEntryForm() {
        manualEntryForm.classList.remove('hidden');
        manualEntryRows.innerHTML = ''; 
        addManualEntryRow(); 
    }

    function hideManualEntryForm() {
        manualEntryForm.classList.add('hidden');
    }

    function addManualEntryRow() {
        const row = document.createElement('div');
        row.className = 'manual-entry-row';
        const playerOptions = masterRoster.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
        const playerSelect = `<select class="player-select"><option value="">-- Select Player --</option>${playerOptions}</select>`;
        const positionOptions = ALL_POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('');
        const positionSelect = `<select class="position-select"><option value="">-- Select Position --</option>${positionOptions}</select>`;
        row.innerHTML = `${playerSelect}${positionSelect}<input type="number" class="inning-count" min="1" value="1"><button class="remove-row-btn">✖</button>`;
        manualEntryRows.appendChild(row);
    }
    
    function saveManualGame() {
        const rows = document.querySelectorAll('.manual-entry-row');
        let gameDataValid = true;
        rows.forEach(row => {
            const player = row.querySelector('.player-select').value;
            const position = row.querySelector('.position-select').value;
            const count = parseInt(row.querySelector('.inning-count').value, 10);
            if (!player || !position || isNaN(count) || count < 1) {
                gameDataValid = false;
                return;
            }
            if (!seasonStats[player]) seasonStats[player] = {};
            seasonStats[player][position] = (seasonStats[player][position] || 0) + count;
        });
        if (!gameDataValid) {
            alert('Please make sure every row has a player, position, and a valid count.');
            return;
        }
        saveAllData();
        renderSeasonStats();
        hideManualEntryForm();
        alert('Manual game data saved successfully!');
    }

    // --- STATS FUNCTIONS ---
    function saveGameStats() {
        if (positionAssignments.length === 0) return;
        positionAssignments.forEach(inningData => {
            for (const position in inningData.positions) {
                const player = inningData.positions[position];
                if (player) {
                    if (!seasonStats[player]) seasonStats[player] = {};
                    seasonStats[player][position] = (seasonStats[player][position] || 0) + 1;
                }
            }
        });
        saveAllData();
        renderSeasonStats();
        alert('Game stats have been saved!');
        saveGameBtn.disabled = true;
        saveGameBtn.textContent = 'Game Saved!';
    }
    
    function renderSeasonStats() {
        statsDisplay.innerHTML = '';
        const players = Object.keys(seasonStats).sort();
        if (players.length === 0) {
            statsDisplay.innerHTML = '<p>No stats saved yet. Save a game to see player history.</p>';
            return;
        }
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-stats';
            const playerName = document.createElement('h4');
            playerName.textContent = player;
            playerDiv.appendChild(playerName);
            const positionCounts = document.createElement('div');
            positionCounts.className = 'position-counts';
            const positionsPlayed = Object.keys(seasonStats[player]).sort((a,b) => seasonStats[player][b] - seasonStats[player][a]);
            positionCounts.textContent = positionsPlayed.map(pos => `${pos}: ${seasonStats[player][pos]}`).join(' | ');
            playerDiv.appendChild(positionCounts);
            statsDisplay.appendChild(playerDiv);
        });
    }

    function resetSeasonStats() {
        if (confirm('Are you sure you want to permanently delete all season stats? This cannot be undone.')) {
            seasonStats = {};
            saveAllData();
            renderSeasonStats();
            alert('All season stats have been cleared.');
        }
    }

    // --- POSITION GENERATION ---
    function generatePositions() {
        positionAssignments = [];
        const playerGameHistory = {}; 
        for (let inning = 1; inning <= 3; inning++) {
            let playersForThisInning = shuffleArray([...gameRoster]).slice(0, ALL_POSITIONS.length);
            let bench = gameRoster.filter(p => !playersForThisInning.includes(p));
            let inningAssignments = { inning: inning, positions: {}, bench: bench };
            let availablePositions = [...ALL_POSITIONS];
            let availablePlayers = [...playersForThisInning];
            while (availablePositions.length > 0) {
                let bestAssignment = { player: null, position: null, score: -Infinity };
                for (const player of availablePlayers) {
                    for (const position of availablePositions) {
                        let currentScore = 0;
                        if (position === 'Pitcher') {
                            const playerData = masterRoster.find(p => p.name === player);
                            if (!playerData || !playerData.isPitcher) continue;
                        }
                        const playerStats = seasonStats[player] || {};
                        const seasonCount = playerStats[position] || 0;
                        currentScore += 1000 / (seasonCount + 1);
                        if (playerGameHistory[player] && playerGameHistory[player].length > 0) {
                            const lastPos = playerGameHistory[player][playerGameHistory[player].length - 1];
                            if (getPositionType(lastPos) !== getPositionType(position)) currentScore += 500;
                        }
                        if (playerGameHistory[player] && playerGameHistory[player].includes(position)) {
                            currentScore -= 10000;
                        }
                        if (currentScore > bestAssignment.score) {
                            bestAssignment = { player, position, score: currentScore };
                        }
                    }
                }
                if (bestAssignment.player === null) {
                    console.error("Algorithm Error: Could not find any assignment. Assigning randomly.");
                    bestAssignment.player = availablePlayers[0];
                    bestAssignment.position = availablePositions[0];
                }
                const { player, position } = bestAssignment;
                inningAssignments.positions[position] = player;
                availablePlayers = availablePlayers.filter(p => p !== player);
                availablePositions = availablePositions.filter(p => p !== position);
            }
            for (const pos in inningAssignments.positions) {
                const p = inningAssignments.positions[pos];
                if (!playerGameHistory[p]) playerGameHistory[p] = [];
                playerGameHistory[p].push(pos);
            }
            positionAssignments.push(inningAssignments);
        }
    }

    // --- CORE LOGIC ---
    function nextBatter() {
        if (battingOrder.length > 0) {
            const upToBat = battingOrder.shift();
            battingOrder.push(upToBat);
            renderBattingOrder();
        }
    }

    function renderBattingOrder() {
        battingOrderDisplay.innerHTML = '';
        if (battingOrder.length === 0) return;
        const ol = document.createElement('ol');
        battingOrder.forEach((player, index) => {
            const li = document.createElement('li');
            let label = '';
            if (index === 0) {
                li.className = 'current-batter';
                label = '<small>Now Batting:</small>';
            } else if (index === 1) {
                li.className = 'on-deck';
                label = '<small>On Deck:</small>';
            } else if (index === 2) {
                li.className = 'in-the-hole';
                label = '<small>In the Hole:</small>';
            }
            li.innerHTML = `${label}${player}`;
            ol.appendChild(li);
        });
        battingOrderDisplay.appendChild(ol);
    }

    function renderPositions() {
        positionsDisplay.innerHTML = '';
        positionAssignments.forEach(inningData => {
            const inningHeader = document.createElement('h3');
            inningHeader.textContent = `Inning ${inningData.inning}`;
            positionsDisplay.appendChild(inningHeader);
            const table = document.createElement('table');
            let tableHTML = '<thead><tr><th>Position</th><th>Player</th></tr></thead><tbody>';
            ALL_POSITIONS.forEach(pos => {
                tableHTML += `<tr><td>${pos}</td><td>${inningData.positions[pos] || ''}</td></tr>`;
            });
            if (inningData.bench.length > 0) {
                 tableHTML += `<tr><td><strong>Bench</strong></td><td>${inningData.bench.join(', ')}</td></tr>`;
            }
            tableHTML += '</tbody>';
            table.innerHTML = tableHTML;
            positionsDisplay.appendChild(table);
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function getPositionType(position) {
        if (POSITIONS.IF.includes(position)) return 'IF';
        if (POSITIONS.OF.includes(position)) return 'OF';
        return null;
    }

    // --- EVENT LISTENERS ---
    addPlayerBtn.addEventListener('click', addPlayer);
    masterRosterList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            removePlayer(e.target.dataset.player);
        }
        if (e.target.classList.contains('pitcher-toggle')) {
            togglePitcherStatus(e.target.dataset.playerName);
        }
    });
    selectAllBtn.addEventListener('click', toggleSelectAll);
    generateLineupBtn.addEventListener('click', generateLineup);
    nextBatterBtn.addEventListener('click', nextBatter);
    saveGameBtn.addEventListener('click', saveGameStats);
    resetStatsBtn.addEventListener('click', resetSeasonStats);
    rosterHeader.addEventListener('click', () => {
        rosterHeader.classList.toggle('collapsed');
        rosterContent.classList.toggle('collapsed');
    });
    showManualEntryFormBtn.addEventListener('click', showManualEntryForm);
    cancelManualGameBtn.addEventListener('click', hideManualEntryForm);
    addManualEntryRowBtn.addEventListener('click', addManualEntryRow);
    saveManualGameBtn.addEventListener('click', saveManualGame);
    manualEntryRows.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row-btn')) {
            e.target.parentElement.remove();
        }
    });
    printBtn.addEventListener('click', () => {
        window.print();
    });
    exportDataBtn.addEventListener('click', exportData); // **** NEW ****
    importFile.addEventListener('change', importData); // **** NEW ****

    // Initial Load
    loadAllData();

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});