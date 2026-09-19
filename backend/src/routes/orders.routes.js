const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const where = req.user.role === "ADMIN" ? {} : { commercialId: req.user.id };
    const orders = await prisma.order.findMany({
      where,
      include: { items: true, client: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/orders/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, client: true },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (req.user.role !== "ADMIN" && order.commercialId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/orders
// Body: { clientId, items: [{ product, quantity, price }], status }
// Total is always calculated server-side -- never trust a client-sent total.
router.post("/", async (req, res) => {
  try {
    const { clientId, items, status } = req.body;

    if (!clientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "clientId and at least one item are required" });
    }

    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const order = await prisma.order.create({
      data: {
        clientId: Number(clientId),
        commercialId: req.user.id,
        total,
        status: status || "PENDING",
        items: {
          create: items.map((item) => ({
            product: item.product,
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// PUT /api/orders/:id  (edit client-side details: items and/or status)
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Order not found" });

    if (req.user.role !== "ADMIN" && existing.commercialId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { items, status } = req.body;
    let total = existing.total;

    if (Array.isArray(items) && items.length > 0) {
      total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status || existing.status,
        total,
        ...(Array.isArray(items) && items.length > 0
          ? {
              items: {
                create: items.map((i) => ({
                  product: i.product,
                  quantity: Number(i.quantity),
                  price: Number(i.price),
                })),
              },
            }
          : {}),
      },
      include: { items: true },
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// PUT /api/orders/:id/status
router.put("/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Order not found" });

    if (req.user.role !== "ADMIN" && existing.commercialId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { status } = req.body;
    const order = await prisma.order.update({ where: { id }, data: { status } });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
