import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "sanjoygoraijune@gmail.com";

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error(
      `User not found: ${email}`,
    );
  }

  const role = await prisma.role.findUnique({
    where: {
      name: "SUPER_ADMIN",
    },
  });

  if (!role) {
    throw new Error(
      "SUPER_ADMIN role not found. Run the RBAC seed first.",
    );
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  // Keep the legacy field synchronized for now.
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: "SUPER_ADMIN",
    },
  });

  console.log(
    `${email} is now SUPER_ADMIN`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });