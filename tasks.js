
class TaskQueue {
    constructor() {
        this.tasks = [];
        this.running = false;
    }

    addTask(task) {
        this.tasks.push(task);
        if (!this.running) {
            this.runNextTask();
        }
    }

    async runNextTask() {
        if (this.tasks.length > 0) {
            this.running = true;
            const task = this.tasks.shift();
            try {
                await task();
            } catch (error) {
                console.error('Error executing task:', error);
            }
            this.runNextTask();
        } else {
            this.running = false;
        }
    }
}

module.exports = {
    TaskQueue
};
