const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/objectives  -> commercial sees own, admin can pass ?commercialId= to filter
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

// POST /api/objectives  -> admin only: sets targets for a rep/period
router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const { commercialId, period, targetVisits, targetClients, targetRevenue } = req.body;

    if (!commercialId || !period) {
      return res.status(400).json({ error: "commercialId and period are required" });
    }

    const objective = await prisma.objective.create({
      data: {
        commercialId: Number(commercialId),
        period,
        targetVisits: targetVisits || 0,
        targetClients: targetClients || 0,
        targetRevenue: targetRevenue || 0,
      },
    });

    res.status(201).json(objective);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
