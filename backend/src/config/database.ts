import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { env } from './env';

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting: boolean = false;

  /**
   * Connects to MongoDB Atlas using a single reused MongoClient instance.
   */
  public async connect(): Promise<Db> {
    if (this.db && this.client) {
      return this.db;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt to resolve
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (this.db) return this.db;
    }

    this.isConnecting = true;

    const clientOptions: MongoClientOptions = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    try {
      this.client = new MongoClient(env.MONGODB_URI, clientOptions);
      await this.client.connect();

      // Use the explicitly configured database name or let MongoClient use the database in the URI
      this.db = this.client.db(env.DB_NAME);

      // Perform initial ping to verify readiness
      await this.db.command({ ping: 1 });

      console.log(`✅ MongoDB connected successfully to database: "${env.DB_NAME}"`);
      return this.db;
    } catch (error) {
      // Sanitize error: never log passwords or entire URI containing credentials
      const err = error as Error;
      let sanitizedMessage = err.message || 'Unknown database connection error';

      // Redact potential password substrings if present in error message
      if (sanitizedMessage.includes('@')) {
        sanitizedMessage = sanitizedMessage.replace(/:\/\/.*@/, '://<REDACTED_CREDENTIALS>@');
      }

      console.error('❌ Failed to connect to MongoDB Atlas:');
      console.error(`   Error: ${sanitizedMessage}`);
      console.error('   Troubleshooting:');
      console.error('   1. Verify your IP is allowed in MongoDB Atlas Network Access (0.0.0.0/0 for all dev environments).');
      console.error('   2. Verify username and password in backend/.env.');
      console.error('   3. Check that your cluster is not paused.');

      // Clean up failed client
      if (this.client) {
        await this.client.close().catch(() => {});
        this.client = null;
      }
      this.db = null;

      throw new Error(`Database connection failed: ${sanitizedMessage}`);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Returns the active database reference. Throws if not yet connected.
   */
  public getDb(): Db {
    if (!this.db) {
      throw new Error('Database is not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Returns the underlying MongoClient instance.
   */
  public getClient(): MongoClient {
    if (!this.client) {
      throw new Error('MongoClient is not initialized.');
    }
    return this.client;
  }

  /**
   * Lightweight ping command to verify active database health.
   */
  public async ping(): Promise<{ ok: boolean; latencyMs: number }> {
    if (!this.db) {
      return { ok: false, latencyMs: -1 };
    }

    const start = Date.now();
    try {
      const result = await this.db.command({ ping: 1 });
      const latencyMs = Date.now() - start;
      return { ok: result.ok === 1, latencyMs };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }

  /**
   * Gracefully closes the database connection.
   */
  public async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        console.log('🔌 MongoDB connection closed gracefully.');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
      } finally {
        this.client = null;
        this.db = null;
      }
    }
  }

  public isConnected(): boolean {
    return this.db !== null && this.client !== null;
  }
}

export const dbConnection = new DatabaseConnection();
