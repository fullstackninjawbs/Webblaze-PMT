const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');

function findAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplace(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (fullPath.includes('ProjectsList.tsx') || fullPath.includes('project.slice.ts')) continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;
      // Replace useGetProjectsQuery()
      if (content.includes('useGetProjectsQuery()')) {
        content = content.replace(/useGetProjectsQuery\(\)/g, 'useGetProjectsQuery({ limit: 1000 })');
        modified = true;
      }
      
      // Replace useGetProjectsQuery(undefined
      if (content.includes('useGetProjectsQuery(undefined')) {
        content = content.replace(/useGetProjectsQuery\(undefined/g, 'useGetProjectsQuery({ limit: 1000 }');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

findAndReplace(srcDir);
