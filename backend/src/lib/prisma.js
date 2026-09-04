const { PrismaClient } = require("@prisma/client");

// Reuse a single Prisma instance across the app
const prisma = new PrismaClient();

module.exports = prisma;
