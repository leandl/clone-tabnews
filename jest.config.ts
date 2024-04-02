import nextJest from "next/jest";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

const createJestConfig = nextJest({
  dir: ".",
});
const jestconfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

export default jestconfig;
