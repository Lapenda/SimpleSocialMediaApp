const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

module.exports = (messagesCollection) => {
  

  //slanje poruke
  router.post('/', async (req, res) => {
    try {
      if(req.body.content === '') {
        return res.status(400).json({ message: 'Message cannot be empty' });
      }

      const message = {
        from: req.user.username,
        to: req.body.to,
        content: req.body.content,
        timestamp: new Date(),
        seen: false
      };

      const result = await messagesCollection.insertOne(message);
      res.status(201).json({ message: 'Message sent', id: result.insertedId });
    } catch (error) {
      res.status(500).send({ message: 'Failed to send message', error: error.message });
    }
  });

  //dohvatanje poruka između dva korisnika
  router.get('/:user1/:user2', async (req, res) => {
    try {
      const { user1, user2 } = req.params;
      const messages = await messagesCollection.find({
        $or: [
          { from: user1, to: user2 },
          { from: user2, to: user1 }
        ]
      }).sort({ timestamp: 1 }).toArray();

      res.status(200).json(messages);
    } catch (error) {
      res.status(500).send({ message: 'Failed to retrieve messages', error: error.message });
    }
  });

  //dohvacanje svih poruka korisnika
  router.get('/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const messages = await messagesCollection.find({
        $or: [
          { from: username },
          { to: username }
        ]
      }).sort({ timestamp: -1 }).toArray();
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).send({ message: 'Error fetching messages', error: error.message });
    }
  });

  //oznacavanje poruke kao procitane
  router.put('/:messageId/seen', async (req, res) => {
    try{
      const messageId = req.params.messageId;
      const result = await messagesCollection.updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { seen: true } }
      );
      res.status(200).json({ message: 'Message seen', result });
    }
    catch(error) {
      res.status(500).send({ message: 'Error marking message as seen', error: error.message });
    }
  });

  return router;
};