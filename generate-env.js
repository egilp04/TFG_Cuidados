const fs = require("fs");

// Vercel inyectará aquí las variables secretas que configuraste en su web
const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.supabaseUrl || process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.supabaseKey || process.env.SUPABASE_KEY}',
  geminiApiKey: '${process.env.geminiApiKey || process.env.GEMINI_API_KEY}'
};
`;

const envDevConfigFile = `export const environment = {
  production: false,
  supabaseUrl: '${process.env.supabaseUrl || process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.supabaseKey || process.env.SUPABASE_KEY}',
  geminiApiKey: '${process.env.geminiApiKey || process.env.GEMINI_API_KEY}'
};
`;

// Creamos la carpeta y los archivos físicamente en el servidor de Vercel
fs.mkdirSync("./src/environments", { recursive: true });
fs.writeFileSync("./src/environments/environment.ts", envConfigFile);
fs.writeFileSync(
  "./src/environments/environment.development.ts",
  envDevConfigFile,
);

console.log("✅ Archivos de entorno generados dinámicamente con éxito.");
