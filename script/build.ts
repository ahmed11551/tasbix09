import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "@neondatabase/serverless",
  "@prisma/client",
  "axios",
  "bcryptjs",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  const isVercel = process.env.VERCEL === "1";
  
  // В Vercel не удаляем dist, так как Prisma Client уже сгенерирован в postinstall
  if (!isVercel) {
    await rm("dist", { recursive: true, force: true });
  }

  // Генерируем Prisma Client всегда (включая Vercel для надежности)
  console.log("generating Prisma client...");
  const { execSync } = await import("child_process");
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
  } catch (error) {
    console.warn("Prisma generate failed, continuing anyway:", error);
  }

  console.log("building client...");
  await viteBuild();

  // Собираем сервер только если не в Vercel (там используется serverless функция)
  if (!isVercel) {
    console.log("building server...");
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    const allDeps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];
    const externals = allDeps.filter((dep) => !allowlist.includes(dep));

    await esbuild({
      entryPoints: ["server/index.ts"],
      platform: "node",
      bundle: true,
      format: "cjs",
      outfile: "dist/index.cjs",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      plugins: [{
        name: 'external-regex',
        setup(build) {
          build.onResolve({ filter: /^@shared\/.*/ }, () => ({ external: true }));
          build.onResolve({ filter: /^shared\/.*/ }, () => ({ external: true }));
        },
      }],
      external: [
        ...externals,
        "drizzle-orm",
        "drizzle-orm/pg-core",
        "drizzle-orm/neon-serverless",
        "drizzle-zod",
      ],
      logLevel: "info",
    });
  } else {
    console.log("Skipping server build for Vercel (using serverless function)");
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
