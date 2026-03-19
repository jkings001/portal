/**
 * In-Memory User Store
 * 
 * Stores user credentials and sessions in memory.
 * In production, this should be replaced with a database.
 * 
 * This is a temporary solution while database connectivity is being resolved.
 */

import { AuthUser } from "./auth";
import { hashPassword } from "./auth";

export interface StoredUser extends AuthUser {
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
}

class UserStore {
  private users: Map<string, StoredUser> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> id mapping

  constructor() {
    this.initializeDefaultUsers();
  }

  /**
   * Initialize default admin user
   */
  private async initializeDefaultUsers() {
    // Create default admin user
    const adminPasswordHash = await hashPassword("Jkadm2010BlueCat");
    
    const adminUser: StoredUser = {
      id: "admin-001",
      email: "jeferson.reis@jkings.com.br",
      name: "Jeferson Reis",
      role: "admin",
      department: "TI",
      passwordHash: adminPasswordHash,
      createdAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    this.emailIndex.set(adminUser.email, adminUser.id);

    // Create default user
    const userPasswordHash = await hashPassword("senha123");
    
    const defaultUser: StoredUser = {
      id: "user-001",
      email: "usuario@jkings.com",
      name: "João Silva",
      role: "user",
      department: "Financeiro",
      passwordHash: userPasswordHash,
      createdAt: new Date(),
    };

    this.users.set(defaultUser.id, defaultUser);
    this.emailIndex.set(defaultUser.email, defaultUser.id);

    // Create manager user
    const managerPasswordHash = await hashPassword("senha123");
    
    const managerUser: StoredUser = {
      id: "manager-001",
      email: "gerente@jkings.com",
      name: "Maria Santos",
      role: "manager",
      department: "RH",
      passwordHash: managerPasswordHash,
      createdAt: new Date(),
    };

    this.users.set(managerUser.id, managerUser);
    this.emailIndex.set(managerUser.email, managerUser.id);
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): StoredUser | undefined {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): StoredUser | undefined {
    return this.users.get(id);
  }

  /**
   * Get all users
   */
  getAllUsers(): StoredUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Create a new user
   */
  async createUser(
    email: string,
    name: string,
    password: string,
    role: "user" | "admin" | "manager" = "user",
    department?: string
  ): Promise<StoredUser> {
    // Check if email already exists
    if (this.emailIndex.has(email.toLowerCase())) {
      throw new Error("Email already registered");
    }

    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = await hashPassword(password);

    const user: StoredUser = {
      id,
      email,
      name,
      role,
      department,
      passwordHash,
      createdAt: new Date(),
    };

    this.users.set(id, user);
    this.emailIndex.set(email.toLowerCase(), id);

    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    updates: Partial<Omit<StoredUser, "id" | "passwordHash" | "createdAt">> & {
      password?: string;
    }
  ): Promise<StoredUser> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    const { password, ...otherUpdates } = updates;

    if (password) {
      user.passwordHash = await hashPassword(password);
    }

    Object.assign(user, otherUpdates);

    return user;
  }

  /**
   * Delete user
   */
  deleteUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;

    this.emailIndex.delete(user.email.toLowerCase());
    this.users.delete(id);

    return true;
  }

  /**
   * Update last login time
   */
  updateLastLogin(id: string): void {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
    }
  }

  /**
   * Get user for API response (without password hash)
   */
  toAuthUser(user: StoredUser): AuthUser {
    const { passwordHash, ...authUser } = user;
    return authUser;
  }
}

// Export singleton instance
export const userStore = new UserStore();
