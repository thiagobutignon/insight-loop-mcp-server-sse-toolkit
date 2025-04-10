import { Request, Response, NextFunction } from "express";

const allowedOrigins = [
  "http://localhost:3000",
  "https://save-lives-amber.vercel.app",
];

export function dynamicCorsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  // Permite o header Content-Type (e outros, se necessário)
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Permite os métodos desejados (ajuste conforme seu caso)
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  // Caso a requisição seja OPTIONS (preflight), encerre-a aqui com status 200
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
}
