import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Create a new PrismaClient instance
const prisma = new PrismaClient();

// Function to connect to the database
const connect = async () => {
  try {
    // Connect to the database using Prisma
    prisma.$connect();
  } catch (error) {
    return Error("Failed to connect to the database");
  }
};

interface User {
  worldId: string;
  loginId: boolean;
}

const getUser = async (hash: string): Promise<User | null> => {
  console.log(`hash: ${hash}`);
  const user = await prisma.user.findFirst({
    where: {
      worldId: hash,
    },
  });
  console.log(`user: ${JSON.stringify(user)}`);
  return user;
};

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await connect();
    const user = await getUser(params.id);
    console.log(`GET user: ${JSON.stringify(user)}`);

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const user = await getUser(params.id);
  if (user) {
    return NextResponse.json(
      { message: "user already exists" },
      { status: 200 }
    );
  }
  try {
    await connect();
    const result = await prisma.user.create({
      data: {
        worldId: params.id,
        loginId: true,
      },
    });

    return NextResponse.json({ message: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { searchParams } = new URL(req.url);
  const loginParam = searchParams.get("login");
  const login = loginParam === "true";

  const user = await getUser(params.id);
  console.log(`user: ${JSON.stringify(user)}`);
  if (!user) {
    return NextResponse.json({ message: "user not found" }, { status: 404 });
  }
  try {
    await prisma.$connect();
    const result = await prisma.user.update({
      where: {
        worldId: params.id,
      },
      data: {
        loginId: login,
      },
    });
    return NextResponse.json({ message: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
