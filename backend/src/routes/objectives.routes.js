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

// GET /api/objectives?commercialId=&period=
router.get("/", async (req, res) => {
  try {
    const { commercialId, period } = req.query;
    const where = {};

    if (req.user.role === "ADMIN") {
      if (commercialId) where.commercialId = Number(commercialId);
    } else {
      where.commercialId = req.user.id;
    }
    if (period) where.period = period;

    const objectives = await prisma.objective.findMany({
      where,
      include: { commercial: { select: { id: true, name: true } } },
      orderBy: { period: "desc" },
    });

    res.json(objectives);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/objectives — admin only: définit les objectifs d'un commercial pour un mois
router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const { commercialId, period, targetRevenue, targetVisitsPerDay, minOrdersPerDay } = req.body;

    if (!commercialId || !period) {
      return res.status(400).json({ error: "commercialId and period are required" });
    }

    const objective = await prisma.objective.create({
      data: {
        commercialId: Number(commercialId),
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

// PUT /api/objectives/:id — admin only
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
// Un commercial ne peut demander que sa propre progression ; un admin peut demander celle de n'importe qui.
router.get("/progress", async (req, res) => {
  try {
    const targetId =
      req.user.role === "ADMIN" && req.query.commercialId
        ? Number(req.query.commercialId)
        : req.user.id;

    const objective = await prisma.objective.findFirst({
      where: { commercialId: targetId, period: currentPeriod() },
    });

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
      contactsToday: { actual: visitsToday, target: objective?.targetVisitsPerDay || null },
      ordersToday: { actual: ordersToday, minimum: objective?.minOrdersPerDay || null },
      revenueThisMonth: { actual: revenueThisMonth, target: objective?.targetRevenue || null },
      tasks: tasksWithProgress,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute progress" });
  }
});

module.exports = router;