class Timer {
    constructor(workDuration = 25, breakDuration = 5) {
        this.workDuration = workDuration * 60; // 转换为秒
        this.breakDuration = breakDuration * 60;
        this.timeRemaining = this.workDuration;
        this.isRunning = false;
        this.isWorkMode = true;
        this.interval = null;
        this.onTick = null;
        this.onComplete = null;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.interval = setInterval(() => {
            this.timeRemaining--;

            if (this.onTick) {
                this.onTick(this.timeRemaining);
            }

            if (this.timeRemaining <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    reset() {
        this.pause();
        this.isWorkMode = true;
        this.timeRemaining = this.workDuration;
        if (this.onTick) {
            this.onTick(this.timeRemaining);
        }
    }

    complete() {
        this.pause();

        if (this.onComplete) {
            this.onComplete(this.isWorkMode);
        }

        // 切换模式
        this.isWorkMode = !this.isWorkMode;
        this.timeRemaining = this.isWorkMode ? this.workDuration : this.breakDuration;

        if (this.onTick) {
            this.onTick(this.timeRemaining);
        }
    }

    setDurations(workDuration, breakDuration) {
        this.workDuration = workDuration * 60;
        this.breakDuration = breakDuration * 60;

        if (!this.isRunning) {
            this.timeRemaining = this.isWorkMode ? this.workDuration : this.breakDuration;
            if (this.onTick) {
                this.onTick(this.timeRemaining);
            }
        }
    }

    getFormattedTime() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getProgress() {
        const totalTime = this.isWorkMode ? this.workDuration : this.breakDuration;
        return (totalTime - this.timeRemaining) / totalTime;
    }
}