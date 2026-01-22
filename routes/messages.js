import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import GroupChat from "../models/GroupChat.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";
import { nanoid } from "nanoid"; // add to deps 

const router = express.Router();

// All endpoints are authenticated
router.use(authenticate);

/**
 * GET /api/messages/chats
 * List all 1-1 and group chats for current user + meta for sidebar
 */
router.get("/chats", async (req, res) => {
  try {
    // 1-1 chats (those where current user is a participant)
    const directChats = await Chat.find({ participants: req.user.id })
      .populate({path: "participants", select: "username fullname avatar"})
      .populate({path: "lastMessage"})
      .sort("-updatedAt").exec();

    // Map for sidebar: username, fullname, unread, lastMessage etc
    const chats = await Promise.all(directChats.map(async chat => {
      const otherUser = chat.participants.find(u => u._id.toString() !== req.user.id);
      // Count unread for this chat
      const unreadCount = await Message.countDocuments({ 
        chat: chat._id, 
        isGroup: false, 
        from: { $ne: req.user.id }, 
        readBy: { $ne: req.user.id }
      });
      return {
        _id: chat._id,
        username: otherUser?.username, 
        fullname: otherUser?.fullname,
        avatar: otherUser?.avatar,
        lastMessageText: chat.lastMessage?.text,
        lastMessageTime: chat.lastMessage?.createdAt,
        unreadCount,
        isGroup: false
      };
    }));

    // Group chats (the user is a member)
    const groupChats = await GroupChat.find({ members: req.user.id })
      .populate({ path: "lastMessage" })
      .sort("-updatedAt").exec();

    const groups = await Promise.all(groupChats.map(async group => {
      const unreadCount = await Message.countDocuments({
        chat: group._id,
        isGroup: true,
        readBy: { $ne: req.user.id }
      });
      return {
        _id: group._id,
        name: group.name,
        avatar: group.avatar,
        lastMessageText: group.lastMessage?.text,
        lastMessageTime: group.lastMessage?.createdAt,
        unreadCount,
        isGroup: true
      };
    }));

    res.json({ chats, groups });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


/**
 * GET /api/messages/user/:userId/messages
 * Get message thread between me and userId (direct chat)
 */
router.get("/user/:userId/messages", async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    // Find/create chat
    let chat = await Chat.findOne({ participants: { $all: [req.user.id, otherUserId] } });
    if (!chat) {
      // No chat: return empty array
      return res.json([]);
    }
    // Find messages for this chat
    const msgs = await Message.find({ chat: chat._id, isGroup: false })
      .sort("createdAt")
      .populate("from", "username fullname avatar")
      .exec();
    // Mark the fetched as read (if not already)
    await Message.updateMany(
      { chat: chat._id, isGroup: false, from: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    // Format for frontend
    const arr = msgs.map(msg => ({
      _id: msg._id,
      from: msg.from?._id,
      fromAvatar: msg.from?.avatar,
      text: msg.text,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      time: msg.createdAt,
    }));
    res.json(arr);
  } catch (e) {
    res.status(500).json({error: e.message});
  }
});

/**
 * POST /api/messages/user/:userId/send
 * Send a message to a user (starts chat if needed)
 * { text }
 */
router.post("/user/:userId/send", async (req, res) => {
  try {
    const { text } = req.body;
    const toUserId = req.params.userId;
    if (!text || !toUserId) return res.status(400).json({error: "Missing params"});
    // Find or create chat
    let chat = await Chat.findOne({ participants: { $all: [req.user.id, toUserId] } });
    if (!chat) {
      chat = await Chat.create({ participants: [req.user.id, toUserId] });
    }
    // Save message
    const m = await Message.create({
      chat: chat._id,
      from: req.user.id,
      to: toUserId,
      text,
      isGroup: false,
      readBy: [req.user.id]
    });
    chat.lastMessage = m._id;
    chat.updatedAt = Date.now();
    await chat.save();
    res.json({ success: true, message: m });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/messages/group/:groupId/messages
 * Messages for a group
 */
router.get("/group/:groupId/messages", async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({error: "Group not found"});
    // Access: must be a member
    if (!group.members.map(x => x.toString()).includes(req.user.id))
      return res.status(403).json({error: "Not a group member"});
    // Messages
    const msgs = await Message.find({ chat: group._id, isGroup: true })
      .sort("createdAt")
      .populate("from", "username fullname avatar")
      .exec();
    // Mark as read
    await Message.updateMany(
      { chat: group._id, isGroup: true, from: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    const arr = msgs.map(msg => ({
      _id: msg._id,
      from: msg.from?._id,
      fromAvatar: msg.from?.avatar,
      text: msg.text,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      time: msg.createdAt
    }));
    res.json(arr);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/messages/group/:groupId/send
 * Send a message to a group
 */
router.post("/group/:groupId/send", async (req, res) => {
  try {
    const { text } = req.body;
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({error: "Group not found"});
    if (!group.members.map(x => x.toString()).includes(req.user.id))
      return res.status(403).json({error: "Not a group member"});
    // Create message
    const m = await Message.create({
      chat: group._id,
      from: req.user.id,
      text,
      isGroup: true,
      readBy: [req.user.id]
    });
    group.lastMessage = m._id;
    group.updatedAt = Date.now();
    await group.save();
    res.json({ success: true, message: m });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.post("/groups/create", async (req, res) => {
  try {
    const { name, memberIds } = req.body; // memberIds = [userID,...]
    if (!name || !Array.isArray(memberIds) || memberIds.length < 1)
      return res.status(400).json({ error: "Name and memberIds required" });

    // Generate join code
    const code = nanoid(8);

    const group = await GroupChat.create({
      name,
      avatar: req.body.avatar || "",
      members: [req.user.id, ...memberIds],
      admins: [req.user.id],
      createdBy: req.user.id,
      joinCode: code
    });
    res.json({ success: true, groupId: group._id, code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// GET /api/messages/similar-users -- List other users in same department+level (except self)
router.get("/similar-users", async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me) return res.status(404).json({ error: "User not found" });
    const users = await User.find({
      _id: { $ne: req.user.id },
      department: me.department,
      level: me.level
    }).select("_id username fullname avatar department level");
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
export default router;
