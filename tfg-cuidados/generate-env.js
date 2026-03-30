const fs = require("fs");
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
fs.mkdirSync("./src/environments", { recursive: true });
fs.writeFileSync("./src/environments/environment.ts", envConfigFile);
fs.writeFileSync(
  "./src/environments/environment.development.ts",
  envDevConfigFile,
);
