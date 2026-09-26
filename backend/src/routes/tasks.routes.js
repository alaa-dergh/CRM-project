const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));

// POST /api/tasks — admin only: assigne "visiter ce client X fois/mois" à un commercial
router.post("/", async (req, res) => {
  try {
    const { commercialId, clientId, timesPerMonth } = req.body;

    if (!commercialId || !clientId || !timesPerMonth) {
      return res.status(400).json({ error: "commercialId, clientId and timesPerMonth are required" });
    }

    const task = await prisma.task.create({
      data: {
        commercialId: Number(commercialId),
        clientId: Number(clientId),
        timesPerMonth: Number(timesPerMonth),
      },
      include: { client: { select: { id: true, name: true } } },
    });

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router;