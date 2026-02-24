import { Request, Response } from "express";
import argon from "argon2";
import prisma from "../utils/prisma.js";
import { encodeJwt } from "../utils/jwt.js";

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log("Here from login User")
    try {
        if (email && password) {
            const response = await prisma.user.findUnique({
                where: { email: email }
            })
            if (!response) return res.status(404).json({ message: "You must register first" });
            if (response?.password) {
                // console.log();
                const hasMatched = await argon.verify(password, response.password)
                if (!hasMatched) return res.status(400).json("Invalid Password");
                else {
                    const token = encodeJwt(response.id);
                    const user = {
                        email: response.email,
                        first_name: response.name,
                        last_name: response.institution_id
                    }
                    return res.status(200).json({ payload: { user, token }, message: "User Logged in" });
                }
            }
        }
        else throw new Error("Invalid credentials");

    } catch (error: any) {
        if (error.code === "P2022") res.status(404).json({ message: "You must register first" });
        console.log(error.code);
        res.status(500).json({ message: "Something went wrong while logging you in" })
    }
}

export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, confirmPassword } = req.body;
    console.log("Here at Register User", req.body);
    try {
        if (!email || password !== confirmPassword) {
            return res.status(400).json({ message: "Bad Request: Invalid email or password" });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "User already exists. Try Logging In" });

        const hashedPassword = await argon.hash(password);
        const createdUser = await prisma.user.create({
            data: { name, email, password: hashedPassword }
        });

        return res.status(201).json({
            message: "User registered successfully",
            next_step: "Verify Email",
            user: { email }
        });

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong while registering user: " + error.message });
    }
};

export const getStatus = async (req: Request, res: Response) => {
    res.status(200).json({ message: "Authentication Service is up and running" });
}   