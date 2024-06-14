import nextJest from "next/jest";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

const createJestConfig = nextJest({
  dir: ".",
});
const jestconfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60_000,
});

export default jestconfig;
