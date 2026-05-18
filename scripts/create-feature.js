import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const featureName = process.argv[2];

if (!featureName) {
  console.error("❌ Por favor, informe o nome da nova feature.");
  console.log("👉 Uso correto: npm run feature:new <nome-da-feature>");
  process.exit(1);
}

const featuresDir = path.resolve(__dirname, "../src/features");
const newFeatureDir = path.join(featuresDir, featureName);

if (fs.existsSync(newFeatureDir)) {
  console.error(`❌ A feature "${featureName}" já existe!`);
  process.exit(1);
}

// Pastas a serem criadas
const subdirs = ["components", "hooks", "services"];

// Criando o diretório raiz da feature
fs.mkdirSync(newFeatureDir, { recursive: true });

// Criando as subpastas
subdirs.forEach((dir) => {
  fs.mkdirSync(path.join(newFeatureDir, dir));
  // Cria um .gitkeep para o git rastrear pastas vazias (opcional)
  fs.writeFileSync(path.join(newFeatureDir, dir, ".gitkeep"), "");
});

// Criando arquivo types.ts
fs.writeFileSync(
  path.join(newFeatureDir, "types.ts"),
  `// Tipos e Interfaces do módulo ${featureName}\n\nexport interface ${
    featureName.charAt(0).toUpperCase() + featureName.slice(1)
  }Model {\n  id: string;\n  created_at: string;\n}\n`
);

// Criando o Barrel File (index.ts)
fs.writeFileSync(
  path.join(newFeatureDir, "index.ts"),
  `// API Pública do módulo ${featureName}\n// Tudo que for exportado aqui poderá ser usado por outros módulos.\n\nexport * from "./types";\n`
);

console.log(`✅ Feature "${featureName}" criada com sucesso!`);
console.log(`📂 Caminho: src/features/${featureName}/`);
console.log(`\nEstrutura gerada:`);
console.log(`  ├── components/`);
console.log(`  ├── hooks/`);
console.log(`  ├── services/`);
console.log(`  ├── types.ts`);
console.log(`  └── index.ts (API Pública)\n`);
