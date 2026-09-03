const cron = require("node-cron");
const { aiConfig, PERIODS } = require("../config");
const spendingEvaluationModel = require("../models/spendingEvaluation.model");

let tasks = [];
let running = false;

async function runSafe(period, label) {
  if (running) {
    console.warn(`[evaluation] skip ${label}: previous job still running`);
    return;
  }
  running = true;
  try {
    const result = await spendingEvaluationModel.runPeriodPipeline(period);
    console.log(
      `[evaluation] ${label} done users=${result.count} providerKey=${result.apiKeyConfigured}`
    );
    return result;
  } catch (error) {
    console.error(`[evaluation] ${label} failed`, error.message || error);
    return null;
  } finally {
    running = false;
  }
}

function start() {
  if (!aiConfig.evaluation.schedulerEnabled) {
    console.log("[evaluation] scheduler disabled");
    return [];
  }

  stop();
  const { timezone } = aiConfig.evaluation;
  const { daily, weekly, monthly } = aiConfig.evaluation.cron;

  tasks = [
    cron.schedule(
      daily,
      () => runSafe(PERIODS.DAILY, "daily"),
      { timezone, noOverlap: true }
    ),
    cron.schedule(
      weekly,
      () => runSafe(PERIODS.WEEKLY, "weekly"),
      { timezone, noOverlap: true }
    ),
    cron.schedule(
      monthly,
      () => runSafe(PERIODS.MONTHLY, "monthly"),
      { timezone, noOverlap: true }
    ),
  ];

  console.log(
    `[evaluation] scheduler started tz=${timezone} daily="${daily}" weekly="${weekly}" monthly="${monthly}"`
  );
  return tasks;
}

function stop() {
  for (const task of tasks) {
    task.stop();
  }
  tasks = [];
}

module.exports = {
  start,
  stop,
  runSafe,
};
