import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PRODUCTION_FUNCTIONS = [
    "recipe-extraction",
    "recipe-ideas-generation",
    "recipe-creation",
    "link-shares-on-signup",
    "ingredient-substitution",
    "generate-recipe-image",
    "upload-user-image",
    "ai-chef-chat",
];

const PRODUCTION_ENV_FILE = resolve(process.cwd(), ".env.production");

const loadEnvFile = (filePath) => {
    if (!existsSync(filePath)) {
        return {};
    }

    return readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .reduce((env, line) => {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith("#")) {
                return env;
            }

            const separatorIndex = trimmed.indexOf("=");
            if (separatorIndex === -1) {
                return env;
            }

            const key = trimmed.slice(0, separatorIndex).trim();
            let value = trimmed.slice(separatorIndex + 1).trim();

            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            env[key] = value;
            return env;
        }, {});
};

const envFileValues = loadEnvFile(PRODUCTION_ENV_FILE);
const projectRef =
    process.env.SUPABASE_PROJECT_REF || envFileValues.SUPABASE_PROJECT_REF;

const args = ["functions", "deploy", ...PRODUCTION_FUNCTIONS];

if (projectRef) {
    console.log(
        `Deploying Supabase functions using project ref "${projectRef}".`,
    );
    args.push("--project-ref", projectRef);
} else {
    console.log(
        "SUPABASE_PROJECT_REF was not found in the shell or .env.production. Falling back to the currently linked Supabase project.",
    );
}

const result = spawnSync("supabase", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
});

if (result.error) {
    console.error("Failed to run the Supabase CLI:", result.error.message);
    process.exit(1);
}

process.exit(result.status ?? 0);
