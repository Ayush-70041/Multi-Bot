const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  robotData: Array,
}, { timestamps: true });

module.exports = mongoose.model('Simulation', simulationSchema);
