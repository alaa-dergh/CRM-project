const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/visits?clientId=&from=&to=
router.get("/", async (req, res) => {
  try {
    const { clientId, from, to } = req.query;
    const where = req.user.role === "ADMIN" ? {} : { commercialId: req.user.id };

    if (clientId) where.clientId = Number(clientId);
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const visits = await prisma.visit.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });

    res.json(visits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/visits
router.post("/", async (req, res) => {
  try {
    const { clientId, date, result, comment, orderPlaced, nextActionDate } = req.body;

    if (!clientId || !result) {
      return res.status(400).json({ error: "clientId and result are required" });
    }

    const visit = await prisma.visit.create({
      data: {
        clientId: Number(clientId),
        commercialId: req.user.id,
        date: date ? new Date(date) : new Date(),
        result,
        comment,
        orderPlaced: Boolean(orderPlaced),
        nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
      },
    });

    res.status(201).json(visit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// PUT /api/visits/:id
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.visit.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Visit not found" });

    if (req.user.role !== "ADMIN" && existing.commercialId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { date, result, comment, orderPlaced, nextActionDate } = req.body;
    const visit = await prisma.visit.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        result,
        comment,
        orderPlaced,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
      },
    });

    res.json(visit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
