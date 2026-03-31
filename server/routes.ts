import { Router } from "express";
import pool from "./db.js";

const router = Router();

// GET /api/showcase/tickets - Puxar tickets reais
router.get("/showcase/tickets", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [tickets] = await connection.query(
      `SELECT id, ticketId, title, description, status, priority, userName, assignedToName, createdAt, updatedAt 
       FROM tickets 
       ORDER BY createdAt DESC
       LIMIT 100`
    );
    connection.release();
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

// GET /api/showcase/stats - Puxar estatísticas
router.get("/showcase/stats", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [openTickets] = await connection.query(
      `SELECT COUNT(*) as count FROM tickets WHERE status = 'pendente'`
    );
    
    const [inProgressTickets] = await connection.query(
      `SELECT COUNT(*) as count FROM tickets WHERE status = 'em_andamento'`
    );
    
    const [resolvedTickets] = await connection.query(
      `SELECT COUNT(*) as count FROM tickets WHERE status = 'resolvido'`
    );
    
    const [closedTickets] = await connection.query(
      `SELECT COUNT(*) as count FROM tickets WHERE status = 'fechado'`
    );
    
    connection.release();
    
    res.json({
      open: openTickets[0]?.count || 0,
      inProgress: inProgressTickets[0]?.count || 0,
      resolved: resolvedTickets[0]?.count || 0,
      pending: closedTickets[0]?.count || 0,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

// GET /api/showcase/tickets-by-priority - Puxar tickets por prioridade
router.get("/showcase/tickets-by-priority", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [data] = await connection.query(
      `SELECT priority, COUNT(*) as value FROM tickets GROUP BY priority`
    );
    connection.release();
    
    const priorityMap: any = {
      critica: "Crítica",
      alta: "Alta",
      media: "Média",
      baixa: "Baixa",
    };
    
    const colorMap: any = {
      critica: "#ff4444",
      alta: "#ff9900",
      media: "#ffcc00",
      baixa: "#00cc66",
    };
    
    const result = data.map((item: any) => ({
      name: priorityMap[item.priority] || item.priority,
      value: item.value,
      color: colorMap[item.priority] || "#00d4ff",
    }));
    
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar tickets por prioridade:", error);
    res.status(500).json({ error: "Erro ao buscar tickets por prioridade" });
  }
});

// GET /api/showcase/tickets-by-status - Puxar tickets por status
router.get("/showcase/tickets-by-status", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [data] = await connection.query(
      `SELECT status, COUNT(*) as value FROM tickets GROUP BY status`
    );
    connection.release();
    
    const statusMap: any = {
      pendente: "Pendente",
      em_andamento: "Em Andamento",
      resolvido: "Resolvido",
      fechado: "Fechado",
    };
    
    const result = data.map((item: any) => ({
      name: statusMap[item.status] || item.status,
      value: item.value,
    }));
    
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar tickets por status:", error);
    res.status(500).json({ error: "Erro ao buscar tickets por status" });
  }
});

// GET /api/showcase/tickets-by-department - Puxar tickets por departamento
router.get("/showcase/tickets-by-department", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [data] = await connection.query(
      `SELECT department, COUNT(*) as value FROM tickets WHERE department IS NOT NULL GROUP BY department`
    );
    connection.release();
    
    const result = data.map((item: any) => ({
      name: item.department || "Sem departamento",
      value: item.value,
    }));
    
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar tickets por departamento:", error);
    res.status(500).json({ error: "Erro ao buscar tickets por departamento" });
  }
});

// GET /api/showcase/recent-tickets - Puxar tickets recentes
router.get("/showcase/recent-tickets", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [tickets] = await connection.query(
      `SELECT id, ticketId, title, status, priority, userName, createdAt 
       FROM tickets 
       ORDER BY createdAt DESC
       LIMIT 10`
    );
    connection.release();
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets recentes:", error);
    res.status(500).json({ error: "Erro ao buscar tickets recentes" });
  }
});

export default router;
