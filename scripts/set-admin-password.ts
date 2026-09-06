import bcrypt from "bcryptjs";
import prisma from "../src/db/prisma";

async function main() {
  const email = "sanjoygoraijune@gmail.com";
  const newPassword = "Sanjoy1234@";

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const user = await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Updated:", user.email);
  console.log("Role:", user.role);
  console.log("Password updated successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());