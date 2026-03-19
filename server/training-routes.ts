import { Router, Request, Response } from 'express';
import { getPool } from './mysql-pool';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getUserId(req: Request): number | null {
  const user = (req as any).user;
  if (!user) return null;
  return parseInt(user.id || user.userId, 10) || null;
}

async function getTrainingStats(trainingId: number, userId: number | null) {
  const pool = getPool();
  if (!pool) return { avgRating: '0.0', totalRatings: 0, totalLikes: 0, totalComments: 0, userRating: null, userLiked: false };

  const [[stats]] = await pool.query<any[]>(
    `SELECT 
      COALESCE(AVG(stars), 0) as avgRating,
      COUNT(DISTINCT id) as totalRatings,
      SUM(liked) as totalLikes
     FROM training_ratings WHERE trainingId = ?`,
    [trainingId]
  );
  const [[commentCount]] = await pool.query<any[]>(
    `SELECT COUNT(*) as total FROM training_comments WHERE trainingId = ? AND isModerated = 0`,
    [trainingId]
  );

  let userRating = null;
  let userLiked = false;
  if (userId) {
    const [[ur]] = await pool.query<any[]>(
      `SELECT stars, liked FROM training_ratings WHERE trainingId = ? AND userId = ?`,
      [trainingId, userId]
    );
    if (ur) { userRating = ur.stars; userLiked = !!ur.liked; }
  }

  return {
    avgRating: parseFloat(stats?.avgRating || 0).toFixed(1),
    totalRatings: stats?.totalRatings || 0,
    totalLikes: stats?.totalLikes || 0,
    totalComments: commentCount?.total || 0,
    userRating,
    userLiked,
  };
}

// ─── Public Router (optionalJwt) ─────────────────────────────────────────────
// Rotas acessíveis sem autenticação; req.user é populado se token válido existir.

const publicRouter = Router();

// LIST TRAININGS
publicRouter.get('/trainings', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const userId = getUserId(req);
  const { category, level, status, search, page = '1', limit = '12' } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = 'WHERE t.isActive = 1';
    const params: any[] = [];

    if (category) { where += ' AND t.category = ?'; params.push(category); }
    if (level) { where += ' AND t.level = ?'; params.push(level); }
    if (search) { where += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [trainings] = await pool.query<any[]>(
      `SELECT t.*,
        (SELECT COUNT(*) FROM training_lessons WHERE trainingId = t.id) as lesson_count,
        COALESCE((SELECT AVG(stars) FROM training_ratings WHERE trainingId = t.id), 0) as avg_rating,
        COALESCE((SELECT COUNT(*) FROM training_ratings WHERE trainingId = t.id), 0) as rating_count,
        ${userId
          ? `(SELECT COUNT(*) FROM training_completions WHERE trainingId = t.id AND userId = ${userId}) as is_completed,
             (SELECT COUNT(*) FROM training_progress WHERE trainingId = t.id AND userId = ${userId} AND watched = 1) as watched_lessons`
          : '0 as is_completed, 0 as watched_lessons'}
       FROM trainings t ${where}
       ORDER BY t.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query<any[]>(
      `SELECT COUNT(*) as total FROM trainings t ${where}`,
      params
    );

    let filtered = trainings;
    if (status && userId) {
      filtered = trainings.filter((t: any) => {
        if (status === 'concluido') return t.is_completed > 0;
        if (status === 'andamento') return t.watched_lessons > 0 && t.is_completed === 0;
        if (status === 'nao_iniciado') return t.watched_lessons === 0 && t.is_completed === 0;
        return true;
      });
    }

    res.json({ trainings: filtered, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err: any) {
    console.error('[Training] Error listing:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET TRAINING DETAIL
publicRouter.get('/trainings/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const userId = getUserId(req);
  const trainingId = parseInt(req.params.id);

  try {
    const [[training]] = await pool.query<any[]>(
      `SELECT t.*,
        (SELECT COUNT(*) FROM training_lessons WHERE trainingId = t.id) as lesson_count
       FROM trainings t WHERE t.id = ? AND t.isActive = 1`,
      [trainingId]
    );
    if (!training) return res.status(404).json({ error: 'Treinamento não encontrado' });

    const [lessons] = await pool.query<any[]>(
      `SELECT l.id, l.trainingId, l.title, l.description,
        l.videoUrl as video_url, l.duration, l.orderIndex as order_index, l.createdAt,
        ${userId
          ? `(SELECT watched FROM training_progress WHERE trainingId = l.trainingId AND lessonId = l.id AND userId = ${userId}) as watched`
          : '0 as watched'}
       FROM training_lessons l WHERE l.trainingId = ? ORDER BY l.orderIndex ASC`,
      [trainingId]
    );

    const stats = await getTrainingStats(trainingId, userId);

    let completion = null;
    let watchedCount = 0;
    if (userId) {
      const [[comp]] = await pool.query<any[]>(
        `SELECT * FROM training_completions WHERE trainingId = ? AND userId = ?`,
        [trainingId, userId]
      );
      completion = comp || null;

      const [[wc]] = await pool.query<any[]>(
        `SELECT COUNT(*) as cnt FROM training_progress WHERE trainingId = ? AND userId = ? AND watched = 1`,
        [trainingId, userId]
      );
      watchedCount = wc?.cnt || 0;
    }

    const totalLessons = lessons.length;
    const progress = totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0;

    res.json({ training, lessons, stats, completion, progress, watchedCount, totalLessons });
  } catch (err: any) {
    console.error('[Training] Error detail:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET QUIZ (público – sem respostas corretas)
publicRouter.get('/trainings/:id/quiz', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const trainingId = parseInt(req.params.id);

  try {
    const [[quiz]] = await pool.query<any[]>(
      `SELECT * FROM training_quizzes WHERE trainingId = ?`,
      [trainingId]
    );
    if (!quiz) return res.json({ quiz: null, questions: [] });

    const [questions] = await pool.query<any[]>(
      `SELECT id, question, options, orderIndex FROM training_quiz_questions WHERE quizId = ? ORDER BY orderIndex`,
      [quiz.id]
    );

    const parsed = questions.map((q: any) => ({
      ...q,
      options: JSON.parse(q.options || '[]'),
    }));

    res.json({ quiz, questions: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET COMMENTS (público)
publicRouter.get('/trainings/:id/comments', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const trainingId = parseInt(req.params.id);

  try {
    const [comments] = await pool.query<any[]>(
      `SELECT c.*, u.name as userName, u.profileImage as userAvatar
       FROM training_comments c
       LEFT JOIN users u ON c.userId = u.id
       WHERE c.trainingId = ? AND c.isModerated = 0
       ORDER BY c.createdAt DESC`,
      [trainingId]
    );
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Protected Router (authenticateJwt) ──────────────────────────────────────
// Rotas que exigem autenticação obrigatória.

const protectedRouter = Router();

// MY PROGRESS
protectedRouter.get('/trainings/my/progress', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });

  try {
    const [inProgress] = await pool.query<any[]>(
      `SELECT t.*,
        (SELECT COUNT(*) FROM training_lessons WHERE trainingId = t.id) as lesson_count,
        (SELECT COUNT(*) FROM training_progress WHERE trainingId = t.id AND userId = ? AND watched = 1) as watched_lessons
       FROM trainings t
       WHERE t.isActive = 1
         AND EXISTS (SELECT 1 FROM training_progress WHERE trainingId = t.id AND userId = ? AND watched = 1)
         AND NOT EXISTS (SELECT 1 FROM training_completions WHERE trainingId = t.id AND userId = ?)
       ORDER BY t.updatedAt DESC`,
      [userId, userId, userId]
    );

    const [completed] = await pool.query<any[]>(
      `SELECT t.*, tc.completedAt, tc.quizScore, tc.quizPassed,
        (SELECT COUNT(*) FROM training_lessons WHERE trainingId = t.id) as lesson_count
       FROM trainings t
       JOIN training_completions tc ON tc.trainingId = t.id AND tc.userId = ?
       ORDER BY tc.completedAt DESC`,
      [userId]
    );

    const [mandatory] = await pool.query<any[]>(
      `SELECT t.*,
        (SELECT COUNT(*) FROM training_lessons WHERE trainingId = t.id) as lesson_count,
        (SELECT COUNT(*) FROM training_completions WHERE trainingId = t.id AND userId = ?) as is_completed
       FROM trainings t WHERE t.isMandatory = 1 AND t.isActive = 1`,
      [userId]
    );

    res.json({ inProgress, completed, mandatory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MARK LESSON WATCHED
protectedRouter.post('/trainings/:id/lessons/:lessonId/watch', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });

  const trainingId = parseInt(req.params.id);
  const lessonId = parseInt(req.params.lessonId);

  try {
    await pool.query(
      `INSERT INTO training_progress (userId, trainingId, lessonId, watched, watchedAt)
       VALUES (?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE watched = 1, watchedAt = NOW()`,
      [userId, trainingId, lessonId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SUBMIT QUIZ
protectedRouter.post('/trainings/:id/quiz/submit', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });

  const trainingId = parseInt(req.params.id);
  const { answers } = req.body;

  try {
    const [[quiz]] = await pool.query<any[]>(
      `SELECT * FROM training_quizzes WHERE trainingId = ?`,
      [trainingId]
    );
    if (!quiz) return res.status(404).json({ error: 'Quiz não encontrado' });

    const [questions] = await pool.query<any[]>(
      `SELECT * FROM training_quiz_questions WHERE quizId = ? ORDER BY orderIndex`,
      [quiz.id]
    );

    let correct = 0;
    const results = questions.map((q: any) => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) correct++;
      return { questionId: q.id, selected, correct: q.correctIndex, isCorrect };
    });

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= quiz.minScore;

    if (passed) {
      await pool.query(
        `INSERT INTO training_completions (userId, trainingId, quizScore, quizPassed, completedAt)
         VALUES (?, ?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE quizScore = ?, quizPassed = 1, completedAt = NOW()`,
        [userId, trainingId, score, score]
      );
    }

    res.json({ score, passed, minScore: quiz.minScore, correct, total: questions.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST COMMENT
protectedRouter.post('/trainings/:id/comments', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });

  const trainingId = parseInt(req.params.id);
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comentário não pode ser vazio' });

  try {
    const [result] = await pool.query<any>(
      `INSERT INTO training_comments (trainingId, userId, comment) VALUES (?, ?, ?)`,
      [trainingId, userId, content.trim()]
    );
    const [[comment]] = await pool.query<any[]>(
      `SELECT c.*, u.name as userName, u.profileImage as userAvatar
       FROM training_comments c LEFT JOIN users u ON c.userId = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    res.json(comment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE COMMENT
protectedRouter.delete('/trainings/:id/comments/:commentId', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const userId = getUserId(req);
  const user = (req as any).user;
  const commentId = parseInt(req.params.commentId);

  try {
    if (user?.role === 'admin') {
      await pool.query(`DELETE FROM training_comments WHERE id = ?`, [commentId]);
    } else {
      await pool.query(`DELETE FROM training_comments WHERE id = ? AND userId = ?`, [commentId, userId]);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RATE / LIKE
protectedRouter.post('/trainings/:id/rate', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });

  const trainingId = parseInt(req.params.id);
  const { stars, liked } = req.body;

  try {
    await pool.query(
      `INSERT INTO training_ratings (trainingId, userId, stars, liked)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE stars = COALESCE(?, stars), liked = COALESCE(?, liked)`,
      [trainingId, userId, stars || 0, liked ? 1 : 0, stars || null, liked !== undefined ? (liked ? 1 : 0) : null]
    );
    const stats = await getTrainingStats(trainingId, userId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Router (authenticateJwt) ──────────────────────────────────────────

const adminRouter = Router();

// GET all trainings for admin (includes inactive)
adminRouter.get('/admin/trainings', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  try {
    const [trainings] = await pool.query<any[]>(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.thumbnail,
        t.category,
        t.level,
        t.instructor,
        t.totalDuration AS total_duration,
        t.isMandatory AS is_mandatory,
        t.isActive AS is_active,
        t.createdAt AS created_at,
        t.updatedAt AS updated_at,
        COALESCE((SELECT COUNT(*) FROM training_lessons WHERE trainingId = t.id), 0) AS lesson_count,
        COALESCE((SELECT AVG(stars) FROM training_ratings WHERE trainingId = t.id), 0) AS avg_rating,
        COALESCE((SELECT COUNT(*) FROM training_ratings WHERE trainingId = t.id), 0) AS rating_count
       FROM trainings t
       ORDER BY t.createdAt DESC`
    );
    res.json({ trainings, total: trainings.length });
  } catch (err: any) {
    console.error('[Admin] Error listing trainings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/admin/trainings', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const { title, description, thumbnail, category, level, instructor, totalDuration, isMandatory, isActive } = req.body;
  if (!title) return res.status(400).json({ error: 'Título obrigatório' });

  try {
    const [result] = await pool.query<any>(
      `INSERT INTO trainings (title, description, thumbnail, category, level, instructor, totalDuration, isMandatory, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, thumbnail, category, level || 'basico', instructor, totalDuration || 0, isMandatory ? 1 : 0, isActive !== false ? 1 : 0]
    );
    res.json({ id: result.insertId, message: 'Treinamento criado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.put('/admin/trainings/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const trainingId = parseInt(req.params.id);
  const { title, description, thumbnail, category, level, instructor, totalDuration, isMandatory, isActive } = req.body;

  try {
    await pool.query(
      `UPDATE trainings SET title=?, description=?, thumbnail=?, category=?, level=?, instructor=?, totalDuration=?, isMandatory=?, isActive=?, updatedAt=NOW()
       WHERE id=?`,
      [title, description, thumbnail, category, level, instructor, totalDuration, isMandatory ? 1 : 0, isActive !== false ? 1 : 0, trainingId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete('/admin/trainings/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const trainingId = parseInt(req.params.id);

  try {
    await pool.query(`UPDATE trainings SET isActive = 0 WHERE id = ?`, [trainingId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/admin/trainings/:id/lessons', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const trainingId = parseInt(req.params.id);
  const { title, description, videoUrl, duration, orderIndex } = req.body;
  if (!title) return res.status(400).json({ error: 'Título da aula obrigatório' });

  try {
    const [result] = await pool.query<any>(
      `INSERT INTO training_lessons (trainingId, title, description, videoUrl, duration, orderIndex)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [trainingId, title, description, videoUrl, duration || 0, orderIndex || 0]
    );
    await pool.query(
      `UPDATE trainings SET totalDuration = (SELECT COALESCE(SUM(duration), 0) FROM training_lessons WHERE trainingId = ?) WHERE id = ?`,
      [trainingId, trainingId]
    );
    res.json({ id: result.insertId, message: 'Aula criada com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.put('/admin/trainings/:id/lessons/:lessonId', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const trainingId = parseInt(req.params.id);
  const lessonId = parseInt(req.params.lessonId);
  const { title, description, videoUrl, duration, orderIndex } = req.body;

  try {
    await pool.query(
      `UPDATE training_lessons SET title=?, description=?, videoUrl=?, duration=?, orderIndex=?
       WHERE id=? AND trainingId=?`,
      [title, description, videoUrl, duration || 0, orderIndex || 0, lessonId, trainingId]
    );
    await pool.query(
      `UPDATE trainings SET totalDuration = (SELECT COALESCE(SUM(duration), 0) FROM training_lessons WHERE trainingId = ?) WHERE id = ?`,
      [trainingId, trainingId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete('/admin/trainings/:id/lessons/:lessonId', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const trainingId = parseInt(req.params.id);
  const lessonId = parseInt(req.params.lessonId);

  try {
    await pool.query(`DELETE FROM training_lessons WHERE id = ? AND trainingId = ?`, [lessonId, trainingId]);
    await pool.query(
      `UPDATE trainings SET totalDuration = (SELECT COALESCE(SUM(duration), 0) FROM training_lessons WHERE trainingId = ?) WHERE id = ?`,
      [trainingId, trainingId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/admin/trainings/:id/quiz', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const trainingId = parseInt(req.params.id);
  const { minScore, questions } = req.body;

  try {
    const [[existing]] = await pool.query<any[]>(`SELECT id FROM training_quizzes WHERE trainingId = ?`, [trainingId]);
    let quizId: number;

    if (existing) {
      await pool.query(`UPDATE training_quizzes SET minScore = ? WHERE trainingId = ?`, [minScore || 70, trainingId]);
      quizId = existing.id;
      await pool.query(`DELETE FROM training_quiz_questions WHERE quizId = ?`, [quizId]);
    } else {
      const [result] = await pool.query<any>(
        `INSERT INTO training_quizzes (trainingId, minScore) VALUES (?, ?)`,
        [trainingId, minScore || 70]
      );
      quizId = result.insertId;
    }

    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await pool.query(
          `INSERT INTO training_quiz_questions (quizId, question, options, correctIndex, orderIndex) VALUES (?, ?, ?, ?, ?)`,
          [quizId, q.question, JSON.stringify(q.options), q.correctIndex, i]
        );
      }
    }

    res.json({ success: true, quizId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/admin/trainings/reports', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  try {
    const [completions] = await pool.query<any[]>(
      `SELECT tc.*, u.name as userName, u.email as userEmail, t.title as trainingTitle
       FROM training_completions tc
       JOIN users u ON tc.userId = u.id
       JOIN trainings t ON tc.trainingId = t.id
       ORDER BY tc.completedAt DESC
       LIMIT 100`
    );

    const [stats] = await pool.query<any[]>(
      `SELECT t.id, t.title,
        COUNT(DISTINCT tc.userId) as completions,
        COUNT(DISTINCT tp.userId) as started,
        COALESCE(AVG(tr.stars), 0) as avg_rating
       FROM trainings t
       LEFT JOIN training_completions tc ON tc.trainingId = t.id
       LEFT JOIN training_progress tp ON tp.trainingId = t.id
       LEFT JOIN training_ratings tr ON tr.trainingId = t.id
       WHERE t.isActive = 1
       GROUP BY t.id, t.title
       ORDER BY completions DESC`
    );

    res.json({ completions, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Export ───────────────────────────────────────────────────────────────────

export function registerTrainingRoutes(
  app: any,
  optionalJwtMiddleware: any,
  requiredJwtMiddleware: any
) {
  // Rotas públicas: acessíveis sem login; req.user populado se token presente
  app.use('/api', optionalJwtMiddleware, publicRouter);

  // Rotas protegidas: exigem autenticação
  app.use('/api', requiredJwtMiddleware, protectedRouter);

  // Rotas admin: exigem autenticação (admin verificado no frontend/AdminRoute)
  app.use('/api', requiredJwtMiddleware, adminRouter);
}
