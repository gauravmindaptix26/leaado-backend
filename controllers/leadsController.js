import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Lead from "../models/Lead.js";
import { sendLeadToKartik } from "../services/kartikClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getLeads = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const leads = await Lead.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, leads });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch leads" });
  }
};

export const uploadLeads = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const docs = req.files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      sourceType: "file",
      website: file.originalname || file.filename,
      owner: req.user.id,
      filePath: file.path.replace(/\\/g, "/"),
      fileUrl: `/uploads/${file.filename}`,
      status: "ready"
    }));

    const leads = await Lead.insertMany(docs);
    res.status(201).json({ success: true, leads });
  } catch (error) {
    console.error("Upload leads error:", error);
    res.status(500).json({ success: false, message: "Unable to upload leads" });
  }
};

export const importLeadFromUrl = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ success: false, message: "Import link is required" });
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(link)) {
      return res.status(400).json({ success: false, message: "Please provide a valid URL" });
    }

    const lead = await Lead.create({
      originalName: link,
      sourceType: "url",
      owner: req.user.id,
      importUrl: link,
      status: "processing"
    });

    res.status(201).json({ success: true, lead });
  } catch (error) {
    console.error("Import lead error:", error);
    res.status(500).json({ success: false, message: "Unable to import lead from URL" });
  }
};

export const deleteLead = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const { id } = req.params;
    const lead = await Lead.findOne({ _id: id, owner: req.user.id });

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    if (lead.sourceType === "file" && lead.filePath) {
      const filePath = path.isAbsolute(lead.filePath)
        ? lead.filePath
        : path.join(__dirname, "..", lead.filePath);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Unable to remove file:", err);
        }
      });
    }

    await lead.deleteOne();
    res.json({ success: true, message: "Lead removed" });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({ success: false, message: "Unable to delete lead" });
  }
};

export const addWebsiteLeads = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const { websites } = req.body;
    if (!Array.isArray(websites) || websites.length === 0) {
      return res.status(400).json({ success: false, message: "No websites provided" });
    }

    const normalized = Array.from(
      new Set(
        websites
          .map((w) => (w || "").trim().toLowerCase())
          .filter((w) => w.length > 0)
      )
    );

    if (normalized.length === 0) {
      return res.status(400).json({ success: false, message: "No valid websites provided" });
    }

    const existing = await Lead.find({ owner: req.user.id, website: { $in: normalized } }).select("website");
    const existingSet = new Set(existing.map((l) => l.website));
    const toInsert = normalized.filter((w) => !existingSet.has(w));

    if (toInsert.length > 0) {
      const docs = toInsert.map((site) => ({
        website: site,
        sourceType: "url",
        owner: req.user.id,
        status: "Pending",
        pitchResult: "Pending"
      }));
      try {
        await Lead.insertMany(docs, { ordered: false });
      } catch (e) {
        if (e.code !== 11000) throw e;
      }
    }

    const leads = await Lead.find({ owner: req.user.id, website: { $exists: true, $ne: null } }).sort({ createdAt: -1 });
    res.status(201).json({ success: true, leads, skipped: normalized.length - toInsert.length });
  } catch (error) {
    console.error("Add website leads error:", error);
    res.status(500).json({ success: false, message: error?.message || "Unable to save websites" });
  }
};

export const addBulkLeads = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const { urls = [], name, email, phone, service, message, website } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, message: "No URLs provided" });
    }

    const normalized = Array.from(
      new Set(
        urls
          .map((u) => (u || "").trim().toLowerCase())
          .filter((u) => u.length > 0)
      )
    );
    if (normalized.length === 0) {
      return res.status(400).json({ success: false, message: "No valid URLs provided" });
    }

    const existing = await Lead.find({
      owner: req.user.id,
      website: { $in: normalized }
    }).select("website");
    const existingSet = new Set(existing.map((l) => l.website));
    const toInsert = normalized.filter((w) => !existingSet.has(w));

    if (toInsert.length > 0) {
      const docs = toInsert.map((site) => ({
        owner: req.user.id,
        website: site,
        contactName: name,
        contactEmail: email,
        contactPhone: phone,
        service,
        message,
        sourceWebsite: website,
        sourceType: "url",
        status: "Pending",
        pitchResult: "Pending"
      }));
      try {
        await Lead.insertMany(docs, { ordered: false });
      } catch (e) {
        if (e.code !== 11000) throw e;
      }
    }

    // Call external API sequentially for each site (best-effort)
    for (const site of toInsert) {
      const result = await sendLeadToKartik({
        website: site,
        name,
        email,
        phone,
        service,
        message,
        sourceWebsite: website
      });
      const statusUpdate = result.success ? "Success" : "Failed";
      await Lead.updateOne(
        { owner: req.user.id, website: site },
        {
          $set: {
            status: statusUpdate,
            pitchResult: statusUpdate,
            pitchMessage: result.error
          }
        }
      );
    }

    const leads = await Lead.find({ owner: req.user.id, website: { $exists: true, $ne: null } }).sort({ createdAt: -1 });
    res.status(201).json({ success: true, leads, skipped: normalized.length - toInsert.length });
  } catch (error) {
    console.error("Add bulk leads error:", error);
    res.status(500).json({ success: false, message: error?.message || "Unable to save bulk websites" });
  }
};


export const updateLeadStatus = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const { id } = req.params;
    const { status, pitchResult, pitchMessage } = req.body;

    const lead = await Lead.findOne({ _id: id, owner: req.user.id });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    if (status) lead.status = status;
    if (pitchResult) lead.pitchResult = pitchResult;
    if (pitchMessage) lead.pitchMessage = pitchMessage;

    await lead.save();
    res.json({ success: true, lead });
  } catch (error) {
    console.error("Update lead status error:", error);
    res.status(500).json({ success: false, message: "Unable to update lead status" });
  }
};
