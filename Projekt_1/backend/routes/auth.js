const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const router = express.Router();

module.exports = (usersCollection) => {
  // registracija
  router.post('/register', async (req, res) => {
    try {
      if (!req.body.name || req.body.name.length < 3) {
        return res.status(400).send({ message: 'Name is required and must be at least 3 characters long.' });
      }
  
      if (!req.body.username || req.body.username.length < 4) {
        return res.status(400).send({ message: 'Username is required and must be at least 4 characters long.' });
      }
  
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      if (!req.body.email || !emailRegex.test(req.body.email)) {
        return res.status(400).send({ message: 'A valid email address is required.' });
      }
  
      if (!req.body.password || req.body.password.length < 6) {
        return res.status(400).send({ message: 'Password is required and must be at least 6 characters long.' });
      }
  
      if (req.body.password !== req.body.password_repeated) {
        return res.status(400).send({ message: 'Passwords do not match.' });
      }
  
      const existingUser = await usersCollection.findOne({ username: req.body.username });
      if (existingUser) {
        return res.status(400).send({ message: 'Username already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = {
        _id: new ObjectId(),
        name: req.body.name,
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
        role: req.body.role || false,
        timestamp: new Date()
      };
  
      const result = await usersCollection.insertOne(user);
      res.status(201).send({ message: 'User registered successfully', id: result.insertedId });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  });
  
    
  // login
  router.post('/login', async (req, res) => {
    try {
      const user = await usersCollection.findOne({ username: req.body.username });
      if (user && await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ userId: user._id.toString(), username: user.username, role: user.role }, 'qwert12345zuio67890p');
        res.send({ token, user: { userId: user._id.toString(), name: user.name, username: user.username, email: user.email, role: user.role } });
      } else {
        res.status(400).send({ message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  });

  return router;
};