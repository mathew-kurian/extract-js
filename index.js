const fs = require("fs");
const path = require("path");

function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(
      Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
    );
  }, []);
}

const EXTENSIONS = [".js", ".ts", ".tsx", ".jsx", ".css", ".less", ".scss"];

function extract(file, output, visited = {}) {
  try {
    fs.statSync(file);
  } catch (e) {
    return [];
  }

  const data = fs.readFileSync(file, "utf8");

  const files = [];
  const dirname = path.resolve(__dirname, path.dirname(file));
  const qualifiedFileName = path.resolve(__dirname, file);
  const qualifiedOutput = path.resolve(__dirname, output);

  if (visited[qualifiedFileName]) {
    return [];
  }

  const FULL_IMPORT = /import\s+?[\"'](.*?)[\"']/g;
  for (const match of data.match(FULL_IMPORT) || []) {
    const groups = FULL_IMPORT.exec(match);

    if (groups && groups.length > 0) {
      files.push(path.join(dirname, groups[1]));
    }
  }

  const MODULE_IMPORT = /import.*?from\s+?[\"'](.*?)[\"']/g;
  for (const str of data.match(MODULE_IMPORT) || []) {
    const groups = MODULE_IMPORT.exec(str);

    if (groups && groups.length > 0) {
      files.push(path.join(dirname, groups[1]));
    }
  }

  const REQUIRE_IMPORT = /require\s*?\(\s*?[\"'](.*?)[\"']\s*?\)/g;
  for (const str of data.match(REQUIRE_IMPORT) || []) {
    const groups = REQUIRE_IMPORT.exec(str);

    if (groups && groups.length > 0) {
      files.push(path.join(dirname, groups[1]));
    }
  }

  const filtered = [];
  loop: for (const file of files) {
    if (path.extname(file)) {
      filtered.push(file);
      continue;
    }

    for (const ext of EXTENSIONS) {
      try {
        fs.statSync(file + ext);
        filtered.push(file + ext);

        continue loop;
      } catch (e) {
        // console.error(e);
      }
    }

    console.log("Could not find", file);
  }

  const items = [];

  [...new Set(filtered).values()].forEach(item => {
    items.push(item, extract(item, qualifiedOutput, visited));
  });

  return [...new Set(flatten(items)).values()];
}

try {
  fs.unlinkSync("./output");
} catch (e) {
  // ignore
}

console.log(
  extract(
    "/Users/mkurian/workspace/EKGDashboard/app/dashboard/Dashboard.js",
    "./output"
  )
);
