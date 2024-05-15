import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${host}:${port}`, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const db = this.client.db(this.database);
    const collection = db.collection('users');
    const docCount = await collection.countDocuments();
    return docCount;
  }

  async nbFiles() {
    const db = this.client.db(this.database);
    const collection = db.collection('files');
    const filesCount = await collection.countDocuments();
    return filesCount;
  }

  async getUser(email) {
    const db = this.client.db(this.database);
    const collection = db.collection('users');
    const user = await collection.findOne({ email });
    return user;
  }

  async createUser({ email, password }) {
    const db = this.client.db(this.database);
    const collection = db.collection('users');
    const newUser = await collection.insertOne({ email, password });
    return { id: newUser.insertedId, email };
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
export default dbClient;
