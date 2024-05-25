import { serve } from "bun";
import { Database } from "bun:sqlite";

const db = new Database("local.db");

db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA synchronous = NORMAL;");

db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)");

const insertUsers = () => {
  const stmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
  db.transaction(() => {
    for (let i = 0; i < 10000; i++) {
      stmt.run(`user${i}`, `user${i}@example.com`);
    }
  })();
};

const handleRequest = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (url.pathname === "/" && req.method === "GET") {
    const users = db.query("SELECT * FROM users").all();
    const count = users.length;
    return new Response(JSON.stringify({ count }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (url.pathname === "/" && req.method === "POST") {
    insertUsers();
    return new Response("10,000 users inserted", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Not Found", { status: 404 });
};

serve({
  fetch: handleRequest,
  port: 8080,
});

console.log("Server is running on http://localhost:8080");
