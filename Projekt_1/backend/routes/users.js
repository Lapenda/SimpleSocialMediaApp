const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

module.exports = (usersCollection) => {


  //dohvacanje random 10 korisnika (max 10, dohvatit ce sve ako ih ima manje)
  router.get('/', async (req, res) => {
    try {
      const users = await usersCollection.aggregate([
        { $match: { username: { $ne: req.user.username } } },
        //{ $sample: { size: 10 } }
      ]).toArray();
      
      res.status(200).json(users.map(user => ({
        ...user,
        userId: user._id.toString()
      })));
    } catch (error) {
      res.status(500).send(error);
    }
  });

  //dohvacanje broja prijavljenih registriranih korisnika po danu
  router.get('/registration-data', async (req, res) => {
    try {
      const registrationData = await usersCollection.aggregate([
        {
          $project: {
            timestamp: {
              $dateToString: { format: '%d-%m-%Y', date: '$timestamp' }
            },
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
          
      res.status(200).json(registrationData);
    } catch (error) {
      res.status(500).send(error);
    }
  });

  //mijenjanje role korisnika
  router.put('/:userId/role', async (req, res) => {
    try {
      const userId = new ObjectId(req.params.userId);

      if (!req.user.role) {
        return res.status(400).send({ message: 'Role is required' });
      }

      const result = await usersCollection.updateOne(
        { _id: userId },
        { $set: { role: req.body.role } }
      );
    
    	if (result.modifiedCount === 0) {
        return res.status(404).send({ message: 'User not found' });
      }
     
      res.send({ message: 'Role updated' });
    } catch (error) {
      res.status(500).send(error);
    }
  });

  return router;
}