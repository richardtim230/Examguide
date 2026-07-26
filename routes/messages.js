import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import GroupChat from "../models/GroupChat.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";
import { nanoid } from "nanoid";

const router = express.Router();

router.use(authenticate);

router.get("/chats", async (req, res) => {
  try {
    const currentUserId = String(req.user._id || req.user.id);

    const directChats = await Chat.find({
      participants: currentUserId
    })
      .populate({
        path: "participants",
        select: "username fullname profilePicture"
      })
      .populate({
        path: "lastMessage"
      })
      .sort({ updatedAt: -1 });

    const chats = [];

    for (const chat of directChats) {
      // Find the other participant
      const otherUser = (chat.participants || []).find(
        (user) => String(user._id) !== currentUserId
      );

      // Skip malformed chats
      if (!otherUser) {
        console.warn(`Skipping invalid chat ${chat._id}:`, chat.participants);
        continue;
      }

      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        isGroup: false,
        from: { $ne: currentUserId },
        readBy: { $ne: currentUserId }
      });

      chats.push({
        // IMPORTANT: This is now the OTHER USER'S ID
        _id: otherUser._id,

        // Preserve the actual chat ID
        chatId: chat._id,

        username: otherUser.username || "",
        fullname: otherUser.fullname || otherUser.username || "Unknown",
        avatar: otherUser.profilePicture || "",

        lastMessageText:
          chat.lastMessage?.text ||
          chat.lastMessageText ||
          "",

        lastMessageTime:
          chat.lastMessage?.createdAt ||
          chat.lastMessageAt ||
          null,

        unreadCount,
        isGroup: false,
        type: "direct"
      });
    }

    const groupChats = await GroupChat.find({
      members: currentUserId
    })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const groups = [];

    for (const group of groupChats) {
      const unreadCount = await Message.countDocuments({
        chat: group._id,
        isGroup: true,
        readBy: { $ne: currentUserId }
      });

      groups.push({
        _id: group._id,
        name: group.name,
        description: group.description || "",
        avatar: group.avatar || "",
        lastMessageText:
          group.lastMessage?.text || "",
        lastMessageTime:
          group.lastMessage?.createdAt || null,
        unreadCount,
        isGroup: true,
        type: group.type || "forum",
        isPublic: group.isPublic,
        memberCount: group.members?.length || 0,
        createdBy: group.createdBy
      });
    }

    res.json({
      chats,
      groups
    });

  } catch (err) {
    console.error("GET /chats error:", err);
    res.status(500).json({
      error: "Failed to load chats.",
      details: err.message
    });
  }
});

router.get("/user/:userId/messages", async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    let chat = await Chat.findOne({ participants: { $all: [req.user.id, otherUserId] } });
    if (!chat) {
      chat = await Chat.create({ participants: [req.user.id, otherUserId] });
    }

    const msgs = await Message.find({ chat: chat._id, isGroup: false })
      .sort("createdAt")
      .populate("from", "username fullname profilePicture")
      .exec();

    await Message.updateMany(
      { chat: chat._id, isGroup: false, from: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );

    const arr = msgs.map((msg) => ({
      _id: msg._id,
      from: msg.from?._id,
      fromName: msg.from?.fullname || msg.from?.username,
      fromAvatar: msg.from?.profilePicture,
      text: msg.text,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      attachments: msg.attachments || [],
      reactions: msg.reactions || {},
      time: msg.createdAt,
      isRead: msg.readBy.length > 1
    }));

    res.json(arr);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/user/:userId/send", async (req, res) => {
  try {
    const { text, attachments } = req.body;
    const toUserId = req.params.userId;

    if (!text && !attachments?.length) return res.status(400).json({ error: "Message content required" });
    if (!toUserId) return res.status(400).json({ error: "Recipient ID required" });

    let chat = await Chat.findOne({ participants: { $all: [req.user.id, toUserId] } });
    if (!chat) {
      chat = await Chat.create({ participants: [req.user.id, toUserId] });
    }

    const m = await Message.create({
      chat: chat._id,
      from: req.user.id,
      to: toUserId,
      text: text || "",
      attachments: attachments || [],
      isGroup: false,
      readBy: [req.user.id]
    });

    chat.lastMessage = m._id;
    chat.updatedAt = Date.now();
    await chat.save();

    await m.populate("from", "username fullname profilePicture");

    try {
      const io = req.app.get("io");
      if (io) {
        const payload = m.toObject ? m.toObject() : m;
        payload.chat = chat._id;
        payload.isGroup = false;
        io.to(`user_${toUserId}`).emit("message:created", payload);
        io.to(`user_${req.user.id}`).emit("message:created", payload);
        io.to(`chat_${chat._id}`).emit("message:created", payload);
      }
    } catch (emitErr) {
      console.warn("Socket emit failed (user send):", emitErr && emitErr.message);
    }

    res.json({
      success: true,
      message: {
        _id: m._id,
        from: m.from?._id,
        fromName: m.from?.fullname || m.from?.username,
        fromAvatar: m.from?.profilePicture,
        text: m.text,
        attachments: m.attachments,
        time: m.createdAt
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/group/:groupId/messages", async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.isPublic && !group.members.map((x) => x.toString()).includes(req.user.id))
      return res.status(403).json({ error: "Not authorized to view this group" });

    const msgs = await Message.find({ chat: group._id, isGroup: true })
      .sort("createdAt")
      .populate("from", "username fullname profilePicture")
      .exec();

    if (group.members.map((x) => x.toString()).includes(req.user.id)) {
      await Message.updateMany(
        { chat: group._id, isGroup: true, from: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
        { $addToSet: { readBy: req.user.id } }
      );
    }

    const arr = msgs.map((msg) => ({
      _id: msg._id,
      from: msg.from?._id,
      fromName: msg.from?.fullname || msg.from?.username,
      fromAvatar: msg.from?.profilePicture,
      text: msg.text,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      attachments: msg.attachments || [],
      reactions: msg.reactions || {},
      time: msg.createdAt
    }));

    res.json(arr);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/group/:groupId/send", async (req, res) => {
  try {
    const { text, attachments } = req.body;
    const group = await GroupChat.findById(req.params.groupId);

    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!group.members.map((x) => x.toString()).includes(req.user.id)) return res.status(403).json({ error: "Not a group member" });
    if (!text && !attachments?.length) return res.status(400).json({ error: "Message content required" });

    const m = await Message.create({
      chat: group._id,
      from: req.user.id,
      text: text || "",
      attachments: attachments || [],
      isGroup: true,
      readBy: [req.user.id]
    });

    group.lastMessage = m._id;
    group.updatedAt = Date.now();
    await group.save();

    await m.populate("from", "username fullname profilePicture");

    try {
      const io = req.app.get("io");
      if (io) {
        const payload = m.toObject ? m.toObject() : m;
        payload.chat = group._id;
        payload.isGroup = true;
        io.to(`group_${group._id}`).emit("message:created", payload);
        io.to(`chat_${group._id}`).emit("message:created", payload);
      }
    } catch (emitErr) {
      console.warn("Socket emit failed (group send):", emitErr && emitErr.message);
    }

    res.json({
      success: true,
      message: {
        _id: m._id,
        from: m.from?._id,
        fromName: m.from?.fullname || m.from?.username,
        fromAvatar: m.from?.profilePicture,
        text: m.text,
        attachments: m.attachments,
        time: m.createdAt
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/groups/create", async (req, res) => {
  try {
    const { name, description, memberIds, avatar, isPublic } = req.body;

    if (!name) return res.status(400).json({ error: "Forum name required" });

    const code = nanoid(8);

    const group = await GroupChat.create({
      name,
      description: description || "",
      avatar: avatar || "",
      members: [req.user.id, ...(memberIds || [])],
      admins: [req.user.id],
      createdBy: req.user.id,
      joinCode: code,
      type: "forum",
      isPublic: isPublic || false
    });

    res.json({
      success: true,
      groupId: group._id,
      code,
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        memberCount: group.members.length
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/group/:groupId/join", async (req, res) => {
  try {
    const { joinCode } = req.body;
    const group = await GroupChat.findById(req.params.groupId);

    if (!group) return res.status(404).json({ error: "Group not found" });

    if (group.members.map((x) => x.toString()).includes(req.user.id)) {
      return res.json({ success: true, message: "Already a member" });
    }

    if (!group.isPublic && group.joinCode !== joinCode) {
      return res.status(403).json({ error: "Invalid join code" });
    }

    group.members.push(req.user.id);
    await group.save();

    res.json({ success: true, message: "Joined group successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/group/:groupId/leave", async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId);

    if (!group) return res.status(404).json({ error: "Group not found" });
    if (!group.members.map((x) => x.toString()).includes(req.user.id)) return res.status(400).json({ error: "Not a member" });

    group.members = group.members.filter((m) => m.toString() !== req.user.id);
    group.admins = group.admins.filter((a) => a.toString() !== req.user.id);

    await group.save();

    res.json({ success: true, message: "Left group successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/similar-users", async (req, res) => {
  try {
    const { q = "", limit = 50 } = req.query;

    const search = q.trim();

    const me = await User.findById(req.user.id);
    if (!me) {
      return res.status(404).json({ error: "User not found" });
    }

    const filter = {
      _id: { $ne: req.user.id },
      department: me.department,
      level: me.level
    };

    // Apply search only when the user has typed something
    if (search.length >= 2) {
      filter.$or = [
        { fullname: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .select("_id username fullname profilePicture department level")
      .sort({ fullname: 1 })
      .limit(Number(limit));

    res.json(users);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/message/:messageId/reaction", async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: "Emoji required" });

    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    await msg.addReaction(req.user.id, emoji);

    try {
      const io = req.app.get("io");
      if (io) {
        const payload = { messageId: msg._id, reactions: msg.reactions, chat: msg.chat };
        io.to(`chat_${msg.chat}`).emit("message:reaction", payload);
        if (msg.isGroup) io.to(`group_${msg.chat}`).emit("message:reaction", payload);
        if (!msg.isGroup) {
          if (msg.to) io.to(`user_${msg.to}`).emit("message:reaction", payload);
          io.to(`user_${msg.from}`).emit("message:reaction", payload);
        }
      }
    } catch (emitErr) {
      console.warn("Socket emit failed (reaction):", emitErr && emitErr.message);
    }

    res.json({ success: true, reactions: msg.reactions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: "Search term must be at least 2 characters."
      });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { fullname: { $regex: q.trim(), $options: "i" } },
        { username: { $regex: q.trim(), $options: "i" } },
        { email: { $regex: q.trim(), $options: "i" } }
      ]
    })
      .select("_id username fullname profilePicture department level")
      .limit(Number(limit));

    const results = await Promise.all(
      users.map(async (user) => {
        const chat = await Chat.findOne({
          participants: {
            $all: [req.user.id, user._id],
            $size: 2
          },
          type: "direct"
        }).select("_id");

        return {
          _id: user._id,
          username: user.username,
          fullname: user.fullname,
          profilePicture: user.profilePicture,
          department: user.department,
          level: user.level,
          hasChat: !!chat,
          chatId: chat?._id || null
        };
      })
    );

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

export default router;
