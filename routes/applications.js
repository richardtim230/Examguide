import express from "express";
import multer from "multer";
import path from "path";
import Application from "../models/Application.js";
import Form from "../models/Response.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/applications/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, filename);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB limit

router.post(
  "/",
  upload.single("resume"),
  async (req, res) => {
    try {
      const {
        fullname, dob, gender, email, phone,
        address, education, linkedin, github, position,
        startdate, referral, cover, formCode
      } = req.body;
      let skills = req.body.skills;
      if (!Array.isArray(skills)) {
        if (typeof skills === "string" && skills.length > 0) {
          skills = [skills];
        } else {
          skills = [];
        }
      }

      if (
        !fullname ||
        !dob ||
        !gender ||
        !email ||
        !address ||
        !education ||
        !position ||
        !cover ||
        !req.file ||
        skills.length === 0
      ) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
      }

      let form = null;
      if (formCode) {
        form = await Form.findOne({ code: formCode.toUpperCase() });
      }

      await Application.create({
        fullname,
        dob,
        gender,
        email,
        phone,
        address,
        education,
        linkedin,
        github,
        position,
        skills,
        startdate: startdate ? new Date(startdate) : undefined,
        referral,
        cover,
        resume: req.file.filename,
        formId: form ? form._id : undefined
      });

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: "Failed to submit application" });
    }
  }
);

export default router;
