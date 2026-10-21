import { ObjectId, Collection, Filter } from 'mongodb';
import { dbConnection } from '../config/database';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface StudyTaskDocument {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  subject: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  dueDate?: string;
  notes?: string;
  status: TaskStatus;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicStudyTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subject: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  dueDate?: string;
  notes?: string;
  status: TaskStatus;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toPublicTask(doc: StudyTaskDocument): PublicStudyTask {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    title: doc.title,
    description: doc.description,
    subject: doc.subject,
    priority: doc.priority,
    estimatedMinutes: doc.estimatedMinutes,
    dueDate: doc.dueDate,
    notes: doc.notes,
    status: doc.status,
    completed: doc.status === 'completed',
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  subject: string;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  dueDate?: string;
  notes?: string;
  status?: TaskStatus;
}

export interface UpdateTaskParams {
  title?: string;
  description?: string;
  subject?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  dueDate?: string;
  notes?: string;
  status?: TaskStatus;
  completed?: boolean;
}

export interface ListTasksOptions {
  page?: number;
  limit?: number;
  status?: TaskStatus | 'all';
  subject?: string;
  priority?: TaskPriority | 'all';
  search?: string;
}

export class TaskRepository {
  private collectionName = 'study_tasks';

  public getCollection(): Collection<StudyTaskDocument> {
    const db = dbConnection.getDb();
    return db.collection<StudyTaskDocument>(this.collectionName);
  }

  public async ensureIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.createIndex(
        { userId: 1, status: 1 },
        { name: 'idx_user_task_status' }
      );
      await collection.createIndex(
        { userId: 1, createdAt: -1 },
        { name: 'idx_user_task_created' }
      );
      await collection.createIndex(
        { userId: 1, dueDate: 1 },
        { name: 'idx_user_task_due' }
      );
    } catch (err) {
      console.warn('Notice: Could not ensure task indexes:', (err as Error).message);
    }
  }

  /**
   * Create a new study task scoped to the authenticated user.
   */
  public async create(userId: ObjectId, params: CreateTaskParams): Promise<StudyTaskDocument> {
    const now = new Date();
    const initialStatus: TaskStatus = params.status || 'pending';
    const isCompleted = initialStatus === 'completed';

    const newDoc: StudyTaskDocument = {
      _id: new ObjectId(),
      userId,
      title: params.title.trim(),
      description: params.description?.trim(),
      subject: params.subject.trim(),
      priority: params.priority || 'medium',
      estimatedMinutes: Math.max(1, params.estimatedMinutes || 30),
      dueDate: params.dueDate?.trim(),
      notes: params.notes?.trim(),
      status: initialStatus,
      completedAt: isCompleted ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    const collection = this.getCollection();
    await collection.insertOne(newDoc);
    return newDoc;
  }

  /**
   * Find a single task by ID strictly scoped to user.
   */
  public async findByIdAndUserId(taskId: ObjectId, userId: ObjectId): Promise<StudyTaskDocument | null> {
    const collection = this.getCollection();
    return collection.findOne({ _id: taskId, userId });
  }

  /**
   * List tasks for a user with filters and pagination.
   */
  public async listByUserId(
    userId: ObjectId,
    options: ListTasksOptions = {}
  ): Promise<{ tasks: StudyTaskDocument[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Filter<StudyTaskDocument> = { userId };

    if (options.status && options.status !== 'all') {
      filter.status = options.status;
    }
    if (options.subject && options.subject !== 'all') {
      filter.subject = options.subject;
    }
    if (options.priority && options.priority !== 'all') {
      filter.priority = options.priority;
    }
    if (options.search && options.search.trim()) {
      const regex = new RegExp(options.search.trim(), 'i');
      filter.$or = [{ title: regex }, { notes: regex }, { subject: regex }];
    }

    const collection = this.getCollection();
    const [tasks, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ status: 1, createdAt: -1 }) // Pending tasks first, then by newest
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return { tasks, total, page, limit };
  }

  /**
   * Update a task. Rejects if task is not owned by user.
   */
  public async update(taskId: ObjectId, userId: ObjectId, updates: UpdateTaskParams): Promise<StudyTaskDocument> {
    const existing = await this.findByIdAndUserId(taskId, userId);
    if (!existing) {
      throw new Error('Task not found.');
    }

    const now = new Date();
    const updateDoc: any = { updatedAt: now };

    if (updates.title !== undefined) updateDoc.title = updates.title.trim();
    if (updates.description !== undefined) updateDoc.description = updates.description.trim();
    if (updates.subject !== undefined) updateDoc.subject = updates.subject.trim();
    if (updates.priority !== undefined) updateDoc.priority = updates.priority;
    if (updates.estimatedMinutes !== undefined) updateDoc.estimatedMinutes = Math.max(1, updates.estimatedMinutes);
    if (updates.dueDate !== undefined) updateDoc.dueDate = updates.dueDate.trim() || undefined;
    if (updates.notes !== undefined) updateDoc.notes = updates.notes.trim() || undefined;

    // Handle status / completed changes
    if (updates.completed !== undefined) {
      if (updates.completed) {
        updateDoc.status = 'completed';
        if (!existing.completedAt) updateDoc.completedAt = now;
      } else {
        updateDoc.status = 'pending';
        updateDoc.completedAt = null;
      }
    } else if (updates.status !== undefined) {
      updateDoc.status = updates.status;
      if (updates.status === 'completed') {
        if (!existing.completedAt) updateDoc.completedAt = now;
      } else {
        updateDoc.completedAt = null;
      }
    }

    const collection = this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: taskId, userId },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) throw new Error('Failed to update task.');
    return result;
  }

  /**
   * Toggle or set completion status of a task.
   */
  public async toggleComplete(taskId: ObjectId, userId: ObjectId, explicitCompleted?: boolean): Promise<StudyTaskDocument> {
    const existing = await this.findByIdAndUserId(taskId, userId);
    if (!existing) {
      throw new Error('Task not found.');
    }

    const shouldComplete = explicitCompleted !== undefined ? explicitCompleted : existing.status !== 'completed';
    const now = new Date();

    const collection = this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: taskId, userId },
      {
        $set: {
          status: shouldComplete ? 'completed' : 'pending',
          completedAt: shouldComplete ? (existing.completedAt || now) : null,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) throw new Error('Failed to update task completion.');
    return result;
  }

  /**
   * Delete a task owned by the user.
   */
  public async delete(taskId: ObjectId, userId: ObjectId): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: taskId, userId });
    return result.deletedCount > 0;
  }
}

export const taskRepository = new TaskRepository();
