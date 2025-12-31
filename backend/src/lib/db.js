import initializeFirebase from "./firebase.js";

export const connectDB = async () => {
  try {
    await initializeFirebase();
    console.log("Firebase connected successfully");
  } catch (error) {
    console.log("Firebase connection error:", error);
    throw error;
  }
};
