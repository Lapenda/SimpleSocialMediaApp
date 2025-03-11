const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

module.exports = (likesCollection, postsCollection) => {

  // provjera je li korisnik lajkao post
  router.get('/:postId/like/:username', async (req, res) => {
    try {
      const postId = new ObjectId(req.params.postId);
      const username = req.params.username;
  
      const like = await likesCollection.findOne({ postId: postId, username: username });
  
      res.json(!!like);
    } catch (error) {
      res.status(500).json({ message: 'Error checking like status', error: error.message });
    }
  });

  // lajkanje posta
  router.post('/:postId/like', async (req, res) => {
    try {
      const postId = new ObjectId(req.params.postId);
      const username = req.user.username;

      const like = {
        postId: postId,
        username: username,
        timestamp: new Date()
      };
      const result = await likesCollection.insertOne(like);

      await postsCollection.updateOne(
        { _id: postId },
        { $addToSet: { likes: username } }
      );


      res.status(201).json({ message: 'Post je uspješno lajkovan', id: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: 'Greška pri lajkovanju posta', error: error.message });
    }
  });

  // dislajk posta
  router.delete('/:postId/like', async (req, res) => {

    try {
      
      const postId = new ObjectId(req.params.postId);
      const username = req.user.username;
    
      const result = await likesCollection.deleteOne({ postId: postId, username: username });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Lajk nije pronađen ili već je uklonjen' });
      }
  
      await postsCollection.updateOne(
        { _id: postId },
        { $pull: { likes: username } }
      );
  
      res.json({ message: 'Lajk je uspješno uklonjen' });
    } catch (error) {
      res.status(500).json({ message: 'Greška pri uklanjanju lajka', error: error.message });
    }
  });

  //dohvaćanje svih lajkova za određeni post
  router.get('/:postId/likes', async (req, res) => {
    try {
      const likes = await likesCollection.find({ post: req.params.postId }).toArray();
      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: 'Greška pri dohvaćanju lajkova', error: error.message });
    }
  });
  
  return router;
};