import bcrypt from "bcryptjs";

async function run() {
    const hash = await bcrypt.hash("ChangeMe123!", 10);
    console.log(hash);
}

run();