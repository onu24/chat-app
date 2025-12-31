import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let isInitialized = false;

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    // Check if already initialized to avoid duplicate initialization
    if (isInitialized) {
        console.log("Firebase already initialized, skipping...");
        return;
    }

    try {
        // Firebase configuration from environment variables
        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID,
        };

        console.log("Firebase Config:", {
            projectId: firebaseConfig.projectId,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length
        });

        const serviceAccount = {
            projectId: firebaseConfig.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        console.log("Service Account:", {
            projectId: serviceAccount.projectId,
            clientEmail: serviceAccount.clientEmail,
            hasPrivateKey: !!serviceAccount.privateKey
        });

        // Initialize Firebase Admin with credentials
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
        });

        isInitialized = true;
        console.log("Firebase Admin initialized successfully");
    } catch (error) {
        console.error("Firebase initialization error:", error);
        throw error;
    }
};

// Get Firestore instance
export const getFirestore = () => {
    // Auto-initialize if not already done
    if (!isInitialized) {
        initializeFirebase();
    }
    return admin.firestore();
};

// Get Firebase Admin instance
export const getAdmin = () => {
    // Auto-initialize if not already done
    if (!isInitialized) {
        initializeFirebase();
    }
    return admin;
};

export default initializeFirebase;
