const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

// GET /api/objectives?commercialId=&period=  (exact month, unchanged — used by the commercial's own dashboard)
// GET /api/objectives?commercialId=&from=&to=  (month range, inclusive — used by the admin objectives page)
// Sans commercialId (admin) : renvoie TOUT (objectifs par défaut + objectifs spécifiques) pour la période.
router.get("/", async (req, res) => {
  try {
    const { commercialId, period, from, to } = req.query;
    const where = {};

    if (req.user.role === "ADMIN") {
      if (commercialId) where.commercialId = Number(commercialId);
    } else {
      where.commercialId = req.user.id;
    }

    // "period" is a zero-padded "YYYY-MM" string, so lexicographic comparison
    // (gte/lte) is equivalent to chronological comparison — no date parsing needed.
    if (from || to) {
      where.period = {};
      if (from) where.period.gte = from;
      if (to) where.period.lte = to;
    } else if (period) {
      where.period = period;
    }

    const objectives = await prisma.objective.findMany({
      where,
      include: { commercial: { select: { id: true, name: true } } },
      orderBy: [{ period: "desc" }, { commercialId: "asc" }],
    });

    res.json(objectives);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/objectives — admin only
// commercialId omis ou null => objectif "par défaut" appliqué à tous les commerciaux qui n'ont pas d'objectif personnalisé.
router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const { commercialId, period, targetRevenue, targetVisitsPerDay, minOrdersPerDay } = req.body;

    if (!period) {
      return res.status(400).json({ error: "period is required" });
    }

    const normalizedCommercialId = commercialId ? Number(commercialId) : null;

    // Postgres autorise plusieurs NULL sur une contrainte unique, donc on vérifie nous-mêmes
    // qu'il n'existe pas déjà un objectif (par défaut ou pour ce commercial) sur cette période.
    const existing = await prisma.objective.findFirst({
      where: { commercialId: normalizedCommercialId, period },
    });
    if (existing) {
      return res.status(400).json({
        error: normalizedCommercialId
          ? "Un objectif existe déjà pour ce commercial sur cette période. Modifiez-le plutôt."
          : "Un objectif par défaut existe déjà pour cette période. Modifiez-le plutôt.",
      });
    }

    const objective = await prisma.objective.create({
      data: {
        commercialId: normalizedCommercialId,
        period,
        targetRevenue: targetRevenue || 0,
        targetVisitsPerDay: targetVisitsPerDay || 0,
        minOrdersPerDay: minOrdersPerDay || 0,
      },
    });

    res.status(201).json(objective);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// PUT /api/objectives/:id — admin only (commercialId et period ne changent pas après création)
router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { targetRevenue, targetVisitsPerDay, minOrdersPerDay } = req.body;

    const objective = await prisma.objective.update({
      where: { id },
      data: { targetRevenue, targetVisitsPerDay, minOrdersPerDay },
    });

    res.json(objective);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update objective" });
  }
});

// GET /api/objectives/progress?commercialId= — calcule tout en une fois
// Cherche d'abord un objectif personnalisé pour ce commercial ; à défaut, utilise l'objectif par défaut (commercialId = null).
router.get("/progress", async (req, res) => {
  try {
    const targetId =
      req.user.role === "ADMIN" && req.query.commercialId
        ? Number(req.query.commercialId)
        : Number(req.user.id);

    let objective = await prisma.objective.findFirst({
      where: { commercialId: targetId, period: currentPeriod() },
    });

    if (!objective) {
      objective = await prisma.objective.findFirst({
        where: { commercialId: null, period: currentPeriod() },
      });
    }

    const [visitsToday, ordersToday, ordersThisMonth, tasks] = await Promise.all([
      prisma.visit.count({
        where: { commercialId: targetId, date: { gte: startOfToday(), lte: endOfToday() } },
      }),
      prisma.order.count({
        where: { commercialId: targetId, date: { gte: startOfToday(), lte: endOfToday() } },
      }),
      prisma.order.findMany({
        where: { commercialId: targetId, date: { gte: startOfMonth(), lte: endOfMonth() } },
        select: { total: true },
      }),
      prisma.task.findMany({
        where: { commercialId: targetId },
        include: { client: { select: { id: true, name: true } } },
      }),
    ]);

    const revenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.total, 0);

    const tasksWithProgress = await Promise.all(
      tasks.map(async (task) => {
        const visitsThisMonth = await prisma.visit.count({
          where: {
            commercialId: targetId,
            clientId: task.clientId,
            date: { gte: startOfMonth(), lte: endOfMonth() },
          },
        });
        return {
          id: task.id,
          client: task.client,
          timesPerMonth: task.timesPerMonth,
          done: visitsThisMonth,
          completed: visitsThisMonth >= task.timesPerMonth,
        };
      })
    );

    res.json({
      objective: objective || null,
      isDefaultObjective: Boolean(objective && objective.commercialId === null),
      contactsToday: { actual: visitsToday, target: objective?.targetVisitsPerDay ?? null },
      ordersToday: { actual: ordersToday, minimum: objective?.minOrdersPerDay ?? null },
      revenueThisMonth: { actual: revenueThisMonth, target: objective?.targetRevenue ?? null },
      tasks: tasksWithProgress,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute progress" });
  }
});

module.exports = router;