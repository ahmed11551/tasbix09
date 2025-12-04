import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // Путь к статическим файлам: dist/public (куда собирается vite)
  // В зависимости от того, откуда запускается (source или compiled), путь может быть разный
  const possiblePaths = [
    path.resolve(__dirname, "public"), // Если запускается из dist/ (собранный сервер)
    path.resolve(process.cwd(), "dist", "public"), // Если запускается из корня проекта
    path.resolve(__dirname, "..", "dist", "public"), // Если запускается из server/
  ];

  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      break;
    }
  }

  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Checked: ${possiblePaths.join(", ")}. Make sure to run "npm run build" first.`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
