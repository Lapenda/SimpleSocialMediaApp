const express = require('express');
const { ObjectId, Double } = require('mongodb');

const router = express.Router();

module.exports = (commentsCollection, postsCollection) => {
  
   // dodadavanja
   router.post('/:postId/comment', async (req, res) => {
    try {
      const postId = new ObjectId(req.params.postId);

      const comment = {
        postId: postId,
        content: req.body.comment,
        username: req.user.username,
        timestamp: new Date()
      };
      
      const result = await commentsCollection.insertOne(comment);
      
      await postsCollection.updateOne(
        { _id: postId },
        { $push: { comments: result.insertedId } }
      );
      
      res.status(201).send({ message: 'Comment added', commentId: result.insertedId.toString() });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  });
  
    
  // uređivanje
  router.put('/:commentId', async (req, res) => {
    try {
      const commentId = new ObjectId(req.params.commentId);
      const update = { content: req.body.content + ' (edited)' };

      let result;

      if(req.user.role) {
        result = await commentsCollection.updateOne(
          { _id: commentId },
          { $set: update }
        );
      } else {
        result = await commentsCollection.updateOne(
          { _id: commentId, username: req.user.username },
          { $set: update }
        );
      }
      
      if (result.modifiedCount === 0) {
        return res.status(404).send({ message: 'Comment not found or you do not have permission to edit' });
      }
      
      res.send({ message: 'Comment updated', ...update });
    } catch (error) {
      console.log(error.message);
      res.status(500).send(error);
    }
  });

  // brisanje
  router.delete('/:commentId', async (req, res) => {
    try {
      const commentId = new ObjectId(req.params.commentId);
      
      const comment = await commentsCollection.findOne({ _id: commentId });

      if (!comment) {
        return res.status(404).send({ message: 'Comment not found' });
      }

      let result;

      if(req.user.role) {
        result = await commentsCollection.deleteOne({
          _id: commentId,
        });
      } else {
        result = await commentsCollection.deleteOne({
          _id: commentId,
          username: req.user.username
        });
      }

      if (result.deletedCount === 0) {
        return res.status(404).send({ message: 'Comment not found or you do not have permission to delete' });
      }

      await postsCollection.updateOne(
        { comments: commentId },
        { $pull: { comments: commentId } }
      );

      res.send({ message: 'Comment deleted' });
    } catch (error) {
      res.status(500).send(error);
    }
  });


  // dohvacanje za pojedinacni post
  router.get('/:postId/comments', async (req, res) => {
    try {
      const postId = new ObjectId(req.params.postId);
  
      const post = await postsCollection.findOne({ _id: postId });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

        const comments = await commentsCollection.find({ postId: postId }).toArray();
  
      res.status(200).json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });

  // objavljivanje za pojedinacni komentar (nested)
  router.post('/:parentCommentId/reply', async (req, res) => {
    try {
      const parentCommentId = new ObjectId(req.params.parentCommentId);
      const parentComment = await commentsCollection.findOne({ _id: parentCommentId });

      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }

      const reply = {
        postId: parentComment.postId,
        content: req.body.content,
        username: req.user.username,
        timestamp: new Date(),
        parentCommentId: parentCommentId
      };
      
      const result = await commentsCollection.insertOne(reply);
      
      await commentsCollection.updateOne(
        { _id: parentCommentId },
        { $push: { replies: result.insertedId } }
      );
      
      res.status(201).send({ message: 'Reply added', replyId: result.insertedId.toString() });
    } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });


  // dohvacanje za pojedinacni komentar (nested)
  router.get('/:commentId/replies', async (req, res) => {
    try {

      const commentId = new ObjectId(req.params.commentId);
      const comment = await commentsCollection.findOne({ _id: commentId });

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      const replies = await commentsCollection.find({ parentCommentId: commentId }).toArray();

      res.status(200).json(replies);
    }
    catch (error) {
      console.error('Error fetching replies:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });

  return router;
};