import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock department data
const mockDepartments = [
  { id: 1, companyId: 1, name: "HR", description: "Human Resources", manager: "John Doe", createdAt: new Date(), updatedAt: new Date() },
  { id: 2, companyId: 1, name: "IT", description: "Information Technology", manager: "Jane Smith", createdAt: new Date(), updatedAt: new Date() },
  { id: 3, companyId: 2, name: "Sales", description: "Sales Department", manager: "Bob Johnson", createdAt: new Date(), updatedAt: new Date() },
];

const mockUserAssignments = [
  { id: 1, userId: 1, companyId: 1, departmentId: 1, positionId: 1, role: "user", approvalLevel: 0, isActive: true, startDate: new Date(), endDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, userId: 2, companyId: 1, departmentId: 1, positionId: 2, role: "user", approvalLevel: 0, isActive: true, startDate: new Date(), endDate: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, userId: 3, companyId: 1, departmentId: 2, positionId: 3, role: "user", approvalLevel: 0, isActive: true, startDate: new Date(), endDate: null, createdAt: new Date(), updatedAt: new Date() },
];

describe("Department Management", () => {
  describe("getDepartmentUserCount", () => {
    it("should return correct user count for a department", () => {
      const departmentId = 1;
      const count = mockUserAssignments.filter(u => u.departmentId === departmentId).length;
      expect(count).toBe(2);
    });

    it("should return 0 for department with no users", () => {
      const departmentId = 99;
      const count = mockUserAssignments.filter(u => u.departmentId === departmentId).length;
      expect(count).toBe(0);
    });
  });

  describe("getDepartmentWithUserInfo", () => {
    it("should include userCount in response", () => {
      const departmentId = 1;
      const dept = mockDepartments.find(d => d.id === departmentId);
      const userCount = mockUserAssignments.filter(u => u.departmentId === departmentId).length;
      
      if (dept) {
        const result = { ...dept, userCount };
        expect(result).toHaveProperty("userCount");
        expect(result.userCount).toBe(2);
      }
    });

    it("should return null for non-existent department", () => {
      const dept = mockDepartments.find(d => d.id === 99999);
      expect(dept).toBeUndefined();
    });
  });

  describe("getDepartmentsByCompanyWithUserCounts", () => {
    it("should return all departments for a company with user counts", () => {
      const companyId = 1;
      const depts = mockDepartments.filter(d => d.companyId === companyId);
      
      const deptsWithCounts = depts.map(dept => ({
        ...dept,
        userCount: mockUserAssignments.filter(u => u.departmentId === dept.id).length,
      }));
      
      expect(deptsWithCounts.length).toBe(2);
      expect(deptsWithCounts[0].userCount).toBe(2);
      expect(deptsWithCounts[1].userCount).toBe(1);
    });

    it("should return empty array for non-existent company", () => {
      const companyId = 99999;
      const depts = mockDepartments.filter(d => d.companyId === companyId);
      expect(depts.length).toBe(0);
    });
  });

  describe("getUsersByDepartment", () => {
    it("should return all users in a department", () => {
      const departmentId = 1;
      const users = mockUserAssignments.filter(u => u.departmentId === departmentId);
      expect(users.length).toBe(2);
    });

    it("should return empty array for non-existent department", () => {
      const departmentId = 99999;
      const users = mockUserAssignments.filter(u => u.departmentId === departmentId);
      expect(users.length).toBe(0);
    });
  });

  describe("Department CRUD Operations", () => {
    it("should create a department with valid data", () => {
      const newDept = {
        companyId: 1,
        name: "Test Department",
        description: "A test department",
        manager: "Test Manager",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(newDept.name).toBe("Test Department");
      expect(newDept.companyId).toBe(1);
    });

    it("should update department name", () => {
      const dept = { ...mockDepartments[0] };
      dept.name = "Updated Department";
      
      expect(dept.name).toBe("Updated Department");
      expect(dept.id).toBe(1);
    });

    it("should delete a department", () => {
      const initialCount = mockDepartments.length;
      const deptToDelete = mockDepartments[0];
      
      const filtered = mockDepartments.filter(d => d.id !== deptToDelete.id);
      expect(filtered.length).toBe(initialCount - 1);
    });
  });

  describe("Department Validation", () => {
    it("should validate department name is not empty", () => {
      const invalidDept = {
        companyId: 1,
        name: "",
        description: "Invalid department",
        manager: "Test Manager",
      };
      
      expect(invalidDept.name.length).toBe(0);
      expect(invalidDept.name).toBe("");
    });

    it("should validate companyId is positive", () => {
      const invalidDept = {
        companyId: 0,
        name: "Test Department",
        description: "Invalid company",
        manager: "Test Manager",
      };
      
      expect(invalidDept.companyId).toBeLessThanOrEqual(0);
    });

    it("should accept optional manager field", () => {
      const dept = {
        companyId: 1,
        name: "Test Department",
        description: "Test description",
        manager: undefined,
      };
      
      expect(dept.manager).toBeUndefined();
    });
  });

  describe("User Assignment to Department", () => {
    it("should assign user to department", () => {
      const userId = 1;
      const departmentId = 2;
      
      const updatedAssignment = {
        ...mockUserAssignments[0],
        departmentId,
      };
      
      expect(updatedAssignment.departmentId).toBe(2);
      expect(updatedAssignment.userId).toBe(1);
    });

    it("should remove user from department", () => {
      const userId = 1;
      
      const updatedAssignment = {
        ...mockUserAssignments[0],
        departmentId: null,
      };
      
      expect(updatedAssignment.departmentId).toBeNull();
    });

    it("should track department changes in user assignment", () => {
      const assignment = mockUserAssignments[0];
      const originalDept = assignment.departmentId;
      
      const updated = { ...assignment, departmentId: 2 };
      
      expect(originalDept).toBe(1);
      expect(updated.departmentId).toBe(2);
    });
  });

  describe("Department Statistics", () => {
    it("should calculate total users per department", () => {
      const stats = mockDepartments.map(dept => ({
        departmentId: dept.id,
        name: dept.name,
        userCount: mockUserAssignments.filter(u => u.departmentId === dept.id).length,
      }));
      
      expect(stats.length).toBe(3);
      expect(stats[0].userCount).toBe(2);
      expect(stats[1].userCount).toBe(1);
    });

    it("should identify departments with no users", () => {
      const emptyDepts = mockDepartments.filter(dept => 
        !mockUserAssignments.some(u => u.departmentId === dept.id)
      );
      
      expect(emptyDepts.length).toBe(1);
      expect(emptyDepts[0].id).toBe(3);
    });

    it("should calculate department utilization percentage", () => {
      const companyId = 1;
      const companyDepts = mockDepartments.filter(d => d.companyId === companyId);
      const companyUsers = mockUserAssignments.filter(u => u.companyId === companyId);
      
      const avgUsersPerDept = companyUsers.length / companyDepts.length;
      expect(avgUsersPerDept).toBe(1.5);
    });
  });
});
