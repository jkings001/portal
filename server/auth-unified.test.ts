import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  isValidEmail,
  isValidPassword,
  generateUserId,
} from "./auth";
import { userStore } from "./user-store";

/**
 * Tests for unified authentication system
 * Validates JWT, password hashing, and user management
 */

describe("Unified Authentication System", () => {
  beforeEach(() => {
    // Reset is not needed as userStore is a singleton
    // but we can test with existing users
  });

  describe("Password Hashing", () => {
    it("should hash password correctly", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should verify correct password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("WrongPassword", hash);

      expect(isValid).toBe(false);
    });

    it("should handle different passwords", async () => {
      const password1 = "Password123";
      const password2 = "Password456";

      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(password1, hash1)).toBe(true);
      expect(await verifyPassword(password2, hash2)).toBe(true);
      expect(await verifyPassword(password1, hash2)).toBe(false);
    });
  });

  describe("JWT Token Generation", () => {
    it("should generate valid token", async () => {
      const user = {
        id: "test-user-1",
        email: "test@example.com",
        name: "Test User",
        role: "user" as const,
      };

      const token = await generateToken(user);
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("should verify token correctly", async () => {
      const user = {
        id: "test-user-2",
        email: "test2@example.com",
        name: "Test User 2",
        role: "admin" as const,
      };

      const token = await generateToken(user);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.user).toEqual(user);
    });

    it("should reject invalid token", async () => {
      const verified = await verifyToken("invalid.token.here");
      expect(verified).toBeNull();
    });

    it("should include user data in token", async () => {
      const user = {
        id: "test-user-3",
        email: "test3@example.com",
        name: "Test User 3",
        role: "manager" as const,
        department: "Sales",
      };

      const token = await generateToken(user);
      const verified = await verifyToken(token);

      expect(verified?.user.id).toBe(user.id);
      expect(verified?.user.email).toBe(user.email);
      expect(verified?.user.role).toBe(user.role);
    });
  });

  describe("Email Validation", () => {
    it("should validate correct email", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user@domain.co.uk")).toBe(true);
      expect(isValidEmail("name+tag@example.com")).toBe(true);
    });

    it("should reject invalid email", () => {
      expect(isValidEmail("invalid.email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("Password Validation", () => {
    it("should validate strong password", () => {
      expect(isValidPassword("StrongPass123")).toBe(true);
      expect(isValidPassword("MyPassword456")).toBe(true);
    });

    it("should reject weak password", () => {
      expect(isValidPassword("weak")).toBe(false);
      expect(isValidPassword("noupppercase123")).toBe(false);
      expect(isValidPassword("NoNumbers")).toBe(false);
      expect(isValidPassword("Short1")).toBe(false);
    });
  });

  describe("User ID Generation", () => {
    it("should generate unique IDs", () => {
      const id1 = generateUserId();
      const id2 = generateUserId();

      expect(id1).not.toBe(id2);
      expect(id1.startsWith("user-")).toBe(true);
      expect(id2.startsWith("user-")).toBe(true);
    });
  });

  describe("User Store", () => {
    it("should retrieve default admin user", () => {
      const admin = userStore.getUserByEmail("jeferson.reis@jkings.com.br");
      expect(admin).toBeTruthy();
      expect(admin?.role).toBe("admin");
      expect(admin?.name).toBe("Jeferson Reis");
    });

    it("should retrieve default regular user", () => {
      const user = userStore.getUserByEmail("usuario@jkings.com");
      expect(user).toBeTruthy();
      expect(user?.role).toBe("user");
    });

    it("should retrieve default manager user", () => {
      const manager = userStore.getUserByEmail("gerente@jkings.com");
      expect(manager).toBeTruthy();
      expect(manager?.role).toBe("manager");
    });

    it("should get all users", () => {
      const users = userStore.getAllUsers();
      expect(users.length).toBeGreaterThanOrEqual(3);
    });

    it("should convert user to auth user without password", () => {
      const user = userStore.getUserByEmail("usuario@jkings.com");
      if (!user) throw new Error("User not found");

      const authUser = userStore.toAuthUser(user);
      expect(authUser).not.toHaveProperty("passwordHash");
      expect(authUser.email).toBe(user.email);
      expect(authUser.role).toBe(user.role);
    });

    it("should not find non-existent user", () => {
      const user = userStore.getUserByEmail("nonexistent@example.com");
      expect(user).toBeUndefined();
    });
  });

  describe("Login Flow", () => {
    it("should verify admin password", async () => {
      const admin = userStore.getUserByEmail("jeferson.reis@jkings.com.br");
      if (!admin) throw new Error("Admin not found");

      const isValid = await verifyPassword("Jkadm2010BlueCat", admin.passwordHash);
      expect(isValid).toBe(true);
    });

    it("should reject wrong password", async () => {
      const admin = userStore.getUserByEmail("jeferson.reis@jkings.com.br");
      if (!admin) throw new Error("Admin not found");

      const isValid = await verifyPassword("WrongPassword", admin.passwordHash);
      expect(isValid).toBe(false);
    });
  });

  describe("User Management", () => {
    it("should create new user", async () => {
      const newUser = await userStore.createUser(
        "newuser@example.com",
        "New User",
        "NewPass123",
        "user"
      );

      expect(newUser.email).toBe("newuser@example.com");
      expect(newUser.role).toBe("user");
      expect(newUser.id).toBeTruthy();
    });

    it("should prevent duplicate email", async () => {
      await expect(
        userStore.createUser(
          "jeferson.reis@jkings.com.br",
          "Duplicate",
          "Pass123"
        )
      ).rejects.toThrow("Email already registered");
    });

    it("should update user", async () => {
      const user = await userStore.createUser(
        "updatetest@example.com",
        "Original Name",
        "Pass123"
      );

      const updated = await userStore.updateUser(user.id, {
        name: "Updated Name",
        role: "manager",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.role).toBe("manager");
    });

    it("should delete user", async () => {
      // Create a temporary user to delete
      const tempUser = await userStore.createUser(
        `temp-${Date.now()}@example.com`,
        "Temp User",
        "Pass123"
      );

      const deleted = userStore.deleteUser(tempUser.id);
      expect(deleted).toBe(true);

      const notFound = userStore.deleteUser("nonexistent-id");
      expect(notFound).toBe(false);
    });
  });

  describe("Security", () => {
    it("should not expose password hash in auth user", async () => {
      const user = userStore.getUserByEmail("jeferson.reis@jkings.com.br");
      if (!user) throw new Error("User not found");

      const authUser = userStore.toAuthUser(user);
      expect(authUser).not.toHaveProperty("passwordHash");
    });

    it("should generate different hashes for same password", async () => {
      const password = "TestPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });
});
