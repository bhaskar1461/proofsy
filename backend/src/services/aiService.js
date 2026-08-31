/**
 * Proofsy AI Service — Multi-provider natural language operator
 * 
 * Supports Groq, OpenAI, and Anthropic-compatible APIs.
 * Uses function calling to map natural language to Proofsy tool calls
 * including certificate lifecycle, template management & visual editing.
 */

const Certificate = require("../models/Certificate");
const Event = require("../models/Event");
const Template = require("../models/Template");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

/* ═══════════════════════════════════════════════
   Provider Configuration
   ═══════════════════════════════════════════════ */
const PROVIDERS = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    keyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini",
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    keyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: "claude-3-haiku-20240307",
  },
};

function getProvider() {
  const name = (process.env.AI_PROVIDER || "groq").toLowerCase();
  const config = PROVIDERS[name];
  if (!config) throw new Error(`Unknown AI provider: ${name}. Supported: ${Object.keys(PROVIDERS).join(", ")}`);
  const apiKey = process.env[config.keyEnv];
  if (!apiKey) throw new Error(`${config.keyEnv} not configured for provider ${name}`);
  const model = process.env[config.modelEnv] || config.defaultModel;
  return { name, ...config, apiKey, model };
}

/* ═══════════════════════════════════════════════
   Tool Definitions
   ═══════════════════════════════════════════════ */
const PROOFSY_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_certificates",
      description: "Search and list certificates. Can filter by recipient name, email, event name, status, or date range.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search text to match against recipient name, email, event name, or code" },
          status: { type: "string", enum: ["pending", "generated", "failed", "revoked", "expired", "suspended"], description: "Filter by certificate status" },
          limit: { type: "number", description: "Max results to return (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_certificate_stats",
      description: "Get certificate statistics — total count, generated, pending, failed, revoked counts.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_events",
      description: "List all events/campaigns in the workspace with their certificate counts.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_templates",
      description: "List all available certificate templates with their names, dimensions, and layer counts.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_template_details",
      description: "Get complete details of a certificate template including all text layers (variables, labels, x, y coordinates, font size, font family, font weight, color, alignment) and QR code settings.",
      parameters: {
        type: "object",
        properties: {
          templateName: { type: "string", description: "Name of the template (e.g. 'Elegant Gold', 'Modern Blue', 'Dark Premium')" },
          templateId: { type: "string", description: "MongoDB ID of the template" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_template",
      description: "Edit and customize a certificate template. Can change template name, dimensions, modify existing text layers (color, font size, font family, position x/y, alignment), add new layers, remove layers, or update QR code placement.",
      parameters: {
        type: "object",
        properties: {
          templateName: { type: "string", description: "Name of the template to edit" },
          templateId: { type: "string", description: "ID of the template to edit" },
          newName: { type: "string", description: "New name for the template" },
          width: { type: "number", description: "Canvas width in pixels" },
          height: { type: "number", description: "Canvas height in pixels" },
          modifyLayers: {
            type: "array",
            description: "List of layer updates. Matches by variable or label.",
            items: {
              type: "object",
              properties: {
                variableOrLabel: { type: "string", description: "Target variable (recipient_name, event_name, date, organizer, custom, etc.) or label to update" },
                fontSize: { type: "number", description: "New font size" },
                fontFamily: { type: "string", description: "Font family (e.g. 'Inter', 'Playfair Display', 'Outfit')" },
                fontWeight: { type: "string", enum: ["normal", "bold"] },
                color: { type: "string", description: "Hex color code (e.g. '#D4AF37', '#1E40AF', '#FFFFFF', '#000000')" },
                textAlign: { type: "string", enum: ["left", "center", "right"] },
                x: { type: "number", description: "X coordinate position" },
                y: { type: "number", description: "Y coordinate position" },
                customText: { type: "string", description: "Custom text content" },
              },
              required: ["variableOrLabel"],
            },
          },
          addLayers: {
            type: "array",
            description: "List of new text layers to add to the template",
            items: {
              type: "object",
              properties: {
                variable: { type: "string", enum: ["recipient_name", "event_name", "date", "verification_code", "organizer", "duration", "custom"] },
                label: { type: "string", description: "Display label for this layer" },
                x: { type: "number" },
                y: { type: "number" },
                fontSize: { type: "number" },
                fontFamily: { type: "string" },
                fontWeight: { type: "string", enum: ["normal", "bold"] },
                color: { type: "string" },
                textAlign: { type: "string", enum: ["left", "center", "right"] },
                customText: { type: "string" },
              },
              required: ["variable", "label", "x", "y"],
            },
          },
          removeLayers: {
            type: "array",
            description: "List of layer variables or labels to remove from the template",
            items: { type: "string" },
          },
          qrCode: {
            type: "object",
            properties: {
              enabled: { type: "boolean" },
              x: { type: "number" },
              y: { type: "number" },
              size: { type: "number" },
            },
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "duplicate_template",
      description: "Clone an existing starter or custom template to create a new customized template with a new name.",
      parameters: {
        type: "object",
        properties: {
          sourceTemplateName: { type: "string", description: "Name of the source template to clone" },
          newTemplateName: { type: "string", description: "Name for the newly duplicated template" },
        },
        required: ["sourceTemplateName", "newTemplateName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_certificate_details",
      description: "Get full details of a specific certificate by recipient name or verification code.",
      parameters: {
        type: "object",
        properties: {
          recipientName: { type: "string", description: "Recipient name to search for" },
          verificationCode: { type: "string", description: "Certificate verification code" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_certificate",
      description: "Create a single certificate for a recipient. Requires event name/ID, recipient name, and email.",
      parameters: {
        type: "object",
        properties: {
          recipientName: { type: "string", description: "Full name of the recipient" },
          recipientEmail: { type: "string", description: "Email address of the recipient" },
          eventName: { type: "string", description: "Name of the event to issue the certificate for" },
        },
        required: ["recipientName", "recipientEmail", "eventName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_certificate_email",
      description: "Send certificate delivery emails for a specific event. Sends to all recipients with generated certificates who haven't received their email yet.",
      parameters: {
        type: "object",
        properties: {
          eventName: { type: "string", description: "Name of the event whose certificates to email" },
          recipientEmail: { type: "string", description: "Optional: send to a specific recipient only" },
        },
        required: ["eventName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "revoke_certificate",
      description: "Revoke a certificate by verification code or recipient name. This is a destructive action.",
      parameters: {
        type: "object",
        properties: {
          verificationCode: { type: "string", description: "Verification code of the certificate to revoke" },
          recipientName: { type: "string", description: "Recipient name to search and revoke" },
          reason: { type: "string", description: "Reason for revocation" },
        },
        required: ["reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "regenerate_certificate",
      description: "Regenerate a certificate's PDF. Use when a certificate generation failed or needs to be re-created.",
      parameters: {
        type: "object",
        properties: {
          verificationCode: { type: "string", description: "Verification code of the certificate to regenerate" },
          recipientName: { type: "string", description: "Recipient name to search and regenerate" },
        },
      },
    },
  },
];

/* ═══════════════════════════════════════════════
   System Prompt
   ═══════════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are **Proofsy AI**, an intelligent assistant that operates the Proofsy certificate management and design platform. You help users manage digital certificates, events, templates, screenshot conversions, and design customizations through natural language.

## Your Capabilities
- **Template Management & Visual Editing**:
  - List all templates (\`list_templates\`)
  - Inspect template layers, coordinates, fonts, and colors (\`get_template_details\`)
  - **Edit templates directly**: update colors, font sizes, font families, positions (x/y), text alignment, add custom text layers, delete layers, adjust QR code size/position (\`edit_template\`)
  - Duplicate/clone templates with new names (\`duplicate_template\`)
  - Screenshot/Image conversion to certificates (users can paste with Ctrl+V or upload)
- **Search & Analytics**: Find certificates by name, email, event, status, verification code, or view stats
- **Certificate Lifecycle**: Create certificates, regenerate PDFs, send delivery emails, or revoke certificates

## Rules for Template Editing & Screenshots
- When a user asks if you can edit a template or convert a screenshot into a certificate, answer **YES** enthusiastically and explain what you can do.
- Users can take a screenshot and press **Ctrl+V** anywhere to turn it into an active certificate template with auto-configured text layers.
- If the user specifies what to change (e.g. "Change recipient name color to gold #D4AF37 on Elegant Gold", or "Make the font size 48"), execute the \`edit_template\` tool immediately.
- Use markdown formatting with clear bullet points and bold highlights for all changes.

## General Rules
- Always use tools to get real data and perform real updates — never pretend or fabricate.
- For **read-only** operations (search, stats, list, get details): execute immediately.
- For **template edits & duplicate**: execute and present a crisp breakdown of updated layers and properties.
- For **destructive operations** (revoke): require confirmation with warning.
- Format results with clean markdown: tables for multiple items, \`code\` blocks for hex colors and verification codes.`;

/* ═══════════════════════════════════════════════
   Tool Executors
   ═══════════════════════════════════════════════ */
async function executeTool(toolName, args, workspaceId) {
  switch (toolName) {
    case "search_certificates": {
      const filter = { workspaceId };
      if (args.status) filter.status = args.status;
      
      const limit = Math.min(args.limit || 10, 50);
      let certs = await Certificate.find(filter)
        .populate("userId")
        .populate("eventId")
        .sort({ createdAt: -1 })
        .limit(limit);

      if (args.query) {
        const q = args.query.toLowerCase();
        certs = certs.filter(c => {
          const name = (c.userId?.name || "").toLowerCase();
          const email = (c.userId?.email || "").toLowerCase();
          const event = (c.eventId?.name || "").toLowerCase();
          const code = (c.verificationCode || "").toLowerCase();
          return name.includes(q) || email.includes(q) || event.includes(q) || code.includes(q);
        });
      }

      return {
        count: certs.length,
        certificates: certs.map(c => ({
          id: c._id.toString(),
          recipientName: c.userId?.name || "Unknown",
          recipientEmail: c.userId?.email || "Unknown",
          eventName: c.eventId?.name || "Unknown Event",
          verificationCode: c.verificationCode,
          status: c.status,
          issuedAt: c.createdAt?.toISOString(),
          pdfUrl: c.pdfUrl || null,
        })),
      };
    }

    case "get_certificate_stats": {
      const [total, generated, pending, failed, revoked, expired, suspended] = await Promise.all([
        Certificate.countDocuments({ workspaceId }),
        Certificate.countDocuments({ workspaceId, status: "generated" }),
        Certificate.countDocuments({ workspaceId, status: "pending" }),
        Certificate.countDocuments({ workspaceId, status: "failed" }),
        Certificate.countDocuments({ workspaceId, status: "revoked" }),
        Certificate.countDocuments({ workspaceId, status: "expired" }),
        Certificate.countDocuments({ workspaceId, status: "suspended" }),
      ]);
      return { total, generated, pending, failed, revoked, expired, suspended };
    }

    case "list_events": {
      const events = await Event.find({ workspaceId }).sort({ date: -1 }).lean();
      const eventData = [];
      for (const e of events) {
        const certCount = await Certificate.countDocuments({ eventId: e._id });
        const generatedCount = await Certificate.countDocuments({ eventId: e._id, status: "generated" });
        eventData.push({
          id: e._id.toString(),
          name: e.name,
          date: e.date?.toISOString(),
          organizerName: e.organizerName,
          certificateCount: certCount,
          generatedCount,
        });
      }
      return { count: eventData.length, events: eventData };
    }

    case "list_templates": {
      const templates = await Template.find({
        $or: [{ workspaceId }, { isStarter: true }],
      }).lean();
      return {
        count: templates.length,
        templates: templates.map(t => ({
          id: t._id.toString(),
          name: t.name,
          dimensions: `${t.width || 1056}×${t.height || 746}px`,
          isStarter: !!t.isStarter,
          layerCount: t.textLayers?.length || 0,
        })),
      };
    }

    case "get_template_details": {
      let template = null;
      if (args.templateId) {
        template = await Template.findById(args.templateId);
      } else if (args.templateName) {
        template = await Template.findOne({
          name: { $regex: new RegExp(`^${args.templateName}$`, "i") },
          $or: [{ workspaceId }, { isStarter: true }],
        });
        if (!template) {
          template = await Template.findOne({
            name: { $regex: new RegExp(args.templateName, "i") },
            $or: [{ workspaceId }, { isStarter: true }],
          });
        }
      }

      if (!template) {
        return { success: false, message: `Template "${args.templateName || args.templateId}" not found.` };
      }

      return {
        success: true,
        id: template._id.toString(),
        name: template.name,
        width: template.width || 1056,
        height: template.height || 746,
        dimensions: `${template.width || 1056}×${template.height || 746}px`,
        backgroundType: template.backgroundType,
        backgroundUrl: template.backgroundUrl,
        isStarter: Boolean(template.isStarter),
        qrCode: template.qrCode || { enabled: true, x: 880, y: 580, size: 120 },
        textLayers: (template.textLayers || []).map(l => ({
          id: l._id?.toString() || l.id,
          variable: l.variable,
          label: l.label,
          x: l.x,
          y: l.y,
          fontSize: l.fontSize,
          fontFamily: l.fontFamily,
          fontWeight: l.fontWeight,
          color: l.color,
          textAlign: l.textAlign,
          maxWidth: l.maxWidth,
          customText: l.customText || null,
        })),
      };
    }

    case "edit_template": {
      let template = null;
      if (args.templateId) {
        template = await Template.findById(args.templateId);
      } else if (args.templateName) {
        template = await Template.findOne({
          name: { $regex: new RegExp(`^${args.templateName}$`, "i") },
          $or: [{ workspaceId }, { isStarter: true }],
        });
        if (!template) {
          template = await Template.findOne({
            name: { $regex: new RegExp(args.templateName, "i") },
            $or: [{ workspaceId }, { isStarter: true }],
          });
        }
      }

      if (!template) {
        return { success: false, message: `Template "${args.templateName || args.templateId}" not found.` };
      }

      // If it's a starter template, clone it as a workspace template so we preserve the starter
      let targetTemplate = template;
      let wasClonedFromStarter = false;

      if (template.isStarter) {
        const cloned = await Template.create({
          name: args.newName || `${template.name} (Custom)`,
          backgroundType: template.backgroundType,
          backgroundUrl: template.backgroundUrl,
          width: template.width,
          height: template.height,
          textLayers: template.textLayers.map(l => ({ ...l.toObject(), _id: undefined })),
          qrCode: template.qrCode ? { ...template.qrCode.toObject() } : undefined,
          isStarter: false,
          workspaceId,
        });
        targetTemplate = cloned;
        wasClonedFromStarter = true;
      }

      const modifications = [];

      // Update name
      if (args.newName && !wasClonedFromStarter) {
        targetTemplate.name = args.newName;
        modifications.push(`Renamed template to "${args.newName}"`);
      }

      // Update dimensions
      if (args.width) {
        targetTemplate.width = args.width;
        modifications.push(`Set width to ${args.width}px`);
      }
      if (args.height) {
        targetTemplate.height = args.height;
        modifications.push(`Set height to ${args.height}px`);
      }

      // Modify existing layers
      if (Array.isArray(args.modifyLayers) && args.modifyLayers.length > 0) {
        for (const mod of args.modifyLayers) {
          const targetKey = (mod.variableOrLabel || "").toLowerCase();
          const layer = targetTemplate.textLayers.find(
            l => (l.variable || "").toLowerCase() === targetKey || (l.label || "").toLowerCase() === targetKey
          );

          if (layer) {
            if (mod.fontSize !== undefined) {
              layer.fontSize = mod.fontSize;
              modifications.push(`Updated ${layer.label || layer.variable} font size to ${mod.fontSize}px`);
            }
            if (mod.fontFamily) {
              layer.fontFamily = mod.fontFamily;
              modifications.push(`Updated ${layer.label || layer.variable} font to "${mod.fontFamily}"`);
            }
            if (mod.fontWeight) {
              layer.fontWeight = mod.fontWeight;
              modifications.push(`Updated ${layer.label || layer.variable} weight to ${mod.fontWeight}`);
            }
            if (mod.color) {
              layer.color = mod.color;
              modifications.push(`Updated ${layer.label || layer.variable} color to \`${mod.color}\``);
            }
            if (mod.textAlign) {
              layer.textAlign = mod.textAlign;
              modifications.push(`Updated ${layer.label || layer.variable} alignment to ${mod.textAlign}`);
            }
            if (mod.x !== undefined) {
              layer.x = mod.x;
              modifications.push(`Updated ${layer.label || layer.variable} X position to ${mod.x}`);
            }
            if (mod.y !== undefined) {
              layer.y = mod.y;
              modifications.push(`Updated ${layer.label || layer.variable} Y position to ${mod.y}`);
            }
            if (mod.customText !== undefined) {
              layer.customText = mod.customText;
              modifications.push(`Updated ${layer.label || layer.variable} text to "${mod.customText}"`);
            }
          }
        }
      }

      // Add new layers
      if (Array.isArray(args.addLayers) && args.addLayers.length > 0) {
        for (const add of args.addLayers) {
          targetTemplate.textLayers.push({
            variable: add.variable || "custom",
            label: add.label || "Custom Text",
            x: add.x,
            y: add.y,
            fontSize: add.fontSize || 24,
            fontFamily: add.fontFamily || "Inter",
            fontWeight: add.fontWeight || "normal",
            color: add.color || "#000000",
            textAlign: add.textAlign || "center",
            maxWidth: null,
            customText: add.customText || null,
          });
          modifications.push(`Added new layer "${add.label}" (${add.variable}) at (${add.x}, ${add.y})`);
        }
      }

      // Remove layers
      if (Array.isArray(args.removeLayers) && args.removeLayers.length > 0) {
        const removeKeys = args.removeLayers.map(k => String(k).toLowerCase());
        const originalCount = targetTemplate.textLayers.length;
        targetTemplate.textLayers = targetTemplate.textLayers.filter(
          l => !removeKeys.includes((l.variable || "").toLowerCase()) && !removeKeys.includes((l.label || "").toLowerCase())
        );
        const removedCount = originalCount - targetTemplate.textLayers.length;
        if (removedCount > 0) {
          modifications.push(`Removed ${removedCount} text layer(s)`);
        }
      }

      // Update QR code
      if (args.qrCode) {
        targetTemplate.qrCode = {
          enabled: args.qrCode.enabled !== undefined ? args.qrCode.enabled : (targetTemplate.qrCode?.enabled ?? true),
          x: args.qrCode.x !== undefined ? args.qrCode.x : (targetTemplate.qrCode?.x ?? 880),
          y: args.qrCode.y !== undefined ? args.qrCode.y : (targetTemplate.qrCode?.y ?? 580),
          size: args.qrCode.size !== undefined ? args.qrCode.size : (targetTemplate.qrCode?.size ?? 120),
        };
        modifications.push(`Updated QR code configuration`);
      }

      await targetTemplate.save();

      return {
        success: true,
        templateName: targetTemplate.name,
        templateId: targetTemplate._id.toString(),
        wasClonedFromStarter,
        modifications,
        message: wasClonedFromStarter
          ? `Created customized copy **"${targetTemplate.name}"** from starter template with ${modifications.length} modifications.`
          : `Successfully updated **"${targetTemplate.name}"** with ${modifications.length} modifications.`,
        layers: targetTemplate.textLayers.map(l => ({
          variable: l.variable,
          label: l.label,
          fontSize: l.fontSize,
          fontFamily: l.fontFamily,
          color: l.color,
          position: `(${l.x}, ${l.y})`,
        })),
      };
    }

    case "duplicate_template": {
      let source = await Template.findOne({
        name: { $regex: new RegExp(`^${args.sourceTemplateName}$`, "i") },
        $or: [{ workspaceId }, { isStarter: true }],
      });
      if (!source) {
        source = await Template.findOne({
          name: { $regex: new RegExp(args.sourceTemplateName, "i") },
          $or: [{ workspaceId }, { isStarter: true }],
        });
      }

      if (!source) {
        return { success: false, message: `Source template "${args.sourceTemplateName}" not found.` };
      }

      const cloned = await Template.create({
        name: args.newTemplateName,
        backgroundType: source.backgroundType,
        backgroundUrl: source.backgroundUrl,
        width: source.width || 1056,
        height: source.height || 746,
        textLayers: (source.textLayers || []).map(l => ({
          variable: l.variable,
          label: l.label,
          x: l.x,
          y: l.y,
          fontSize: l.fontSize,
          fontFamily: l.fontFamily,
          fontWeight: l.fontWeight,
          color: l.color,
          textAlign: l.textAlign,
          maxWidth: l.maxWidth,
          customText: l.customText,
        })),
        qrCode: source.qrCode ? { ...source.qrCode.toObject() } : { enabled: true, x: 880, y: 580, size: 120 },
        isStarter: false,
        workspaceId,
      });

      return {
        success: true,
        templateId: cloned._id.toString(),
        templateName: cloned.name,
        sourceTemplate: source.name,
        layerCount: cloned.textLayers.length,
        message: `Created duplicate template **"${cloned.name}"** cloned from "${source.name}". Ready for customization.`,
      };
    }

    case "get_certificate_details": {
      let cert;
      if (args.verificationCode) {
        cert = await Certificate.findOne({ verificationCode: args.verificationCode, workspaceId })
          .populate("userId").populate("eventId");
      } else if (args.recipientName) {
        const users = await User.find({ name: { $regex: new RegExp(args.recipientName, "i") } }).lean();
        if (users.length > 0) {
          cert = await Certificate.findOne({ userId: { $in: users.map(u => u._id) }, workspaceId })
            .populate("userId").populate("eventId");
        }
      }
      if (!cert) return { found: false, message: "Certificate not found" };
      return {
        found: true,
        certificate: {
          id: cert._id.toString(),
          recipientName: cert.userId?.name || "Unknown",
          recipientEmail: cert.userId?.email || "Unknown",
          eventName: cert.eventId?.name || "Unknown",
          verificationCode: cert.verificationCode,
          status: cert.status,
          pdfUrl: cert.pdfUrl,
          issuedAt: cert.createdAt?.toISOString(),
          expiresAt: cert.expiresAt?.toISOString() || null,
          revokedAt: cert.revokedAt?.toISOString() || null,
          revocationReason: cert.revocationReason || null,
        },
      };
    }

    case "create_certificate": {
      return {
        action: "create_certificate",
        requiresConfirmation: true,
        preview: {
          recipientName: args.recipientName,
          recipientEmail: args.recipientEmail,
          eventName: args.eventName,
        },
        message: `Ready to create a certificate for **${args.recipientName}** (${args.recipientEmail}) for event "${args.eventName}". Please confirm.`,
      };
    }

    case "send_certificate_email": {
      const event = await Event.findOne({
        name: { $regex: new RegExp(args.eventName, "i") },
        workspaceId,
      });
      if (!event) {
        return { success: false, message: `Event "${args.eventName}" not found.` };
      }

      const filter = { eventId: event._id, status: "generated", workspaceId };
      if (args.recipientEmail) {
        const user = await User.findOne({ email: args.recipientEmail.toLowerCase() });
        if (!user) return { success: false, message: `Recipient with email "${args.recipientEmail}" not found.` };
        filter.userId = user._id;
      }

      const certs = await Certificate.find(filter).populate("userId");
      if (certs.length === 0) {
        return { success: false, message: "No generated certificates found to email." };
      }

      return {
        action: "send_email",
        requiresConfirmation: true,
        count: certs.length,
        eventName: event.name,
        message: `Ready to send **${certs.length}** certificate email(s) for event "${event.name}". Please confirm.`,
      };
    }

    case "revoke_certificate": {
      let cert;
      if (args.verificationCode) {
        cert = await Certificate.findOne({ verificationCode: args.verificationCode, workspaceId })
          .populate("userId").populate("eventId");
      } else if (args.recipientName) {
        const users = await User.find({ name: { $regex: new RegExp(args.recipientName, "i") } }).lean();
        if (users.length > 0) {
          cert = await Certificate.findOne({
            userId: { $in: users.map(u => u._id) },
            workspaceId,
            status: { $nin: ["revoked"] },
          }).populate("userId").populate("eventId");
        }
      }
      if (!cert) return { success: false, message: "Certificate not found or already revoked." };

      return {
        action: "revoke_certificate",
        requiresConfirmation: true,
        certificate: {
          recipientName: cert.userId?.name,
          verificationCode: cert.verificationCode,
          eventName: cert.eventId?.name,
        },
        reason: args.reason,
        message: `⚠️ Ready to **revoke** certificate \`${cert.verificationCode}\` for **${cert.userId?.name}** (${cert.eventId?.name}). Reason: "${args.reason}". This action is destructive. Please confirm.`,
      };
    }

    case "regenerate_certificate": {
      let cert;
      if (args.verificationCode) {
        cert = await Certificate.findOne({ verificationCode: args.verificationCode, workspaceId })
          .populate("userId").populate("eventId");
      } else if (args.recipientName) {
        const users = await User.find({ name: { $regex: new RegExp(args.recipientName, "i") } }).lean();
        if (users.length > 0) {
          cert = await Certificate.findOne({
            userId: { $in: users.map(u => u._id) },
            workspaceId,
            status: "failed",
          }).populate("userId").populate("eventId");
        }
      }
      if (!cert) return { success: false, message: "No failed certificate found to regenerate." };

      cert.status = "pending";
      cert.pdfUrl = null;
      await cert.save();

      return {
        success: true,
        message: `Certificate \`${cert.verificationCode}\` for **${cert.userId?.name}** has been queued for regeneration.`,
        certificate: {
          verificationCode: cert.verificationCode,
          recipientName: cert.userId?.name,
          status: "pending",
        },
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/* ═══════════════════════════════════════════════
   Audit Logging
   ═══════════════════════════════════════════════ */
const AI_TOOL_TO_AUDIT_ACTION = {
  create_certificate: "certificate_issued",
  revoke_certificate: "certificate_revoked",
  regenerate_certificate: "certificate_issued",
  send_certificate_email: "event_updated",
  edit_template: "template_updated",
  duplicate_template: "template_created",
};

async function logAIAction(workspaceId, userId, toolName, args, result) {
  try {
    const action = AI_TOOL_TO_AUDIT_ACTION[toolName];
    if (!action) return;

    await AuditLog.create({
      workspaceId,
      actorName: "Proofsy AI",
      actorEmail: "ai@proofsy",
      action,
      description: `AI tool: ${toolName} — ${result.message || result.action || "executed"}`,
      metadata: {
        aiTool: toolName,
        args: sanitizeArgs(args),
        resultSummary: typeof result === "object" ? (result.message || result.action || "executed") : String(result),
        source: "ai-operator",
      },
    });
  } catch (err) {
    console.error("[AIService] Audit log error:", err.message);
  }
}

function sanitizeArgs(args) {
  const safe = { ...args };
  delete safe.password;
  delete safe.token;
  return safe;
}

/* ═══════════════════════════════════════════════
   Response Cleaning & Fetch with Backoff
   ═══════════════════════════════════════════════ */
function cleanResponse(text) {
  if (!text) return "";
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "")
    .replace(/<function=[^>]*>[\s\S]*?<\/function>/gi, "")
    .replace(/<function_call>[\s\S]*?<\/function_call>/gi, "")
    .trim();
}

function parseInlineToolCalls(content) {
  if (!content) return [];
  const calls = [];
  const regex = /<tool_call>[\s\S]*?<function=([a-zA-Z0-9_]+)>([\s\S]*?)<\/function>[\s\S]*?<\/tool_call>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const funcName = match[1];
    const paramBlock = match[2];
    const args = {};
    const paramRegex = /<parameter=([a-zA-Z0-9_]+)>([\s\S]*?)<\/parameter>/gi;
    let pMatch;
    while ((pMatch = paramRegex.exec(paramBlock)) !== null) {
      const val = pMatch[2].trim();
      args[pMatch[1]] = isNaN(Number(val)) ? val : Number(val);
    }
    calls.push({
      id: `call_${Date.now()}_${calls.length}`,
      function: {
        name: funcName,
        arguments: JSON.stringify(args),
      },
    });
  }
  return calls;
}

function synthesizeToolSummary(toolExecutions) {
  if (!toolExecutions || toolExecutions.length === 0) return "Action completed successfully.";
  const summaries = toolExecutions.map(te => {
    const res = te.result;
    if (te.tool === "search_certificates") {
      if (!res.certificates || res.certificates.length === 0) {
        return "I searched the certificates ledger and found no matching certificates.";
      }
      const list = res.certificates
        .slice(0, 5)
        .map(c => `• **${c.recipientName}** (\`${c.verificationCode}\`) — Event: *${c.eventName}* | Status: **${c.status.toUpperCase()}**`)
        .join("\n");
      return `Found **${res.count}** certificate(s):\n\n${list}${res.count > 5 ? `\n\n*...and ${res.count - 5} more.*` : ""}`;
    }
    if (te.tool === "get_certificate_stats") {
      return `**Certificate Ledger Overview**:\n• Total: **${res.total}**\n• Generated: **${res.generated}**\n• Pending: **${res.pending}**\n• Failed: **${res.failed}**\n• Revoked: **${res.revoked}**`;
    }
    if (te.tool === "list_events") {
      const list = (res.events || []).map(e => `• **${e.name}** (${e.certificateCount} total certificates)`).join("\n");
      return `Found **${res.count}** event(s):\n\n${list}`;
    }
    if (te.tool === "list_templates") {
      const list = (res.templates || []).map(t => `• **${t.name}** (${t.dimensions})`).join("\n");
      return `Found **${res.count}** template(s):\n\n${list}`;
    }
    return res.message || `Executed **${te.tool}** successfully.`;
  });
  return summaries.join("\n\n");
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < maxRetries) {
      console.warn(`[AIService] Rate limit 429 hit (attempt ${attempt}/${maxRetries}), waiting 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

/* ═══════════════════════════════════════════════
   Chat Function (OpenAI-compatible API)
   ═══════════════════════════════════════════════ */
async function chat(messages, workspaceId, userId) {
  const provider = getProvider();

  const fullMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const response = await fetchWithRetry(provider.url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages: fullMessages,
      tools: PROOFSY_TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error(`[AIService] ${provider.name} API error:`, response.status, errBody);
    throw new Error(`${provider.name} API error: ${response.status}`);
  }

  const data = await response.json();
  let assistantMessage = data.choices?.[0]?.message;

  if (!assistantMessage) {
    throw new Error("No response from AI model");
  }

  let toolCalls = assistantMessage.tool_calls;
  if (!toolCalls || toolCalls.length === 0) {
    toolCalls = parseInlineToolCalls(assistantMessage.content);
  }

  if (toolCalls && toolCalls.length > 0) {
    const toolResults = [];
    const toolExecutions = [];

    for (const toolCall of toolCalls) {
      const funcName = toolCall.function.name;
      let funcArgs = {};
      try {
        funcArgs = JSON.parse(toolCall.function.arguments || "{}");
      } catch { /* empty args */ }

      console.log(`[AIService] Executing tool: ${funcName}`, funcArgs);
      const result = await executeTool(funcName, funcArgs, workspaceId);
      
      if (["create_certificate", "send_certificate_email", "revoke_certificate", "regenerate_certificate", "edit_template", "duplicate_template"].includes(funcName)) {
        await logAIAction(workspaceId, userId, funcName, funcArgs, result);
      }

      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });

      toolExecutions.push({
        tool: funcName,
        args: funcArgs,
        result,
      });
    }

    const followUp = await fetchWithRetry(provider.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          ...fullMessages,
          { role: "assistant", content: cleanResponse(assistantMessage.content) || null, tool_calls: assistantMessage.tool_calls },
          ...toolResults,
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!followUp.ok) {
      const errBody = await followUp.text();
      console.warn(`[AIService] Follow-up error (${followUp.status}):`, errBody);
      return {
        content: synthesizeToolSummary(toolExecutions),
        toolExecutions,
      };
    }

    const followUpData = await followUp.json();
    const followUpMessage = followUpData.choices?.[0]?.message;
    const finalContent = cleanResponse(followUpMessage?.content);

    return {
      content: finalContent || synthesizeToolSummary(toolExecutions),
      toolExecutions,
    };
  }

  return {
    content: cleanResponse(assistantMessage.content) || "I'm not sure how to help with that.",
    toolExecutions: [],
  };
}

module.exports = { chat, executeTool, getProvider };
