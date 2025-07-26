"use strict";
// Generic Saga pattern implementation for orchestrating multi-step processes
// Each step is a function that returns a Promise. Each compensation is a function to undo the step if needed.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Saga = void 0;
class Saga {
    constructor() {
        this.steps = [];
        this.compensations = [];
    }
    addStep(step, compensation) {
        this.steps.push(step);
        // Compensations are unshifted so they run in reverse order on failure
        this.compensations.unshift(compensation);
        return this;
    }
    async execute() {
        let executedSteps = 0;
        try {
            for (const step of this.steps) {
                await step();
                executedSteps++;
            }
        }
        catch (error) {
            // Run compensations for executed steps in reverse order
            for (let i = 0; i < executedSteps; i++) {
                try {
                    await this.compensations[i]();
                }
                catch (compError) {
                    // Log or handle compensation error if needed
                }
            }
            throw error;
        }
    }
}
exports.Saga = Saga;
exports.default = Saga;
