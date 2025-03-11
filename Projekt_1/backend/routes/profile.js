const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

module.exports = (usersCollection, postsCollection, commentsCollection, likesCollection) => {

    // dohvatanje svih postova korisnika
    router.get('/:username', async (req, res) => {
        try {
        const user = await usersCollection.findOne({ username: req.params.username });
        if (user) {
            const posts = await postsCollection.find({ username: req.params.username }).sort({ timestamp: -1 }).toArray();
            res.status(200).json(posts.map(post => ({
            ...post,
            postID: post._id.toString()
            })));

        } else {
            res.status(404).json({ message: 'User not found' });
        }
        } catch (error) {
        res.status(500).send(error);
        }
    });

    // uređivanje korisnika
    router.put('/:username', async (req, res) => {
        try{
            const user = await usersCollection.findOne({ username: req.params.username });
            if(user){
                const result = await usersCollection.updateOne(
                    { username: req.params.username },
                    { $set: req.body }
                );
                const updatedUser = await usersCollection.findOne({ username: req.params.username });
                res.json(updatedUser);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            res.status(500).send(error);
        }
    });


    // brisanje korisnika
    router.delete('/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

            if (user) {
                let result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

                if (result) {
                    const posts = await postsCollection.find({ username: user.username }).toArray();
                    for(const post of posts) {
                        await postsCollection.deleteOne({ _id: post._id });
                    }

                    const comments = await commentsCollection.find({ username: user.username }).toArray();
                    for(const comment of comments) {
                      await commentsCollection.deleteOne({ _id: comment._id });
                    }
                      
                    const likes = await likesCollection.find({ username: user.username }).toArray();
                    for (const like of likes) {
                      await likesCollection.deleteOne({ _id: like._id });
                    }
                }

                res.status(200).json({ message: 'User deleted' });
            }
            else {
                res.status(404).json({ message: 'User not found' });
            }   
        } catch (error) {
            res.status(500).send(error);
        }
    });

    return router;
}