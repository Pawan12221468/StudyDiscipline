import { ObjectId, Collection } from 'mongodb';
import { dbConnection } from '../config/database';

export interface AIChatDocument {
  _id: ObjectId;
  userId: ObjectId;
  role: 'user' | 'model';
  content: string;
  createdAt: Date;
}

export interface PublicChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export function toPublicChatMessage(doc: AIChatDocument): PublicChatMessage {
  return {
    id: doc._id.toString(),
    role: doc.role,
    content: doc.content,
    createdAt: doc.createdAt.toISOString(),
  };
}

export class AIChatRepository {
  private collectionName = 'ai_chat_history';

  public getCollection(): Collection<AIChatDocument> {
    const db = dbConnection.getDb();
    return db.collection<AIChatDocument>(this.collectionName);
  }

  public async ensureIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.createIndex(
        { userId: 1, createdAt: -1 },
        { name: 'idx_user_chat_created' }
      );
    } catch (err) {
      console.warn('Notice: Could not ensure AI chat indexes:', (err as Error).message);
    }
  }

  /**
   * Save a single message in the chat history
   */
  public async saveMessage(userId: ObjectId, role: 'user' | 'model', content: string): Promise<AIChatDocument> {
    const doc: AIChatDocument = {
      _id: new ObjectId(),
      userId,
      role,
      content: content.trim(),
      createdAt: new Date(),
    };

    const collection = this.getCollection();
    await collection.insertOne(doc);
    return doc;
  }

  /**
   * List recent messages for context feeding (newest first, limited)
   */
  public async listRecent(userId: ObjectId, limit: number = 10): Promise<AIChatDocument[]> {
    const collection = this.getCollection();
    const docs = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Reverse to chronological order for conversational context
    return docs.reverse();
  }

  /**
   * List paginated chat history for frontend display
   */
  public async listPaginated(
    userId: ObjectId,
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: AIChatDocument[]; total: number; page: number; limit: number }> {
    const skip = (Math.max(1, page) - 1) * Math.min(50, limit);
    const collection = this.getCollection();

    const [docs, total] = await Promise.all([
      collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(50, limit))
        .toArray(),
      collection.countDocuments({ userId }),
    ]);

    return {
      messages: docs.reverse(),
      total,
      page,
      limit,
    };
  }

  /**
   * Clear chat history for user
   */
  public async clearHistory(userId: ObjectId): Promise<boolean> {
    const collection = this.getCollection();
    const res = await collection.deleteMany({ userId });
    return res.acknowledged;
  }
}

export const aiChatRepository = new AIChatRepository();
