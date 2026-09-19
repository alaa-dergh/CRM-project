require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const clientsRoutes = require("./routes/clients.routes");
const visitsRoutes = require("./routes/visits.routes");
const ordersRoutes = require("./routes/orders.routes");
const objectivesRoutes = require("./routes/objectives.routes");
const usersRoutes = require("./routes/users.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/visits", visitsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/objectives", objectivesRoutes);
app.use("/api/users", usersRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
