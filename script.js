/* ============================================
   CPU Scheduling Simulator — Script
   Dark Dashboard Edition
   ============================================ */

// ─── Theme Toggle (Dark / Light Mode) ───────────────

function initTheme() {
    const saved = localStorage.getItem('cpu_simulator_theme') || 'dark';
    setTheme(saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cpu_simulator_theme', theme);

    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');

    if (theme === 'light') {
        if (icon) icon.className = 'fas fa-moon';
        if (label) label.textContent = 'Dark Mode';
    } else {
        if (icon) icon.className = 'fas fa-sun';
        if (label) label.textContent = 'Light Mode';
    }
}

// Initialize theme on load
initTheme();


// ─── Utility Functions ──────────────────────────────

function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = '⚠ ' + msg;
    el.classList.remove('hidden');
}

function hideError(id) {
    const el = document.getElementById(id);
    el.textContent = '';
    el.classList.add('hidden');
}

function isPositiveInteger(v) {
    const n = Number(v);
    return Number.isInteger(n) && n > 0;
}

function round2(v) {
    return Math.round(v * 100) / 100;
}

// Process gradient colors (matching CSS)
const PROC_COLORS = [
    '#4F46E5','#059669','#D97706','#DC2626','#7C3AED',
    '#2563EB','#DB2777','#0D9488','#65A30D','#EA580C',
    '#4338CA','#0D9488','#B45309','#BE123C','#6D28D9',
    '#1D4ED8','#BE185D','#0E7490','#4D7C0F','#C2410C'
];

function procColor(idx) {
    return PROC_COLORS[(idx - 1) % PROC_COLORS.length];
}

// Nav helpers
function scrollToResults() {
    const el = document.getElementById('ganttCard');
    if (el && !el.classList.contains('hidden')) el.scrollIntoView({ behavior: 'smooth' });
}
function scrollToComparison() {
    const el = document.getElementById('comparisonCard');
    if (el && !el.classList.contains('hidden')) el.scrollIntoView({ behavior: 'smooth' });
}
function toggleThemeInfo() {
    alert('CPU Scheduling Simulator\nAlgorithms: FCFS, SJF (Non-preemptive), Round Robin\n\nAll processes have Arrival Time = 0');
}


// ─── State ──────────────────────────────────────────

let simulationResults = {};
let currentTab = '';


// ─── Step 1: Generate Process Inputs ────────────────

function generateProcessInputs() {
    hideError('processCountError');
    const input = document.getElementById('processCount');
    const val = input.value.trim();

    if (val === '') {
        showError('processCountError', 'กรุณากรอกจำนวนโปรเซส');
        input.classList.add('input-error');
        return;
    }
    if (!isPositiveInteger(val)) {
        showError('processCountError', 'จำนวนโปรเซสต้องเป็นจำนวนเต็มบวก');
        input.classList.add('input-error');
        return;
    }
    const n = parseInt(val);
    if (n > 20) {
        showError('processCountError', 'จำนวนโปรเซสสูงสุดคือ 20');
        input.classList.add('input-error');
        return;
    }

    input.classList.remove('input-error');

    // Build BT inputs
    const area = document.getElementById('btScrollArea');
    area.innerHTML = '';

    for (let i = 1; i <= n; i++) {
        const row = document.createElement('div');
        row.className = 'bt-row';
        row.innerHTML = `
            <span class="bt-label">P${i}</span>
            <input type="number" id="bt_${i}" min="1" placeholder="BT" class="bt-input">
            <span class="bt-at">AT = 0</span>
        `;
        area.appendChild(row);
    }

    document.getElementById('burstSection').classList.remove('hidden');
    document.getElementById('algoSection').classList.remove('hidden');
    updateSelectedSummary();

    // Hide old results
    hideResults();
}


// ─── Step 2: Randomize ──────────────────────────────

function randomizeBurstTimes() {
    const n = parseInt(document.getElementById('processCount').value);
    for (let i = 1; i <= n; i++) {
        const inp = document.getElementById('bt_' + i);
        if (inp) {
            inp.value = Math.floor(Math.random() * 20) + 1;
            inp.classList.remove('input-error');
        }
    }
    hideError('burstTimeError');
}


// ─── Algorithm Card Toggle ──────────────────────────

function toggleAlgo(card) {
    card.classList.toggle('selected');

    // Show/hide RR quantum
    const rrCard = document.querySelector('.algo-card[data-algo="RR"]');
    document.getElementById('rrQuantumRow').style.display =
        rrCard.classList.contains('selected') ? 'flex' : 'none';

    updateSelectedSummary();
}

function updateSelectedSummary() {
    const cards = document.querySelectorAll('.algo-card.selected');
    const names = [];
    cards.forEach(c => {
        const a = c.dataset.algo;
        if (a === 'FCFS') names.push('FCFS');
        else if (a === 'SJF') names.push('SJF');
        else if (a === 'RR') names.push('Round Robin');
    });
    document.getElementById('selectedText').textContent =
        names.length > 0 ? 'Selected: ' + names.join(', ') : 'No algorithm selected';
}


// ─── Run Simulation ─────────────────────────────────

function runSimulation() {
    hideError('burstTimeError');
    hideError('quantumError');

    const n = parseInt(document.getElementById('processCount').value);
    const processes = [];
    let err = false;

    for (let i = 1; i <= n; i++) {
        const inp = document.getElementById('bt_' + i);
        const v = inp.value.trim();
        if (v === '') {
            showError('burstTimeError', `กรุณากรอก Burst Time ของ P${i}`);
            inp.classList.add('input-error');
            err = true; break;
        }
        if (!isPositiveInteger(v)) {
            showError('burstTimeError', `Burst Time ของ P${i} ต้องเป็นจำนวนเต็มบวก`);
            inp.classList.add('input-error');
            err = true; break;
        }
        inp.classList.remove('input-error');
        processes.push({ name: 'P' + i, index: i, at: 0, bt: parseInt(v) });
    }
    if (err) return;

    // Which algos?
    const runFCFS = document.querySelector('.algo-card[data-algo="FCFS"]').classList.contains('selected');
    const runSJF  = document.querySelector('.algo-card[data-algo="SJF"]').classList.contains('selected');
    const runRR   = document.querySelector('.algo-card[data-algo="RR"]').classList.contains('selected');

    if (!runFCFS && !runSJF && !runRR) {
        showError('quantumError', 'กรุณาเลือกอัลกอริทึมอย่างน้อย 1 ตัว');
        return;
    }

    let tq = 2;
    if (runRR) {
        const tqInp = document.getElementById('timeQuantum');
        const tqVal = tqInp.value.trim();
        if (tqVal === '' || !isPositiveInteger(tqVal)) {
            showError('quantumError', 'Time Quantum ต้องเป็นจำนวนเต็มบวก');
            tqInp.classList.add('input-error');
            return;
        }
        tqInp.classList.remove('input-error');
        tq = parseInt(tqVal);
    }

    // Status
    const dot = document.querySelector('.status-dot');
    dot.classList.add('running');
    setTimeout(() => dot.classList.remove('running'), 1500);

    // Compute
    const results = {};
    if (runFCFS) results['FCFS'] = computeFCFS(JSON.parse(JSON.stringify(processes)));
    if (runSJF)  results['SJF']  = computeSJF(JSON.parse(JSON.stringify(processes)));
    if (runRR)   results['RR']   = computeRR(JSON.parse(JSON.stringify(processes)), tq);

    simulationResults = results;
    displayResults(results, tq);
}


// ─── FCFS ───────────────────────────────────────────

function computeFCFS(procs) {
    const schedule = [];
    let t = 0;
    procs.forEach(p => {
        p.st = t;
        p.ct = t + p.bt;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        schedule.push({ name: p.name, index: p.index, start: t, end: p.ct });
        t = p.ct;
    });
    return { processes: procs, schedule };
}


// ─── SJF (Non-preemptive) ───────────────────────────

function computeSJF(procs) {
    const sorted = procs.slice().sort((a, b) => a.bt !== b.bt ? a.bt - b.bt : a.index - b.index);
    const schedule = [];
    let t = 0;
    sorted.forEach(p => {
        p.st = t;
        p.ct = t + p.bt;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        schedule.push({ name: p.name, index: p.index, start: t, end: p.ct });
        t = p.ct;
    });
    return { processes: sorted, schedule };
}


// ─── Round Robin ────────────────────────────────────

function computeRR(procs, quantum) {
    const n = procs.length;
    const rem = procs.map(p => p.bt);
    const st = new Array(n).fill(-1);
    const ct = new Array(n).fill(0);
    const schedule = [];
    let t = 0, done = 0;

    const q = [];
    for (let i = 0; i < n; i++) q.push(i);

    while (done < n) {
        if (q.length === 0) { t++; continue; }
        const idx = q.shift();
        if (st[idx] === -1) st[idx] = t;
        const exec = Math.min(quantum, rem[idx]);
        schedule.push({ name: procs[idx].name, index: procs[idx].index, start: t, end: t + exec });
        t += exec;
        rem[idx] -= exec;
        if (rem[idx] === 0) { ct[idx] = t; done++; }
        else q.push(idx);
    }

    procs.forEach((p, i) => {
        p.st = st[i];
        p.ct = ct[i];
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
    });
    return { processes: procs, schedule };
}


// ─── Display Results ────────────────────────────────

function displayResults(results, tq) {
    document.getElementById('emptyState').classList.add('hidden');

    const algoKeys = Object.keys(results);
    currentTab = algoKeys[0];

    // Build tabs
    const tabsDiv = document.getElementById('algoTabs');
    tabsDiv.innerHTML = '';
    algoKeys.forEach((key, i) => {
        const btn = document.createElement('button');
        btn.className = 'algo-tab' + (i === 0 ? ' active' : '');
        btn.dataset.algo = key;
        let label = key;
        if (key === 'RR') label = `RR (Q=${tq})`;
        btn.textContent = label;
        btn.onclick = () => switchTab(key, tq);
        tabsDiv.appendChild(btn);
    });

    // Show cards
    document.getElementById('ganttCard').classList.remove('hidden');
    document.getElementById('metricsCard').classList.remove('hidden');
    document.getElementById('detailsCard').classList.remove('hidden');

    // Render first tab
    renderAlgoResult(currentTab, results[currentTab], tq);

    // Comparison
    if (algoKeys.length > 1) {
        renderComparison(results, tq);
        document.getElementById('comparisonCard').classList.remove('hidden');
    } else {
        document.getElementById('comparisonCard').classList.add('hidden');
    }

    // Scroll window and panels to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const leftPanel = document.querySelector('.left-panel');
    if (leftPanel) leftPanel.scrollTo({ top: 0, behavior: 'smooth' });
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideResults() {
    ['ganttCard','metricsCard','detailsCard','comparisonCard'].forEach(id =>
        document.getElementById(id).classList.add('hidden')
    );
    document.getElementById('emptyState').classList.remove('hidden');
}


// ─── Switch Tab ─────────────────────────────────────

function switchTab(algo, tq) {
    currentTab = algo;
    document.querySelectorAll('.algo-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.algo-tab[data-algo="${algo}"]`).classList.add('active');
    renderAlgoResult(algo, simulationResults[algo], tq);
}


// ─── Render Algorithm Result ────────────────────────

function renderAlgoResult(algoName, result, tq) {
    const procs = result.processes;
    const schedule = result.schedule;
    const totalTime = schedule.length > 0 ? schedule[schedule.length - 1].end : 0;

    // ── Gantt Chart ──
    renderGanttChart(schedule, totalTime);

    // ── Metrics ──
    const avgWT  = round2(procs.reduce((s, p) => s + p.wt, 0) / procs.length);
    const avgTAT = round2(procs.reduce((s, p) => s + p.tat, 0) / procs.length);

    document.getElementById('metricsGrid').innerHTML = `
        <div class="metric-card mc-wt">
            <div class="metric-icon"><i class="fas fa-clock"></i></div>
            <div class="metric-label">Avg Waiting Time</div>
            <div class="metric-value">${avgWT}</div>
        </div>
        <div class="metric-card mc-tat">
            <div class="metric-icon"><i class="fas fa-chart-line"></i></div>
            <div class="metric-label">Avg Turnaround Time</div>
            <div class="metric-value">${avgTAT}</div>
        </div>
        <div class="metric-card mc-total">
            <div class="metric-icon"><i class="fas fa-arrow-trend-down"></i></div>
            <div class="metric-label">Total Execution Time</div>
            <div class="metric-value">${totalTime}</div>
        </div>
    `;

    // ── Process Details Table ──
    document.getElementById('detailsTable').innerHTML = `
        <table class="details-table">
            <thead>
                <tr>
                    <th>Process</th>
                    <th>AT</th>
                    <th>BT</th>
                    <th>ST</th>
                    <th>CT</th>
                    <th>TAT</th>
                    <th>WT</th>
                </tr>
            </thead>
            <tbody>
                ${procs.map(p => `
                    <tr>
                        <td class="proc-cell">${p.name}</td>
                        <td>${p.at}</td>
                        <td>${p.bt}</td>
                        <td>${p.st}</td>
                        <td>${p.ct}</td>
                        <td>${p.tat}</td>
                        <td>${p.wt}</td>
                    </tr>
                `).join('')}
                <tr class="avg-row">
                    <td colspan="5" style="text-align:right;">Average</td>
                    <td>${avgTAT}</td>
                    <td>${avgWT}</td>
                </tr>
            </tbody>
        </table>
    `;
}


// ─── Gantt Chart Rendering ──────────────────────────

function renderGanttChart(schedule, totalTime) {
    const container = document.getElementById('ganttContent');
    container.innerHTML = '';

    if (schedule.length === 0 || totalTime === 0) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'gantt-wrapper';

    // ── 1. Top Ruler (Exact Percentage Coordinates) ──
    const rulerContainer = document.createElement('div');
    rulerContainer.className = 'gantt-ruler-track';

    // Determine smart step for readable labels
    let step = 1;
    if (totalTime > 50) step = 5;
    else if (totalTime > 25) step = 2;

    const tickValues = [];
    for (let t = 0; t <= totalTime; t += step) {
        tickValues.push(t);
    }
    // Ensure final totalTime is rendered
    if (tickValues[tickValues.length - 1] !== totalTime) {
        if (totalTime - tickValues[tickValues.length - 1] < step * 0.6) {
            tickValues[tickValues.length - 1] = totalTime;
        } else {
            tickValues.push(totalTime);
        }
    }

    tickValues.forEach(t => {
        const tick = document.createElement('div');
        tick.className = 'gantt-ruler-tick';
        const pct = (t / totalTime) * 100;
        tick.style.left = pct + '%';
        tick.innerHTML = `
            <span class="tick-num">${t}</span>
            <span class="tick-line"></span>
        `;
        rulerContainer.appendChild(tick);
    });
    wrapper.appendChild(rulerContainer);

    // ── 2. Gantt Bar ──
    const track = document.createElement('div');
    track.className = 'gantt-bar-track';

    schedule.forEach((block, i) => {
        const seg = document.createElement('div');
        seg.className = `gantt-segment gc-${((block.index - 1) % 20) + 1}`;
        const flexVal = block.end - block.start;
        seg.style.flex = `${flexVal} 0 0`;
        seg.style.animationDelay = `${i * 0.08}s`;
        
        seg.innerHTML = `
            <span class="seg-name">${block.name}</span>
            <div class="g-tooltip">
                <strong>${block.name}</strong><br>
                เวลา: ${block.start} → ${block.end}<br>
                Burst Time: ${block.end - block.start} หน่วย
            </div>
        `;

        track.appendChild(seg);
    });
    wrapper.appendChild(track);

    // ── 3. Range labels directly under blocks (e.g. 0-16, 16-18, 18-29) ──
    const rangesRow = document.createElement('div');
    rangesRow.className = 'gantt-ranges-row';

    schedule.forEach(block => {
        const rangeCell = document.createElement('div');
        rangeCell.className = 'gantt-range-cell';
        const flexVal = block.end - block.start;
        rangeCell.style.flex = `${flexVal} 0 0`;
        rangeCell.innerHTML = `<span>${block.start} - ${block.end}</span>`;
        rangesRow.appendChild(rangeCell);
    });
    wrapper.appendChild(rangesRow);

    // ── 4. Exact Boundary Axis with Divider Marks ──
    const boundaryAxis = document.createElement('div');
    boundaryAxis.className = 'gantt-boundary-axis';

    const boundaryTimes = new Set();
    schedule.forEach(b => {
        boundaryTimes.add(b.start);
        boundaryTimes.add(b.end);
    });

    boundaryTimes.forEach(t => {
        const mark = document.createElement('div');
        mark.className = 'gantt-boundary-mark';
        const pct = (t / totalTime) * 100;
        mark.style.left = pct + '%';
        mark.innerHTML = `
            <span class="boundary-line"></span>
            <span class="boundary-num">${t}</span>
        `;
        boundaryAxis.appendChild(mark);
    });
    wrapper.appendChild(boundaryAxis);

    // ── 5. Legend ──
    const legend = document.createElement('div');
    legend.className = 'gantt-legend';
    const seen = new Set();
    schedule.forEach(block => {
        if (seen.has(block.index)) return;
        seen.add(block.index);
        const item = document.createElement('span');
        item.className = 'gantt-legend-item';
        item.innerHTML = `<span class="gantt-legend-dot" style="background:${procColor(block.index)}"></span>${block.name}`;
        legend.appendChild(item);
    });
    wrapper.appendChild(legend);

    // ── 6. Execution order ──
    const orderDiv = document.createElement('div');
    orderDiv.className = 'gantt-order';
    orderDiv.innerHTML = `<strong>Order:</strong> ${schedule.map(b => b.name).join(' → ')}`;
    wrapper.appendChild(orderDiv);

    container.appendChild(wrapper);
}


// ─── Comparison ─────────────────────────────────────

function renderComparison(results, tq) {
    const algoKeys = Object.keys(results);
    const data = algoKeys.map(key => {
        const procs = results[key].processes;
        const sched = results[key].schedule;
        const avgWT  = round2(procs.reduce((s, p) => s + p.wt, 0) / procs.length);
        const avgTAT = round2(procs.reduce((s, p) => s + p.tat, 0) / procs.length);
        const total = sched.length > 0 ? sched[sched.length - 1].end : 0;
        let displayName = key;
        if (key === 'RR') displayName = `Round Robin (Q=${tq})`;
        else if (key === 'SJF') displayName = 'SJF (Non-preemptive)';
        return { key, displayName, avgWT, avgTAT, total };
    });

    // Table
    document.getElementById('comparisonTable').innerHTML = `
        <table class="comparison-tbl">
            <thead>
                <tr>
                    <th>Algorithm</th>
                    <th>Avg WT</th>
                    <th>Avg TAT</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(d => `
                    <tr>
                        <td class="algo-name-cell">${d.displayName}</td>
                        <td>${d.avgWT}</td>
                        <td>${d.avgTAT}</td>
                        <td>${d.total}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Bar chart
    const maxWT = Math.max(...data.map(d => d.avgWT), 1);
    const barsDiv = document.getElementById('comparisonBars');
    barsDiv.innerHTML = '';
    data.forEach(d => {
        const h = Math.max((d.avgWT / maxWT) * 140, 6);
        const barClass = d.key === 'FCFS' ? 'bar-fcfs' : d.key === 'SJF' ? 'bar-sjf' : 'bar-rr';
        const item = document.createElement('div');
        item.className = 'chart-bar-item';
        item.innerHTML = `
            <div class="chart-bar-value">${d.avgWT}</div>
            <div class="chart-bar ${barClass}" style="height:${h}px"></div>
            <div class="chart-bar-label">${d.key === 'RR' ? 'RR(Q=' + tq + ')' : d.key}</div>
        `;
        barsDiv.appendChild(item);
    });

    // Best badge
    const best = data.reduce((m, d) => d.avgWT < m.avgWT ? d : m, data[0]);
    document.getElementById('bestBadge').innerHTML =
        `🏆 Best Average Waiting Time: <strong>${best.displayName}</strong> (${best.avgWT})`;
}


// ─── Init: RR quantum visibility ────────────────────

document.getElementById('processCount').addEventListener('keydown', e => {
    if (e.key === 'Enter') generateProcessInputs();
});
