import { getFirestore } from "../lib/firebase.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const db = getFirestore();

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Get all users except the logged-in user
    const usersRef = db.collection("users");
    const usersSnapshot = await usersRef.get();

    const filteredUsers = [];
    usersSnapshot.forEach((doc) => {
      if (doc.id !== loggedInUserId) {
        const userData = doc.data();
        // Exclude password from response
        const { password, ...userWithoutPassword } = userData;
        filteredUsers.push({
          _id: doc.id,
          ...userWithoutPassword,
        });
      }
    });

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Get messages between the two users
    const messagesRef = db.collection("messages");

    // Query for messages sent by me to the other user
    const sentMessagesSnapshot = await messagesRef
      .where("senderId", "==", myId)
      .where("receiverId", "==", userToChatId)
      .get();

    // Query for messages received from the other user
    const receivedMessagesSnapshot = await messagesRef
      .where("senderId", "==", userToChatId)
      .where("receiverId", "==", myId)
      .get();

    // Combine and sort messages by timestamp
    const messages = [];

    sentMessagesSnapshot.forEach((doc) => {
      messages.push({ _id: doc.id, ...doc.data() });
    });

    receivedMessagesSnapshot.forEach((doc) => {
      messages.push({ _id: doc.id, ...doc.data() });
    });

    // Sort by createdAt timestamp
    messages.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return timeA - timeB;
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Create new message document
    const newMessageData = {
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const messagesRef = db.collection("messages");
    const newMessageRef = await messagesRef.add(newMessageData);

    const newMessage = {
      _id: newMessageRef.id,
      ...newMessageData,
    };

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

