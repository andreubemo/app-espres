import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
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
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
            companyId: true,
            active: true,
          },
        });

        if (user) {
          if (!user.active) return null;

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
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.type = token.type;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.AUTH_SECRET,
};

export const auth = () => getServerSession(authOptions);
