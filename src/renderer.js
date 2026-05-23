// 初始化计时器
const timer = new Timer(25, 5);

// DOM 元素
const timerTimeEl = document.getElementById('timer-time');
const timerModeEl = document.getElementById('timer-mode');
const currentTaskEl = document.getElementById('current-task');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const settingsToggle = document.getElementById('settings-toggle');
const settingsContent = document.getElementById('settings-content');
const workDurationInput = document.getElementById('work-duration');
const breakDurationInput = document.getElementById('break-duration');
const soundEnabledInput = document.getElementById('sound-enabled');
const notificationEnabledInput = document.getElementById('notification-enabled');
const todayPomodorosEl = document.getElementById('today-pomodoros');
const todayWorkTimeEl = document.getElementById('today-work-time');
const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const closeModal = document.getElementById('close-modal');
const historyList = document.getElementById('history-list');

// 应用状态
let stats = loadStats();
let history = loadHistory();

// 加载保存的设置
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
    if (settings.workDuration) {
        workDurationInput.value = settings.workDuration;
        breakDurationInput.value = settings.breakDuration || 5;
        soundEnabledInput.checked = settings.soundEnabled !== false;
        notificationEnabledInput.checked = settings.notificationEnabled !== false;
        timer.setDurations(settings.workDuration, settings.breakDuration || 5);
    }
}

// 保存设置
function saveSettings() {
    const settings = {
        workDuration: parseInt(workDurationInput.value),
        breakDuration: parseInt(breakDurationInput.value),
        soundEnabled: soundEnabledInput.checked,
        notificationEnabled: notificationEnabledInput.checked
    };
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

// 加载统计
function loadStats() {
    const today = new Date().toDateString();
    const savedStats = JSON.parse(localStorage.getItem('pomodoroStats') || '{}');

    if (savedStats.date === today) {
        return savedStats;
    }

    return { date: today, pomodoros: 0, workTime: 0 };
}

// 保存统计
function saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// 加载历史
function loadHistory() {
    return JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');
}

// 保存历史
function saveHistory() {
    // 只保留最近30天的记录
    if (history.length > 30) {
        history = history.slice(-30);
    }
    localStorage.setItem('pomodoroHistory', JSON.stringify(history));
}

// 更新显示
function updateDisplay() {
    timerTimeEl.textContent = timer.getFormattedTime();
    timerModeEl.textContent = timer.isWorkMode ? '工作时间' : '休息时间';

    // 更新按钮状态
    startBtn.disabled = timer.isRunning;
    pauseBtn.disabled = !timer.isRunning;
}

// 更新统计显示
function updateStatsDisplay() {
    todayPomodorosEl.textContent = stats.pomodoros;
    todayWorkTimeEl.textContent = `${stats.workTime}分钟`;
}

// 播放声音
function playSound() {
    if (!soundEnabledInput.checked) return;

    // 创建简单的提示音
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// 显示通知
function showNotification(title, body) {
    if (!notificationEnabledInput.checked) return;

    if (window.electronAPI) {
        window.electronAPI.showNotification(title, body);
    } else {
        // Web 通知作为后备
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            });
        }
    }
}

// 计时器回调
timer.onTick = (timeRemaining) => {
    updateDisplay();
};

timer.onComplete = (wasWorkMode) => {
    playSound();

    if (wasWorkMode) {
        const task = currentTaskEl.value.trim();
        stats.pomodoros++;
        stats.workTime += parseInt(workDurationInput.value);

        // 添加到历史记录
        const today = new Date().toDateString();
        const historyEntry = {
            date: today,
            timestamp: Date.now(),
            task: task || '未命名任务',
            duration: parseInt(workDurationInput.value)
        };
        history.push(historyEntry);

        saveStats();
        saveHistory();
        updateStatsDisplay();

        showNotification('工作时间结束！', '休息一下吧，你完成了一个番茄钟！🍅');
    } else {
        showNotification('休息时间结束！', '准备好开始下一个番茄钟了吗？💪');
    }

    updateDisplay();
};

// 事件监听器
startBtn.addEventListener('click', () => {
    timer.start();
    updateDisplay();
});

pauseBtn.addEventListener('click', () => {
    timer.pause();
    updateDisplay();
});

resetBtn.addEventListener('click', () => {
    timer.reset();
    updateDisplay();
});

settingsToggle.addEventListener('click', () => {
    settingsToggle.classList.toggle('active');
    settingsContent.classList.toggle('active');
});

// 设置变更监听
workDurationInput.addEventListener('change', () => {
    const workDuration = parseInt(workDurationInput.value);
    const breakDuration = parseInt(breakDurationInput.value);
    timer.setDurations(workDuration, breakDuration);
    saveSettings();
    updateDisplay();
});

breakDurationInput.addEventListener('change', () => {
    const workDuration = parseInt(workDurationInput.value);
    const breakDuration = parseInt(breakDurationInput.value);
    timer.setDurations(workDuration, breakDuration);
    saveSettings();
});

soundEnabledInput.addEventListener('change', saveSettings);
notificationEnabledInput.addEventListener('change', saveSettings);

// 历史记录模态框
historyBtn.addEventListener('click', () => {
    showHistoryModal();
    historyModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    historyModal.classList.add('hidden');
});

historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        historyModal.classList.add('hidden');
    }
});

// 显示历史记录模态框
function showHistoryModal() {
    historyList.innerHTML = '';

    // 按日期分组
    const groupedHistory = {};
    history.forEach(entry => {
        if (!groupedHistory[entry.date]) {
            groupedHistory[entry.date] = [];
        }
        groupedHistory[entry.date].push(entry);
    });

    // 显示最近7天的记录
    const dates = Object.keys(groupedHistory).slice(-7).reverse();

    dates.forEach(date => {
        const entries = groupedHistory[date];
        const totalPomodoros = entries.length;
        const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);

        const itemEl = document.createElement('div');
        itemEl.className = 'history-item';
        itemEl.innerHTML = `
            <div class="history-date">${formatDate(date)}</div>
            <div class="history-stats">
                完成 ${totalPomodoros} 个番茄 · 累计工作 ${totalMinutes} 分钟
            </div>
        `;
        historyList.appendChild(itemEl);
    });

    if (dates.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #999;">暂无历史记录</p>';
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toDateString()) {
        return '今天';
    } else if (dateString === yesterday.toDateString()) {
        return '昨天';
    } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
}

// 初始化
loadSettings();
updateDisplay();
updateStatsDisplay();