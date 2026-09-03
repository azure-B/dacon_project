const spendingEvaluationScheduler = require("./spendingEvaluation.scheduler");

function start() {
  return spendingEvaluationScheduler.start();
}

function stop() {
  return spendingEvaluationScheduler.stop();
}

module.exports = {
  start,
  stop,
  spendingEvaluationScheduler,
};
