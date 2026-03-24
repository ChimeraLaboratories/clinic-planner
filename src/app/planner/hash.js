import bcrypt from "bcryptjs";

async function run() {
    const hash = await bcrypt.hash("t4yl0r", 10);
    console.log(hash);
}

run();