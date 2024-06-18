import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import AuthController from './AuthController';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).send({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
      return;
    }
    const user = await dbClient.users.findOne({ email });
    if (user) {
      res.status(400).send({ error: 'Already exist' });
      return;
    }
    const newUser = await dbClient.users.insertOne({
      email,
      password: sha1(password),
    });
    res.status(201).send({ id: newUser.insertedId, email });
  }

  static async getMe(req, res) {
    const token = req.get('X-Token');
    const userId = await redisClient.get(AuthController.getKey(token));
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (user) {
      res.send({ email: user.email, id: userId });
    } else {
      res.status(401).send({ error: 'Unauthorized' });
    }
  }
}

export default UsersController;
