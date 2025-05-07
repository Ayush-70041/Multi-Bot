// Extended simulation integrating canvas visualization with bidding concepts

class Robot {
  constructor(id, x, y, successRate) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.successRate = successRate;
    this.wantsHelp = false;
    this.gotHelp = false;
    this.bid = 0;
  }

  computeBid(humanModel, beliefDistribution, alpha) {
    // Adjust randomness to improve coverage of all possibilities
    const noiseRange = 0.4; // increased from 0.2
    const noisySuccessRate = this.successRate + (Math.random() - 0.5) * noiseRange;
    const autonomousValue = Math.max(0, noisySuccessRate) * 10;

    const expectedHumanSuccess = humanModel.estimateSuccess(beliefDistribution);
    const noisyHumanSuccess = expectedHumanSuccess + (Math.random() - 0.5) * noiseRange;
    const humanValue = Math.max(0, noisyHumanSuccess) * 12; // reduce multiplier slightly for balance

    const priorVar = humanModel.computeVariance(beliefDistribution);
    const postVar = humanModel.estimatePostVarAfterAction(beliefDistribution);
    const explorationBonus = priorVar - postVar;

    this.bid = (1 - alpha) * (humanValue - autonomousValue) + alpha * explorationBonus;
    this.wantsHelp = this.bid > 0;
    this.gotHelp = false;
  }
}

class HumanModel {
  constructor() {
    this.thetaRange = [0.3, 0.9];
  }

  sampleTheta() {
    return this.thetaRange[0] + Math.random() * (this.thetaRange[1] - this.thetaRange[0]);
  }

  estimateSuccess(beliefDistribution) {
    return beliefDistribution.reduce((sum, t) => sum + t, 0) / beliefDistribution.length;
  }

  computeVariance(beliefDistribution) {
    const mean = this.estimateSuccess(beliefDistribution);
    return beliefDistribution.reduce((sum, t) => sum + (t - mean) ** 2, 0) / beliefDistribution.length;
  }

  estimatePostVarAfterAction(beliefDistribution) {
    const sampled = beliefDistribution.slice(2, -2);
    return this.computeVariance(sampled);
  }
}

class Controller {
  constructor(robots, humanModel) {
    this.robots = robots;
    this.humanModel = humanModel;
    this.belief = Array.from({ length: 20 }, () => humanModel.sampleTheta());
  }

  runBidding(alpha = 0.5) {
    this.robots.forEach(r => r.computeBid(this.humanModel, this.belief, alpha));
    const topBidder = this.robots.reduce((a, b) => (a.bid > b.bid ? a : b));
    if (topBidder.wantsHelp) {
      topBidder.gotHelp = true;
      this.updateBelief();
    }
  }

  updateBelief() {
    this.belief = this.belief.slice(2, -2);
  }
}

window.onload = () => {
  const allRobotsCanvas = document.getElementById('allRobotsCanvas');
  const wantHelpCanvas = document.getElementById('wantHelpCanvas');
  const gotHelpCanvas = document.getElementById('gotHelpCanvas');

  const allRobotsCtx = allRobotsCanvas.getContext('2d');
  const wantHelpCtx = wantHelpCanvas.getContext('2d');
  const gotHelpCtx = gotHelpCanvas.getContext('2d');

  const robots = [
    new Robot(1, 50, 100, 0.7),
    new Robot(2, 200, 100, 0.5),
    new Robot(3, 350, 100, 0.9),
    new Robot(4, 500, 100, 0.6)
  ];

  const humanModel = new HumanModel();
  const controller = new Controller(robots, humanModel);

  function drawRobots(ctx, colorCondition) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    robots.forEach(robot => {
      ctx.fillStyle = colorCondition(robot);
      ctx.fillRect(robot.x, robot.y, 30, 30);
      ctx.fillStyle = 'black';
      ctx.fillText(`R${robot.id}`, robot.x + 5, robot.y - 5);
    });
  }

  function simulateBidding() {
    controller.runBidding(0.6);
    document.getElementById('robotData').value = JSON.stringify(robots);

    drawRobots(allRobotsCtx, () => 'blue');
    drawRobots(wantHelpCtx, robot => robot.wantsHelp ? 'red' : 'blue');
    drawRobots(gotHelpCtx, robot => robot.gotHelp ? 'green' : 'blue');
  }

  simulateBidding();
};
