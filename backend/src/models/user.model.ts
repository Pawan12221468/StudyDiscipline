import { ObjectId, Collection } from 'mongodb';
import { dbConnection } from '../config/database';

export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string; // Stored normalized, lowercase
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export class UserRepository {
  private collectionName = 'users';

  public getCollection(): Collection<UserDocument> {
    const db = dbConnection.getDb();
    return db.collection<UserDocument>(this.collectionName);
  }

  /**
   * Initializes the unique index on normalized lowercase email
   */
  public async ensureIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.createIndex(
        { email: 1 },
        { unique: true, name: 'uniq_normalized_email' }
      );
    } catch (err) {
      console.warn('Notice: Could not ensure email unique index (database may be offline during unit test):', (err as Error).message);
    }
  }

  public async findByEmail(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const collection = this.getCollection();
    return collection.findOne({ email: normalizedEmail });
  }

  public async findById(id: string | ObjectId): Promise<UserDocument | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const collection = this.getCollection();
    return collection.findOne({ _id: objectId });
  }

  public async create(name: string, email: string, passwordHash: string): Promise<UserDocument> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();

    const newUser: UserDocument = {
      _id: new ObjectId(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    const collection = this.getCollection();
    await collection.insertOne(newUser);
    return newUser;
  }
}

export const userRepository = new UserRepository();
