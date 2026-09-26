const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));

// GET /api/users — list all commercials (admin only)
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "COMMERCIAL" },
      select: {
        id: true,
        name: true,
        email: true,
        region: true,
        isActive: true,
        createdAt: true,
        _count: { select: { clients: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PUT /api/users/:id — edit name/email/region/password/status
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, region, password, isActive } = req.body;

    const data = { name, email, region, isActive };
    if (password && password.trim()) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, region: true, isActive: true },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// GET /api/users/:id — basic info for one commercial (admin only)
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, region: true, isActive: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// GET /api/users/:id/history?from=&to= — combined visits + orders timeline for a commercial (admin only)
router.get("/:id/history", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const visits = await prisma.visit.findMany({
      where: { commercialId: id, ...(from || to ? { date: dateFilter } : {}) },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });

    const orders = await prisma.order.findMany({
      where: { commercialId: id, ...(from || to ? { date: dateFilter } : {}) },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { date: "desc" },
    });

    const combined = [
      ...visits.map((v) => ({ ...v, entryType: "visit" })),
      ...orders.map((o) => ({ ...o, entryType: "order" })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;

module.exports = router;