/**
 * Database functions for new tables
 * Handles ticket comments, attachments, FAQs, reports, and user preferences
 */

import { getDb } from './db';
import { executeWithRetry } from './db-operations';
import { ticketComments, ticketAttachments, faqs, reports, userPreferences, tickets, users } from '../drizzle/schema';
import { eq, desc, count, and, like, sql } from 'drizzle-orm';

// ============= Ticket Comments =============

export async function createTicketComment(ticketId: number, userId: number, comment: string) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db.insert(ticketComments).values({
      ticketId,
      userId,
      comment,
    });
    return result;
  });
}

export async function getTicketComments(ticketId: number) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .select()
      .from(ticketComments)
      .where(eq(ticketComments.ticketId, ticketId))
      .orderBy(desc(ticketComments.createdAt));
  });
}

// ============= Ticket Attachments =============

export async function createTicketAttachment(ticketId: number, fileName: string, fileUrl: string) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db.insert(ticketAttachments).values({
      ticketId,
      fileName,
      fileUrl,
    });
    return result;
  });
}

export async function getTicketAttachments(ticketId: number) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.ticketId, ticketId))
      .orderBy(desc(ticketAttachments.createdAt));
  });
}

// ============= FAQs =============

export async function getAllFAQs() {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .select()
      .from(faqs)
      .orderBy(desc(faqs.createdAt));
  });
}

export async function getFAQsByCategory(category: string) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .select()
      .from(faqs)
      .where(eq(faqs.category, category))
      .orderBy(desc(faqs.createdAt));
  });
}

export async function searchFAQs(query: string) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .select()
      .from(faqs)
      .where(like(faqs.question, `%${query}%`))
      .orderBy(desc(faqs.createdAt));
  });
}

export async function incrementFAQViews(faqId: number) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .update(faqs)
      .set({ views: sql`views + 1` })
      .where(eq(faqs.id, faqId));
  });
}

export async function createFAQ(question: string, answer: string, category: string) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db.insert(faqs).values({
      question,
      answer,
      category,
    });
    return result;
  });
}

export async function getFAQs(category?: string) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    if (category) {
      return await db
        .select()
        .from(faqs)
        .where(eq(faqs.category, category))
        .orderBy(desc(faqs.createdAt));
    }
    
    return await db
      .select()
      .from(faqs)
      .orderBy(desc(faqs.createdAt));
  });
}

// ============= Reports =============

export async function createReport(title: string, description: string, createdBy: number) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db.insert(reports).values({
      title,
      description,
      createdBy,
    });
    return result;
  });
}

export async function getReports() {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));
  });
}

// ============= User Preferences =============

export async function updateUserPreferences(userId: number, prefs: { theme?: 'light' | 'dark'; language?: string; notificationsEnabled?: number; emailNotifications?: number }) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Try to update first
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    
    if (existing.length > 0) {
      return await db
        .update(userPreferences)
        .set({ ...prefs, updatedAt: new Date().toISOString() })
        .where(eq(userPreferences.userId, userId));
    }
    
    return await db.insert(userPreferences).values({
      userId,
      ...prefs,
    });
  });
}

export async function getUserPreferences(userId: number) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
  });
}

// ============= Dashboard Stats =============

export async function getDashboardStats(companyId?: number) {
  return executeWithRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const stats: any = {
      totalTickets: 0,
      ticketsByStatus: [],
      ticketsByPriority: [],
      recentTickets: [],
      totalUsers: 0
    };

    try {
      // Total tickets
      const totalTicketsResult = await db
        .select({ total: count() })
        .from(tickets);
      stats.totalTickets = totalTicketsResult[0]?.total || 0;

      // Tickets by status
      const ticketsByStatusResult = await db
        .select({
          status: tickets.status,
          count: count(),
        })
        .from(tickets)
        .groupBy(tickets.status);
      stats.ticketsByStatus = ticketsByStatusResult || [];

      // Tickets by priority
      const ticketsByPriorityResult = await db
        .select({
          priority: tickets.priority,
          count: count(),
        })
        .from(tickets)
        .groupBy(tickets.priority);
      stats.ticketsByPriority = ticketsByPriorityResult || [];

      // Recent tickets
      const recentTicketsResult = await db
        .select()
        .from(tickets)
        .orderBy(desc(tickets.createdAt))
        .limit(10);
      stats.recentTickets = recentTicketsResult || [];
    } catch (error: any) {
      console.warn('Error fetching ticket stats, using default values:', error?.message);
    }

    try {
      // Total users
      const totalUsersResult = await db
        .select({ total: count() })
        .from(users);
      stats.totalUsers = totalUsersResult[0]?.total || 0;
    } catch (error: any) {
      console.warn('Error fetching user stats, using default values:', error?.message);
    }

    return stats;
  });
}
