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

module.exports = router;