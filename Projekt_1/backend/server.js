const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:4200'
  }));

app.use(express.json());

const uri = 'mongodb+srv://bornalapenda12:gIn28idHiHk4y40l@cluster0.heorg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

app.get('/', (req, res) => {
  res.json( 'Dobrodošli na vašu društvenu mrežu!' );
});

async function run(){
  try{

    await client.connect();
    console.log("Connected succesfully to server");

    const database = client.db('Projekt');
    const usersCollection = database.collection('users');
    const postsCollection = database.collection('posts');
    const commentsCollection = database.collection('comments');
    const messagesCollection = database.collection('messages');
    const likesCollection = database.collection('likes');

    //import ruta
    const authRoutes = require('./routes/auth');
    const postRoutes = require('./routes/posts');
    const commentRoutes = require('./routes/comments');
    const messageRoutes = require('./routes/messages');
    const likeRoutes = require('./routes/likes');
    const profileRoutes = require('./routes/profile');
    const userRoutes = require('./routes/users');


    //middleware za autentifikaciju
    const authMiddleware = require('./middleware/auth');

    //postavljanje ruta
    app.use('/auth', authRoutes(usersCollection));
    app.use('/posts', authMiddleware, postRoutes(postsCollection, commentsCollection, likesCollection));
    app.use('/comments', authMiddleware, commentRoutes(commentsCollection, postsCollection));
    app.use('/messages', authMiddleware, messageRoutes(messagesCollection));
    app.use('/likes', authMiddleware, likeRoutes(likesCollection, postsCollection));
    app.use('/profile', authMiddleware, profileRoutes(usersCollection, postsCollection, commentsCollection, likesCollection));
    app.use('/users', authMiddleware, userRoutes(usersCollection));


    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });

  }catch(err){
    console.log(err);
  }
}

run().catch(console.dir);