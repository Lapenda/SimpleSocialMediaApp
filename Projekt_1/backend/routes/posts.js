const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

module.exports = (postsCollection, commentsCollection, likesCollection) => {

  //dohvacanje postova za chart
  router.get('/bla', async (req, res) => {
    try {
      const postsByDay = await postsCollection.aggregate([
        {
          $project: {
            timestamp: {
              $dateToString: { format: '%d-%m-%Y', date: '$timestamp' }
            },
            content: 1,
            username: 1
          }
        },
        {
          $group: {
            _id: '$timestamp',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray();
      
      res.status(200).json(postsByDay);
    } catch (error) {
      res.status(500).json({ message: 'Error processing your request', error: error.message });
    }
  });

  //postavljanje postova
  router.post('/', async (req, res) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).send({ message: 'User not authenticated' });
      }

      if (req.body.content === '' || !req.body.content) {
        return res.status(400).send({ message: 'Post cannot be empty' });
      }

      const post = {
        content: req.body.content,
        username: JSON.stringify(req.user.username).split('"').join(''),
        likes: [],
        comments: [],
        timestamp: new Date()
      };

      const result = await postsCollection.insertOne(post);
      res.status(201).send({ message: 'Post created', id: result.insertedId });
    } catch (error) {
      console.log(error.message);
      res.status(500).send(error);
    }
  });


  //dohvacanje svih postova
  router.get('/', async (req, res) => {
    try {
      const posts = await postsCollection.find({}).sort({ timestamp: -1 }).toArray();
      res.status(200).json(posts.map(post => ({
        ...post,
        postID: post._id.toString()
      })));
    } catch (error) {
      res.status(500).send(error);
    }
  });


  //dohvacanje jednog posta
  router.get('/:postID', async (req, res) => {
    try {
      const post = await postsCollection.findOne({ _id: new ObjectId(req.params.postID) });
      if (post) {
        res.status(200).json(post);
      } else {
        res.status(404).json({ message: 'Post not found' });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  });

  //uređivanje posta
  router.put('/:postId', async (req, res) => {
    try {
      const postId = new ObjectId(req.params.postId);
      const update = { content: req.body.content + ' (edited)' };
      
      let result;
      if(req.user.role) {
        result = await postsCollection.updateOne(
          { _id: postId },
          { $set: update }
        );
      } else {
        result = await postsCollection.updateOne(
          { _id: postId, 
            username: req.user.username },
          { $set: update }
        );
      }
      
      if (result.modifiedCount === 0) {
        return res.status(404).send({ message: 'Post not found or you do not have permission to edit' });
      }
      
      res.send({ message: 'Post updated', ...update });
    } catch (error) {
      res.status(500).send(error);
    }
  });


  //brisanje posta
  router.delete('/:postId', async (req, res) => {
    try {
      const postId = new ObjectId(req.params.postId);

      let result;

      if(req.user.role) {
        result = await postsCollection.deleteOne({ 
          _id: postId,
        });
      } else {
        result = await postsCollection.deleteOne({ 
          _id: postId, 
          username: req.user.username
        });
      }
     
      if (result) {
        const comments = await commentsCollection.find({ postId: postId }).toArray();
        for(const comment of comments) {
          await commentsCollection.deleteOne({ _id: comment._id });
        }
      
        const likes = await likesCollection.find({ postId: postId }).toArray();
        for (const like of likes) {
          await likesCollection.deleteOne({ _id: like._id });
        }
      };
      

      if (result.deletedCount === 0) {
        return res.status(404).send({ message: 'Post not found or you do not have permission to delete' });
      }

      res.send({ message: 'Post deleted' });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  return router;
};