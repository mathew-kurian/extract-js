const fs = require('fs');
const path = require('path');

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

const EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.css', '.less', '.scss'];

function extract(file, visited = {}) {
  const data = fs.readFileSync(file, 'utf8');
  
  const files = [];
  const dirname = path.resolve(__dirname, path.dirname(file));
  const qualifiedFileName = path.resolve(__dirname, file);

  if (visited[qualifiedFileName]) {
    return [];
  }

  const FULL_IMPORT = /import\s+?[\"'](.*?)[\"']/g;
  for (const match of (data.match(FULL_IMPORT) || [])) {
    const groups = FULL_IMPORT.exec(match);
    
    if (groups && groups.length > 0) {
      files.push(path.join(dirname, groups[1]));
    }
  }

  const MODULE_IMPORT = /import.*?from\s+?[\"'](.*?)[\"']/g;
  for (const str of (data.match(MODULE_IMPORT) || [])) {
    const groups = MODULE_IMPORT.exec(str);
    
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
      try{
        fs.statSync(file + ext);
        filtered.push(file + ext);

        continue loop;
      } catch(e) {
        // console.error(e);
      }
    }

    console.log('Could not find', file);
  }
  
  const items = [];

  [...new Set(filtered).values()].forEach(item => {
    items.push(item, extract(item, visited))
  });

  return flatten(items);
}

console.log(extract('./test/color.js'));
