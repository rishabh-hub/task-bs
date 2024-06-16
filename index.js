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
app.post("/identify", async (req, res) => {
    let { email, phoneNumber } = req.body;
    // Treat null values as undefined
    email = email || undefined;
    phoneNumber = phoneNumber || undefined;
    if (!email && !phoneNumber) {
        return res
            .status(400)
            .json({ error: "Email or phoneNumber must be provided" });
    }
    try {
        // Fetch initial contacts based on email or phone number
        let initialContacts = await prisma.contacts.findMany({
            where: {
                OR: [{ email: email }, { phoneNumber: phoneNumber }],
            },
        });
        let primaryContact;
        let secondaryContacts = [];
        if (initialContacts.length === 0) {
            // If no contacts found, create a new primary contact
            primaryContact = await prisma.contacts.create({
                data: {
                    email: email || null,
                    phoneNumber: phoneNumber || null,
                    linkPrecedence: "primary",
                },
            });
            // Return with empty secondaryContactIds array
            return res.status(200).json({
                contact: {
                    primaryContactId: primaryContact.id,
                    emails: [primaryContact.email].filter((email) => email),
                    phoneNumbers: [primaryContact.phoneNumber].filter((phoneNumber) => phoneNumber),
                    secondaryContactIds: [],
                },
            });
        }
        // Determine the primary contact
        primaryContact =
            initialContacts.find((contact) => !contact.linkedId) ||
                initialContacts[0];
        // Expand search to find more contacts using primary contact's phone number
        let additionalContacts = [];
        if (primaryContact.phoneNumber) {
            additionalContacts = await prisma.contacts.findMany({
                where: {
                    phoneNumber: primaryContact.phoneNumber,
                },
            });
        }
        // Merge initial and additional contacts, ensuring no duplicates
        const allContacts = Array.from(new Set([...initialContacts, ...additionalContacts]));
        // Identify the primary contact again in case of additional contacts
        primaryContact =
            allContacts.find((contact) => !contact.linkedId) || primaryContact;
        // Gather all linked contacts
        secondaryContacts = allContacts.filter((contact) => contact.linkedId === primaryContact.id ||
            (contact.id !== primaryContact.id && contact.linkedId));
        // If email is provided but doesn't exactly match existing contacts, create a new secondary contact
        if (email && !initialContacts.find((contact) => contact.email === email)) {
            const newSecondaryEmailContact = await prisma.contacts.create({
                data: {
                    email: email,
                    phoneNumber: null,
                    linkedId: primaryContact.id,
                    linkPrecedence: "secondary",
                },
            });
            secondaryContacts.push(newSecondaryEmailContact);
        }
        // If phoneNumber is provided but doesn't exactly match existing contacts, create a new secondary contact
        if (phoneNumber &&
            !initialContacts.find((contact) => contact.phoneNumber === phoneNumber)) {
            const newSecondaryPhoneContact = await prisma.contacts.create({
                data: {
                    email: null,
                    phoneNumber: phoneNumber,
                    linkedId: primaryContact.id,
                    linkPrecedence: "secondary",
                },
            });
            secondaryContacts.push(newSecondaryPhoneContact);
        }
        // Consolidate contact information
        const consolidatedContact = {
            primaryContactId: primaryContact.id,
            emails: Array.from(new Set([
                primaryContact.email,
                ...secondaryContacts.map((contact) => contact.email),
            ].filter((email) => email))),
            phoneNumbers: Array.from(new Set([
                primaryContact.phoneNumber,
                ...secondaryContacts.map((contact) => contact.phoneNumber),
            ].filter((phoneNumber) => phoneNumber))),
            secondaryContactIds: Array.from(new Set(secondaryContacts.map((contact) => contact.id))),
        };
        res.status(200).json({ contact: consolidatedContact });
    }
    catch (error) {
        console.error("Error identifying contact:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
