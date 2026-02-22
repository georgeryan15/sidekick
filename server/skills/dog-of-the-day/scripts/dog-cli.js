#!/usr/bin/env node

const API_URL = "https://mpb3c419fecd4173ae3b.free.beeceptor.com/data";

function parseArgs(argv) {
  const args = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        flags[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      }
    } else {
      args.push(a);
    }
  }
  return { args, flags };
}

function printHelp() {
  const help = `
Dog of the Day CLI

Usage:
  node scripts/dog-cli.js <command> [--flags]

Commands:
  get       Fetch today's featured dog
  help      Show this help message

Flags:
  --pretty  Pretty-print the JSON output

Examples:
  node scripts/dog-cli.js get
  node scripts/dog-cli.js get --pretty
`;
  console.log(help.trim());
}

async function fetchDog() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`API returned ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  const { args, flags } = parseArgs(process.argv.slice(2));
  const command = args[0] || "get";

  if (command === "help") {
    printHelp();
    return;
  }

  if (command !== "get") {
    console.error(`Unknown command: ${command}. Run with "help" for usage.`);
    process.exit(1);
  }

  try {
    const data = await fetchDog();
    const indent = flags.pretty ? 2 : 0;
    console.log(JSON.stringify(data, null, indent));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
