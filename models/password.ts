import bcryptjs from "bcryptjs";

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function hashPassword(password: string): Promise<string> {
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(password, rounds);
}

async function comparePassword(
  providedPassword: string,
  storedPassword: string,
): Promise<boolean> {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

const password = {
  hash: hashPassword,
  compare: comparePassword,
};

export default password;
