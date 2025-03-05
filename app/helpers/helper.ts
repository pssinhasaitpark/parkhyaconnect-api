import { execSync } from "child_process";

export const applyMigrations = async (): Promise<void> => {
  try {
    console.log("Applying Prisma Migrations...");
    execSync("npx prisma migrate dev", { stdio: "inherit" });
    console.log("Migrations applied successfully");
    
    console.log("Running Prisma Seed...");
    execSync("npx prisma db seed", { stdio: "inherit" });
    console.log("Seeding complete");
  } catch (error) {
    console.error("Error applying migrations or seeding:", error);
  }
};