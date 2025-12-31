import { generateToken } from "../lib/utils.js";
import { getFirestore } from "../lib/firebase.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

const db = getFirestore();

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("email", "==", email).get();

    if (!userSnapshot.empty) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user document
    const newUserData = {
      fullName,
      email,
      password: hashedPassword,
      profilePic: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newUserRef = await usersRef.add(newUserData);
    const userId = newUserRef.id;

    // generate jwt token here
    generateToken(userId, res);

    res.status(201).json({
      _id: userId,
      fullName: newUserData.fullName,
      email: newUserData.email,
      profilePic: newUserData.profilePic,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("email", "==", email).get();

    if (userSnapshot.empty) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userDoc = userSnapshot.docs[0];
    const user = { _id: userDoc.id, ...userDoc.data() };

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    // Update user document in Firestore
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      profilePic: uploadResponse.secure_url,
      updatedAt: new Date(),
    });

    // Get updated user data
    const updatedUserDoc = await userRef.get();
    const updatedUser = { _id: updatedUserDoc.id, ...updatedUserDoc.data() };

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

