import express from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Post from "../models/Post.js";
import Resources from "../models/Resources.js";
import ExamSet from "../models/ExamSet.js";
import CbtQuestion from "../models/CbtQuestion.js";
import { awardTaskPoints } from "../utils/awardTaskPoints.js";

const router = express.Router();

function todayString() {
    return new Date().toISOString().split("T")[0];
}

function hasReward(user, key) {
    if (!user.rewardHistory) return false;
    const arrays = Object.values(user.rewardHistory);
    for (const arr of arrays) {
        if (!Array.isArray(arr)) continue;
        for (const item of arr) {
            if (item.key === key || item.postId === key || item.reason === key) {
                return true;
            }
        }
    }
    return false;
}

async function reloadUser(id) {
    return await User.findById(id);
}

async function completeManualTask(user, taskId) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return { success: false, status: 400, message: "Invalid task id" };
    }
    const task = await Task.findById(taskId);
    if (!task) {
        return { success: false, status: 404, message: "Task not found" };
    }
    if (String(task.user) !== String(user._id)) {
        return { success: false, status: 403, message: "Forbidden" };
    }
    if (task.status === "done") {
        return { success: true, message: "Task already completed", user };
    }

    task.status = "done";
    task.completedAt = new Date();
    await task.save();

    const updatedUser = await awardTaskPoints(user, task.points || 0, {
        key: `task:${task._id}`,
        type: "task",
        reason: task.title,
        by: String(user._id)
    });

    return { success: true, message: "Task completed", user: updatedUser, task };
}

router.patch("/complete", authenticate, async (req, res) => {
    try {
        const { type, id } = req.body;
        const user = await reloadUser(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        switch (type) {
            case "daily_login": {
                const today = todayString();
                const existing = user.dailyTasks.find(d => d.date === today);

                if (existing?.done?.includes("daily_login")) {
                    return res.json({
                        success: true,
                        message: "Already completed today.",
                        points: user.points,
                        creditPoints: user.creditPoints
                    });
                }

                if (existing) {
                    existing.done.push("daily_login");
                } else {
                    user.dailyTasks.push({ date: today, done: ["daily_login"] });
                }

                await user.save();
                const updatedUser = await awardTaskPoints(user, 5, {
                    key: `login:${today}`,
                    type: "bonus",
                    reason: "Daily Login",
                    by: String(user._id),
                    arrayName: "bonus"
                });

                return res.json({
                    success: true,
                    message: "Daily login completed.",
                    pointsAwarded: 5,
                    totalPoints: updatedUser.points,
                    totalCreditPoints: updatedUser.creditPoints
                });
            }

            case "profile": {
                const fields = [
                    user.fullname, user.username, user.email, user.profilePic,
                    user.faculty, user.department, user.level, user.bio
                ];
                const percent = Math.round((fields.filter(Boolean).length / fields.length) * 100);

                if (percent < 100) {
                    return res.status(400).json({ error: "Profile is not yet complete.", progress: percent });
                }

                if (hasReward(user, "profile_complete")) {
                    return res.json({
                        success: true,
                        message: "Profile reward already claimed.",
                        totalPoints: user.points,
                        totalCreditPoints: user.creditPoints
                    });
                }

                const updatedUser = await awardTaskPoints(user, 30, {
                    key: "profile_complete",
                    type: "bonus",
                    reason: "Completed profile",
                    by: String(user._id),
                    arrayName: "bonus"
                });

                return res.json({
                    success: true,
                    message: "Profile task completed.",
                    pointsAwarded: 30,
                    totalPoints: updatedUser.points,
                    totalCreditPoints: updatedUser.creditPoints
                });
            }

            case "referral": {
                if ((user.totalReferrals || 0) < 1) {
                    return res.status(400).json({
                        error: "Invite at least one friend first.",
                        referralCode: user.referralCode,
                        referrals: user.totalReferrals || 0
                    });
                }

                if (hasReward(user, "refer_friend")) {
                    return res.json({
                        success: true,
                        message: "Referral reward already claimed.",
                        totalPoints: user.points,
                        totalCreditPoints: user.creditPoints
                    });
                }

                const updatedUser = await awardTaskPoints(user, 50, {
                    key: "refer_friend",
                    type: "bonus",
                    reason: "First successful referral",
                    by: String(user._id),
                    arrayName: "bonus"
                });

                return res.json({
                    success: true,
                    message: "Referral completed.",
                    pointsAwarded: 50,
                    totalPoints: updatedUser.points,
                    totalCreditPoints: updatedUser.creditPoints
                });
            }

            case "article": {
                if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid article id" });
                }

                const post = await Post.findOne({ _id: id, status: "Published", rewardEnabled: true });
                if (!post) return res.status(404).json({ error: "Article not found" });

                if ((user.completedArticles || []).some(p => String(p) === String(post._id))) {
                    return res.json({
                        success: true,
                        message: "Article already completed.",
                        totalPoints: user.points,
                        totalCreditPoints: user.creditPoints
                    });
                }

                const rewardKey = `article:${post._id}`;
                if (hasReward(user, rewardKey)) {
                    return res.json({
                        success: true,
                        message: "Reward already claimed.",
                        totalPoints: user.points,
                        totalCreditPoints: user.creditPoints
                    });
                }

                let points = post.rewardPoints || 20;
                switch (post.category) {
                    case "Academics": points = Math.max(points, 30); break;
                    case "Scholarships": points = Math.max(points, 35); break;
                    case "Opportunities": points = Math.max(points, 25); break;
                    case "Tips & Hacks": points = Math.max(points, 20); break;
                    case "Campus Life": points = Math.max(points, 15); break;
                }

                user.completedArticles.push(post._id);
                await user.save();

                const updatedUser = await awardTaskPoints(user, points, {
                    key: rewardKey,
                    type: "reading",
                    reason: `Completed article: ${post.title}`,
                    by: String(user._id),
                    arrayName: "reading"
                });

                return res.json({
                    success: true,
                    message: "Article completed.",
                    pointsAwarded: points,
                    totalPoints: updatedUser.points,
                    totalCreditPoints: updatedUser.creditPoints
                });
            }

            case "resource": {
                if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid resource id" });
                }

                const resource = await Resources.findOne({ _id: id, published: true });
                if (!resource) return res.status(404).json({ error: "Resource not found" });

                const rewardKey = `resource:${resource._id}`;
                if (hasReward(user, rewardKey)) {
                    return res.json({
                        success: true,
                        message: "Resource already completed.",
                        totalPoints: user.points,
                        totalCreditPoints: user.creditPoints
                    });
                }

                let points = 25;
                if (resource.faculty && String(resource.faculty) === String(user.faculty)) points += 5;
                if (resource.department && String(resource.department) === String(user.department)) points += 10;
                if (resource.level && String(resource.level) === String(user.level)) points += 5;

                const updatedUser = await awardTaskPoints(user, points, {
                    key: rewardKey,
                    type: "reading",
                    reason: `Studied ${resource.title}`,
                    by: String(user._id),
                    arrayName: "reading"
                });

                return res.json({
                    success: true,
                    message: "Resource completed.",
                    pointsAwarded: points,
                    totalPoints: updatedUser.points,
                    totalCreditPoints: updatedUser.creditPoints
                });
            }

            default:
                return res.status(400).json({ error: "Invalid completion type" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/daily_login", authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const today = new Date().toISOString().slice(0, 10);
        const alreadyClaimed = (user.rewardHistory?.bonus || []).some(
            r => r.reason === "Daily Login" && new Date(r.date).toISOString().slice(0, 10) === today
        );

        if (alreadyClaimed) {
            return res.status(400).json({ success: false, message: "Daily reward already claimed." });
        }

        const updatedUser = await awardTaskPoints(user, 5, {
            key: `daily_login:${today}`,
            type: "bonus",
            reason: "Daily Login",
            by: String(req.user.id)
        });

        res.json({
            success: true,
            pointsAwarded: 5,
            totalPoints: updatedUser.points,
            totalCreditPoints: updatedUser.creditPoints
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not claim daily login reward." });
    }
});

router.patch("/read_article", authenticate, async (req, res) => {
    try {
        const { postId } = req.body;
        if (!postId) return res.status(400).json({ error: "postId required" });

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, 5, {
            key: `article:${postId}`,
            type: "reading",
            reason: "Read article",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/read_book", authenticate, async (req, res) => {
    try {
        const { resourceId } = req.body;
        if (!resourceId) return res.status(400).json({ error: "resourceId required" });

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, 8, {
            key: `book:${resourceId}`,
            type: "reading",
            reason: "Read textbook",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/complete_quiz", authenticate, async (req, res) => {
    try {
        const { examSetId, score } = req.body;
        if (!examSetId) return res.status(400).json({ error: "examSetId required" });

        let reward = 5;
        if (score >= 80) reward = 20;
        else if (score >= 60) reward = 15;
        else if (score >= 40) reward = 10;

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, reward, {
            key: `quiz:${examSetId}`,
            type: "practiced",
            reason: "Completed CBT",
            by: req.user.id
        });

        res.json({ success: true, reward, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/share_post", authenticate, async (req, res) => {
    try {
        const { postId } = req.body;
        if (!postId) return res.status(400).json({ error: "postId required" });

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, 4, {
            key: `share:${postId}`,
            type: "bonus",
            reason: "Shared a post",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/comment_post", authenticate, async (req, res) => {
    try {
        const { postId } = req.body;
        if (!postId) return res.status(400).json({ error: "postId required" });

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, 3, {
            key: `comment:${postId}`,
            type: "bonus",
            reason: "Commented on a post",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/like_post", authenticate, async (req, res) => {
    try {
        const { postId } = req.body;
        if (!postId) return res.status(400).json({ error: "postId required" });

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, 1, {
            key: `like:${postId}`,
            type: "bonus",
            reason: "Liked a post",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/watch_video", authenticate, async (req, res) => {
    try {
        const { videoId } = req.body;
        if (!videoId) return res.status(400).json({ error: "videoId required" });

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, 6, {
            key: `video:${videoId}`,
            type: "reading",
            reason: "Watched educational video",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/complete_profile", authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const completed = user.fullname && user.email && user.phone && user.profilePic && user.faculty && user.department && user.level;

        if (!completed) {
            return res.status(400).json({ error: "Complete your profile first." });
        }

        await awardTaskPoints(user, 15, {
            key: "profile_complete",
            type: "bonus",
            reason: "Completed profile",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/verify_email", authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.emailVerified) {
            return res.status(400).json({ error: "Email not verified." });
        }

        await awardTaskPoints(user, 10, {
            key: "email_verified",
            type: "bonus",
            reason: "Verified Email",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/upload_resource", authenticate, async (req, res) => {
    try {
        if (!["publisher", "admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Only publishers can earn this reward." });
        }

        const { resourceId } = req.body;
        if (!resourceId) return res.status(400).json({ error: "resourceId required" });

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, 20, {
            key: `resource:${resourceId}`,
            type: "bonus",
            reason: "Uploaded resource",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/become_publisher", authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== "publisher") {
            return res.status(400).json({ error: "User is not yet a publisher." });
        }

        await awardTaskPoints(user, 50, {
            key: "publisher_reward",
            type: "bonus",
            reason: "Became Publisher",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/first_purchase", authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, 30, {
            key: "first_purchase",
            type: "bonus",
            reason: "First Purchase",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/streak_reward", authenticate, async (req, res) => {
    try {
        const { streak } = req.body;
        if (!streak) return res.status(400).json({ error: "streak required" });

        const user = await User.findById(req.user.id);
        const reward = Math.min(streak * 2, 100);

        await awardTaskPoints(user, reward, {
            key: `streak:${streak}`,
            type: "bonus",
            reason: `${streak} day streak`,
            by: req.user.id
        });

        res.json({ success: true, reward, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/special_bonus", authenticate, async (req, res) => {
    try {
        const { reason, points } = req.body;
        if (!points) return res.status(400).json({ error: "points required" });

        const user = await User.findById(req.user.id);
        await awardTaskPoints(user, points, {
            key: `bonus:${Date.now()}`,
            type: "admin",
            reason: reason || "Special Bonus",
            by: req.user.id
        });

        res.json({ success: true, points: user.points, creditPoints: user.creditPoints });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
