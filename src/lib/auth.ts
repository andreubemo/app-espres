import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

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

        const email = credentials.email.trim();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          const valid = await bcrypt.compare(credentials.password, user.password);

          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            type: "USER",
          };
        }

        const client = await prisma.client.findFirst({
          where: { email },
        });

        if (client) {
          const valid = await bcrypt.compare(
            credentials.password,
            client.password
          );

          if (!valid) return null;

          return {
            id: client.id,
            email: client.email,
            role: "CLIENT",
            companyId: client.companyId,
            type: "CLIENT",
          };
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.type = user.type;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.type = token.type as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.AUTH_SECRET,
};