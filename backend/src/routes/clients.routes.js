const express = require("express"); 
const prisma = require("../lib/prisma"); 
const { requireAuth } = require("../middleware/auth"); 

const router = express.Router(); 
router.use(requireAuth); 

// GET /api/clients 
// Admin sees all clients; commercial sees only their own. 
router.get("/", async (req, res) => { 
  try { 
    const where = req.user.role === "ADMIN" ? {} : { commercialId: req.user.id }; 
    const clients = await prisma.client.findMany({ 
      where, 
      include: { commercial: { select: { id: true, name: true } } }, 
      orderBy: { createdAt: "desc" }, 
    }); 
    res.json(clients); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Something went wrong" }); 
  } 
}); 

// GET /api/clients/:id  (with full interaction history) 
router.get("/:id", async (req, res) => { 
  try { 
    const id = Number(req.params.id); 
    const client = await prisma.client.findUnique({ 
      where: { id }, 
      include: { 
        visits: { orderBy: { date: "desc" } }, 
        orders: { include: { items: true }, orderBy: { date: "desc" } }, 
      }, 
    }); 

    if (!client) return res.status(404).json({ error: "Client not found" }); 

    // A commercial can only view their own clients 
    if (req.user.role !== "ADMIN" && client.commercialId !== req.user.id) { 
      return res.status(403).json({ error: "Forbidden" }); 
    } 

    res.json(client); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Something went wrong" }); 
  } 
}); 

// POST /api/clients 
router.post("/", async (req, res) => { 
  try { 
    const { name, location, type, status } = req.body; 
    if (!name) return res.status(400).json({ error: "name is required" }); 

    const client = await prisma.client.create({ 
      data: { 
        name, 
        location, 
        type, 
        status: status || "PROSPECT", 
        commercialId: req.user.id, 
      }, 
    }); 

    res.status(201).json(client); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Something went wrong" }); 
  } 
}); 

// PUT /api/clients/:id 
router.put("/:id", async (req, res) => { 
  try { 
    const id = Number(req.params.id); 
    const existing = await prisma.client.findUnique({ where: { id } }); 
    if (!existing) return res.status(404).json({ error: "Client not found" }); 

    if (req.user.role !== "ADMIN" && existing.commercialId !== req.user.id) { 
      return res.status(403).json({ error: "Forbidden" }); 
    } 

    const { name, location, type, status } = req.body; 
    const client = await prisma.client.update({ 
      where: { id }, 
      data: { name, location, type, status }, 
    }); 

    res.json(client); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: "Something went wrong" }); 
  } 
}); 

module.exports = router; 