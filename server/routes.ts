import { Router } from "express";
import pool from "./db.js";

const router = Router();

// Empresa temporária para filtro
const DEMO_COMPANY_ID = process.env.DEMO_COMPANY_ID || "1";

// GET /api/showcase/tickets - Puxar tickets reais
router.get("/showcase/tickets", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [tickets] = await connection.query(
      `SELECT id, title, description, status, priority, category, created_at, updated_at 
       FROM tickets 
       WHERE company_id = ? 
       LIMIT 100`,
      [DEMO_COMPANY_ID]
    );
    connection.release();
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

// GET /api/showcase/categories - Puxar categorias
router.get("/showcase/categories", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [categories] = await connection.query(
      `SELECT id, name, description FROM categories WHERE company_id = ?`,
      [DEMO_COMPANY_ID]
    );
    connection.release();
    res.json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

// GET /api/showcase/priorities - Puxar prioridades
router.get("/showcase/priorities", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [priorities] = await connection.query(
      `SELECT id, name, level FROM priorities WHERE company_id = ?`,
      [DEMO_COMPANY_ID]
    );
    connection.release();
    res.json(priorities);
  } catch (error) {
    console.error("Erro ao buscar prioridades:", error);
    res.status(500).json({ error: "Erro ao buscar prioridades" });
  }
});

// GET /api/showcase/users - Puxar usuários
router.get("/showcase/users", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT id, name, email, role FROM users WHERE company_id = ? LIMIT 50`,
      [DEMO_COMPANY_ID]
    );
    connection.release();
    res.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// GET /api/showcase/stats - Puxar estatísticas
router.get("/showcase/stats", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [openTickets] = await connection.query(
      `SELECT COUNT(*) as count FROM tickets WHERE company_id = ? AND status = 'open'`,
      [DEMO_COMPANY_ID]
    );
    
    const [inProgressTickets] = await connection.query(
      `SELECT COUNT(*) as count FROM tickets WHERE company_id = ? AND status = 'in_progress'`,
      [DEMO_COMPANY_ID]
    );
    
    const [resolvedTickets] = await connection.query(
      `SELECT COUNT(*) as count FROM tickets WHERE company_id = ? AND status = 'resolved'`,
      [DEMO_COMPANY_ID]
    );
    
    const [pendingTickets] = await connection.query(
      `SELECT COUNT(*) as count FROM tickets WHERE company_id = ? AND status = 'pending'`,
      [DEMO_COMPANY_ID]
    );
    
    connection.release();
    
    res.json({
      open: openTickets[0]?.count || 0,
      inProgress: inProgressTickets[0]?.count || 0,
      resolved: resolvedTickets[0]?.count || 0,
      pending: pendingTickets[0]?.count || 0,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

// GET /api/showcase/trainings - Puxar treinamentos
router.get("/showcase/trainings", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [trainings] = await connection.query(
      `SELECT id, title, description, category, status FROM trainings WHERE company_id = ? LIMIT 50`,
      [DEMO_COMPANY_ID]
    );
    connection.release();
    res.json(trainings);
  } catch (error) {
    console.error("Erro ao buscar treinamentos:", error);
    res.status(500).json({ error: "Erro ao buscar treinamentos" });
  }
});

// GET /api/showcase/companies - Puxar empresas
router.get("/showcase/companies", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [companies] = await connection.query(
      `SELECT id, name, email, phone FROM companies LIMIT 50`
    );
    connection.release();
    res.json(companies);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    res.status(500).json({ error: "Erro ao buscar empresas" });
  }
});

export default router;
