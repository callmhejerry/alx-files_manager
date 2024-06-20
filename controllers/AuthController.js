import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.get('Authorization');
    const encodedBase64String = authHeader.split(' ')[1];

    const decodedBase64String = Buffer.from(encodedBase64String, 'base64').toString();
    const [email, password] = decodedBase64String.split(':');

    if (!email || !password) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const user = await dbClient.users.findOne({ email, password: sha1(password) });

    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const token = uuidv4();
    const key = AuthController.getKey(token);
    await redisClient.set(key, user._id.toString(), 24 * 3600);
    res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.get('X-Token');
    const userId = await redisClient.get(AuthController.getKey(token));

    if (!userId) {
      res.status(401).send({ error: 'Unauthorized' });
    } else {
      await redisClient.del(AuthController.getKey(token));
      res.status(204).send();
    }
  }

  static getKey(token) {
    return `auth_${token}`;
  }
}

export default AuthController;
