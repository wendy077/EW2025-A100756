const fs = require("fs");
const path = require("path");
const readline = require("readline");

const LOG_DIR = path.join(__dirname, "..", "logs");

async function computeUsageStatistics() {
  const stats = {
    totalLogs: 0,
    ingests: 0,
    exports: 0,
    errors: 0,
    homeViews: 0,
  };

  const files = await fs.promises.readdir(LOG_DIR);
  const logFiles = files.filter((f) => f.endsWith(".log"));

  for (const file of logFiles) {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(LOG_DIR, file)),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue; // ignora linhas que não sejam JSON
      }
      stats.totalLogs++;

      const msg = entry.message || "";
      const lvl = entry.level || "";

      if (lvl === "error") {
        stats.errors++;
      }
      if (msg.includes("Entrada SIP criada")) {
        stats.ingests++;
      }
      if (msg.includes("DIP exportado com sucesso")) {
        stats.exports++;
      }
      if (msg.includes("Homepage acedida")) {
        stats.homeViews++;
      }
    }
  }

  return stats;
}

module.exports = {
  computeUsageStatistics,
};
