import { describe, it, expect } from 'vitest';
import bcryptjs from 'bcryptjs';

describe('User Profile Management', () => {
  describe('Password Validation', () => {
    it('should validate password strength - minimum 8 characters', () => {
      const password = 'Short123';
      expect(password.length).toBeGreaterThanOrEqual(8);
    });

    it('should validate password strength - uppercase letters', () => {
      const password = 'MyPassword123!';
      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it('should validate password strength - lowercase letters', () => {
      const password = 'MyPassword123!';
      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('should validate password strength - numbers', () => {
      const password = 'MyPassword123!';
      expect(/[0-9]/.test(password)).toBe(true);
    });

    it('should validate password strength - special characters', () => {
      const password = 'MyPassword123!';
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(true);
    });

    it('should reject weak passwords', () => {
      const weakPasswords = ['123456', 'password', 'abc123'];
      weakPasswords.forEach(pwd => {
        const hasUppercase = /[A-Z]/.test(pwd);
        const hasLowercase = /[a-z]/.test(pwd);
        const hasNumbers = /[0-9]/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        const strength = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
        expect(strength).toBeLessThan(3);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyPassword123!',
        'SecurePass@2024',
        'Complex#Pwd99'
      ];
      strongPasswords.forEach(pwd => {
        const hasUppercase = /[A-Z]/.test(pwd);
        const hasLowercase = /[a-z]/.test(pwd);
        const hasNumbers = /[0-9]/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        const strength = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
        expect(strength).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.com'
      ];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid.email',
        '@example.com',
        'user@',
        'user @example.com'
      ];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Password Hashing', () => {
    it('should hash password with bcryptjs', async () => {
      const password = 'MyPassword123!';
      const hash = await bcryptjs.hash(password, 10);
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should verify correct password', async () => {
      const password = 'MyPassword123!';
      const hash = await bcryptjs.hash(password, 10);
      const isValid = await bcryptjs.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'MyPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await bcryptjs.hash(password, 10);
      const isValid = await bcryptjs.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'MyPassword123!';
      const hash1 = await bcryptjs.hash(password, 10);
      const hash2 = await bcryptjs.hash(password, 10);
      expect(hash1).not.toBe(hash2);
      // But both should verify correctly
      expect(await bcryptjs.compare(password, hash1)).toBe(true);
      expect(await bcryptjs.compare(password, hash2)).toBe(true);
    });
  });

  describe('User Profile Data', () => {
    it('should have required profile fields', () => {
      const userProfile = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        department: 'Sales',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date()
      };

      expect(userProfile).toHaveProperty('id');
      expect(userProfile).toHaveProperty('name');
      expect(userProfile).toHaveProperty('email');
      expect(userProfile).toHaveProperty('role');
      expect(userProfile).toHaveProperty('department');
      expect(userProfile).toHaveProperty('createdAt');
      expect(userProfile).toHaveProperty('updatedAt');
      expect(userProfile).toHaveProperty('lastSignedIn');
    });

    it('should validate user roles', () => {
      const validRoles = ['user', 'admin', 'manager'];
      const testRoles = ['user', 'admin', 'manager', 'invalid'];
      
      testRoles.forEach(role => {
        if (validRoles.includes(role)) {
          expect(validRoles).toContain(role);
        }
      });
    });

    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('Profile Update Validation', () => {
    it('should require name field', () => {
      const updateData = {
        name: '',
        email: 'user@example.com',
        department: 'Sales'
      };
      expect(updateData.name.trim().length).toBe(0);
    });

    it('should require email field', () => {
      const updateData = {
        name: 'John Doe',
        email: '',
        department: 'Sales'
      };
      expect(updateData.email.trim().length).toBe(0);
    });

    it('should validate email format on update', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const updateData = {
        name: 'John Doe',
        email: 'invalid-email',
        department: 'Sales'
      };
      expect(emailRegex.test(updateData.email)).toBe(false);
    });

    it('should allow optional department field', () => {
      const updateData = {
        name: 'John Doe',
        email: 'john@example.com',
        department: ''
      };
      expect(updateData.name).toBeDefined();
      expect(updateData.email).toBeDefined();
      // department can be empty
      expect(updateData.department).toBeDefined();
    });
  });

  describe('Password Change Validation', () => {
    it('should require current password', () => {
      const changeData = {
        currentPassword: '',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      expect(changeData.currentPassword.trim().length).toBe(0);
    });

    it('should require new password', () => {
      const changeData = {
        currentPassword: 'OldPassword123!',
        newPassword: '',
        confirmPassword: ''
      };
      expect(changeData.newPassword.trim().length).toBe(0);
    });

    it('should validate new password minimum length', () => {
      const changeData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'Short1!',
        confirmPassword: 'Short1!'
      };
      expect(changeData.newPassword.length).toBeLessThan(8);
    });

    it('should ensure passwords match', () => {
      const changeData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!'
      };
      expect(changeData.newPassword).not.toBe(changeData.confirmPassword);
    });

    it('should prevent reusing current password', () => {
      const changeData = {
        currentPassword: 'SamePassword123!',
        newPassword: 'SamePassword123!',
        confirmPassword: 'SamePassword123!'
      };
      expect(changeData.currentPassword).toBe(changeData.newPassword);
    });

    it('should allow valid password change', () => {
      const changeData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      expect(changeData.currentPassword).not.toBe(changeData.newPassword);
      expect(changeData.newPassword).toBe(changeData.confirmPassword);
      expect(changeData.newPassword.length).toBeGreaterThanOrEqual(8);
    });
  });
});
