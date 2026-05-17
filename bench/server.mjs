import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".xml": "text/xml",
};

function parseCookie(header) {
  const obj = {};
  if (!header) return obj;
  for (const pair of header.split(";")) {
    const [k, ...v] = pair.trim().split("=");
    if (k) obj[k] = v.join("=");
  }
  return obj;
}

const server = createServer((req, res) => {
  let url = (req.url || "/").split("?")[0];

  if (url === "/bench.html" || url === "/bench") {
    const html = readFileSync(join(__dirname, "bench.html"), "utf-8");
    res.writeHead(200, {
      "Content-Type": "text/html",
      "Cache-Control": "no-store",
    });
    res.end(html);
    return;
  }

  const cookies = parseCookie(req.headers.cookie);
  const build = cookies.build === "after" ? "after" : "before";
  const root = join(__dirname, `dist-${build}`);

  if (url === "/") url = "/index.html";
  const filePath = join(root, url);

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    const index = join(root, "index.html");
    if (existsSync(index)) {
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Cache-Control": "no-store",
      });
      res.end(readFileSync(index));
      return;
    }
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = extname(filePath);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(filePath));
});

server.listen(4000, () => {
  console.log("Benchmark server running at http://localhost:4000/bench.html");
  console.log("Press Ctrl+C to stop.");
});
