import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Current directory:", __dirname);
console.log("Looking for .env in:", path.join(__dirname, '..', '.env'));

const result = dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (result.error) {
    console.log("Error loading .env:", result.error);
} else {
    console.log(".env loaded successfully");
}

console.log("\n=== Environment Variables Check ===");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY exists:", !!process.env.FIREBASE_PRIVATE_KEY);
console.log("FIREBASE_PRIVATE_KEY length:", process.env.FIREBASE_PRIVATE_KEY?.length);
console.log("FIREBASE_PRIVATE_KEY first 50 chars:", process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50));
