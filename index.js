import express from "express";
import { PrismaClient } from "@prisma/client";
const app = express();
const prisma = new PrismaClient();
app.use(express.json());
app.get("/health", async (req, res) => {
    // const users = await prisma.contacts.findMany();
    res.status(200).json("Healthy");
});
app.get("/users", async (req, res) => {
    const users = await prisma.contacts.findMany();
    res.status(200).json(users);
});
app.post("/users", async (req, res) => {
    const { email, phoneNumber, linkedId, linkPrecedence } = req.body;
    const user = await prisma.contacts.create({
        data: { email, phoneNumber, linkedId, linkPrecedence },
    });
    res.json(user);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
