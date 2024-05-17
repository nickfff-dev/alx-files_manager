import { MongoClient } from 'mongodb';
import mongoDBCore from 'mongodb/lib/core';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${host}:${port}/${database}`, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db().collection('users').countDocuments();
  }

  async getUserByEmail(email) {
    const collection = this.client.db().collection('users');
    const user = await collection.findOne({ email });
    return user;
  }

  async getUserById(userId) {
    const collection = this.client.db().collection('users');
    const user = await collection.findOne({ _id: new mongoDBCore.BSON.ObjectId(userId)});
    return user;
  }

  async createUser({ email, password }) {
    const collection = this.client.db().collection('users');
    const newUser = await collection.insertOne({ email, password });
    return { id: newUser.insertedId, email };
  }

  async createFile(fileData) {
    const collection = this.client.db().collection('files');
    const newFile = await collection.insertOne(fileData);
    return { id: newFile._id, ...fileData };
  }

  async getFileById(fileId) {
    const collection = this.client.db().collection('files');
    const file = await collection.findOne({ _id: new mongoDBCore.BSON.ObjectId(fileId) });
    return file;
  }

  async getFilesByParentIdAndPage(parentId, skip, pageSize) {
    const collection = this.client.db().collection('files');
    const pipeline = [
      { $match: { parentId } },
      { $skip: skip },
      { $limit: pageSize },
    ];
    const files = await collection.aggregate(pipeline).toArray();
    return files;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
export default dbClient;
