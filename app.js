const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

mongoose.connect('mongodb+srv://ayushanand70041:ayush@multi-bot-database.gkodgyq.mongodb.net/?retryWrites=true&w=majority&appName=Multi-Bot-Database');

const Simulation = require('./models/Simulation');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/simulate', (req, res) => {
  res.render('simulate');
});

app.post('/simulate', async (req, res) => {
  const { robotData } = req.body;
  const sim = new Simulation({ robotData: JSON.parse(robotData) });
  await sim.save();
  res.redirect('/results');
});

app.get('/results', async (req, res) => {
  const sims = await Simulation.find({}).sort({ createdAt: -1 }).limit(10);
  res.render('results', { sims });
});

// NEW: Route to delete a simulation
app.post('/results/:id/delete', async (req, res) => {
  await Simulation.findByIdAndDelete(req.params.id);
  res.redirect('/results');
});

app.listen(3000, () => {
  console.log('Server on port 3000');
});
