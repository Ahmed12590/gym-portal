import CredentialsProvider from "next-auth/providers/credentials";
import { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        if (user.status !== "ACTIVE") {
          throw new Error("User account is not active");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;

        // Get gym info for gym owners and staff
        if ((user as any).role === "GYM_OWNER") {
          const gymOwner = await db.gymOwner.findUnique({
            where: { userId: user.id },
            include: { gyms: { select: { id: true, name: true } } },
          });
          if (gymOwner && gymOwner.gyms.length > 0) {
            token.primaryGymId = gymOwner.gyms[0].id;
          }
        } else if ((user as any).role === "STAFF_MEMBER") {
          const staff = await db.staffMember.findUnique({
            where: { userId: user.id },
            select: { gymId: true },
          });
          if (staff) {
            token.gymId = staff.gymId;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        (session.user as any).primaryGymId = token.primaryGymId;
        (session.user as any).gymId = token.gymId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async signIn({ user }) {
      console.log("User signed in:", user.email);
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
