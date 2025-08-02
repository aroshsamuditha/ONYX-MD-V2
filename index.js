const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");

const l = console.log;
const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson,
} = require("./lib/functions");
const fs = require("fs");
const P = require("pino");
const config = require("./config");
const qrcode = require("qrcode-terminal");
const util = require("util");
const { sms, downloadMediaMessage } = require("./lib/msg");
const axios = require("axios");
const { File } = require("megajs");
const prefix = config.PREFIX;
(async () => {
  const { default: fetch } = await import('node-fetch');
  globalThis.fetch = fetch;
})();

const ownerNumber = config.OWNER_NUM;

//===================SESSION-AUTH============================
if (!fs.existsSync(__dirname + "/auth_info_baileys/creds.json")) {
  if (!config.SESSION_ID)
    return console.log("Please add your session to SESSION_ID env !!");
  
  console.log("Downloading session from Mega...");
  const sessdata = config.SESSION_ID;
  
  try {
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
    filer.download((err, data) => {
      if (err) {
        console.error("Failed to download session from Mega:", err.message);
        console.log("Please check your SESSION_ID or try generating a new session.");
        process.exit(1);
      }
      
      // Ensure the directory exists
      if (!fs.existsSync(__dirname + "/auth_info_baileys/")) {
        fs.mkdirSync(__dirname + "/auth_info_baileys/", { recursive: true });
      }
      
      fs.writeFile(__dirname + "/auth_info_baileys/creds.json", data, (writeErr) => {
        if (writeErr) {
          console.error("Failed to write session file:", writeErr.message);
          process.exit(1);
        }
        console.log("Session downloaded ✅");
        // Restart the connection process after session download
        setTimeout(() => {
          connectToWA();
        }, 2000);
      });
    });
  } catch (error) {
    console.error("Error setting up session download:", error.message);
    console.log("Please check your SESSION_ID or try generating a new session.");
    process.exit(1);
  }
}

const express = require("express");
const app = express();
const port = 8000;

//=============================================

const messageStore = {};

async function connectToWA() {
  let retryCount = 0;
  const maxRetries = 5;

  //===========================

  console.log("Connecting 🌀ONYX MD🔥BOT👾...");
  
  try {
    // Check if session file exists before proceeding
    if (!fs.existsSync(__dirname + "/auth_info_baileys/creds.json")) {
      console.log("Session file not found. Please ensure session is properly downloaded.");
      return;
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(
      __dirname + "/auth_info_baileys/"
    );
    var { version } = await fetchLatestBaileysVersion();

    const robin = makeWASocket({
      logger: P({ level: "silent" }),
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version,
      connectTimeoutMs: 60000, // 60 seconds timeout
      defaultQueryTimeoutMs: 30000, // 30 seconds for queries
      retryRequestDelayMs: 2000, // 2 seconds delay between retries
      keepAliveIntervalMs: 25000, // Keep connection alive
    });

      robin.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log("Connection status:", connection);
      
      // Handle QR code for new sessions
      if (qr) {
        console.log("\n📱 Scan this QR code with your WhatsApp:");
        qrcode.generate(qr, { small: true });
        console.log("\nWaiting for QR code scan...");
      }
      
      if (connection === "close") {
        console.log("Connection closed. Reason:", lastDisconnect?.error?.output?.statusCode || "Unknown");
        
        // Handle specific error codes
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode === 403) {
          console.log("❌ Session invalidated (403). You need to generate a new session.");
          console.log("💡 Run: npm run generate-session");
          return; // Don't retry for 403 errors
        }
        
        if (
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        ) {
          console.log("Connection closed, attempting to reconnect...");
          setTimeout(() => {
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Reconnection attempt ${retryCount}/${maxRetries}`);
              connectToWA();
            } else {
              console.log("Max retry attempts reached. Please check your connection.");
              console.log("Possible issues:");
              console.log("1. Check your internet connection");
              console.log("2. Verify your SESSION_ID is correct");
              console.log("3. Try generating a new session");
            }
          }, 10000); // Increased delay to 10 seconds
        } else {
          console.log("Bot was logged out. Please scan QR code again.");
        }
      } else if (connection === "open") {
      console.log(" Installing... ");
      const path = require("path");
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() == ".js") {
          require("./plugins/" + plugin);
        }
      });
      // Initialize anti-delete plugin
      const setupAntiDelete = require("./plugins/anti-delete.js");
      setupAntiDelete(robin);
      console.log("🌀ONYX MD🔥BOT👾 installed successful ✅");
      console.log("🌀ONYX MD🔥BOT👾 connected to whatsapp ✅");

      let up = `*🌀ONYX MD🔥BOT👾 connected successful ✅*\n\n𝙾𝚗𝚢𝚡 𝙼𝚍 𝚒𝚜 𝚊 𝚋𝚘𝚝 𝚝𝚑𝚊𝚝 𝚠𝚘𝚛𝚔𝚜 𝚘𝚗 𝚆𝚑𝚊𝚝𝚜𝚊𝚙𝚙 𝚌𝚛𝚎𝚊𝚝𝚎𝚍 𝚋𝚢 𝙰𝚛𝚘𝚜𝚑 𝚂𝚊𝚖𝚞𝚍𝚒𝚝𝚑𝚊! 𝚈𝚘𝚞 𝚌𝚊𝚗 𝚐𝚎𝚝 𝚖𝚊𝚗𝚢 𝚋𝚎𝚗𝚎𝚏𝚒𝚝𝚜 𝚏𝚛𝚘𝚖 𝚝𝚑𝚒𝚜 🤑\n\n*✅ Github repository = https://github.com/aroshsamuditha/ONYX-MD*\n*✅ Web Site =*\n*✅Youtube =*\n*✅ Tiktok Page = https://www.tiktok.com/@onyxstudio_byarosh?_t=ZS-8xQGlXXfj3o&_r=1*\n\n> By Arosh Samuditha`;
      let up1 = `*※ Hello Arosh, I made bot successful 🖤✅*`;

      robin.sendMessage(ownerNumber + "@s.whatsapp.net", {
        image: {
          url: `https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/oNYX%20bOT.jpg`,
        },
        caption: up,
      });
      robin.sendMessage("94761676948@s.whatsapp.net", {
        image: {
          url: `https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/oNYX%20bOT.jpg`,
        },
        caption: up1,
      });
    }
  });
  robin.ev.on("creds.update", saveCreds);
  robin.ev.on("messages.upsert", async (mek) => {
    mek = mek.messages[0];
    if (!mek.message) return;
    // Store the message by its key for anti-delete
    messageStore[mek.key.id] = mek;
    mek.message =
      getContentType(mek.message) === "ephemeralMessage"
        ? mek.message.ephemeralMessage.message
        : mek.message;
    
    //status auto read
    
if (
  mek.key &&
  mek.key.remoteJid === "status@broadcast" &&
  config.AUTO_READ_STATUS === "true"
) {
  await robin.readMessages([mek.key]);
}
      
    
    const m = sms(robin, mek);
    const type = getContentType(mek.message);
    const content = JSON.stringify(mek.message);
    const from = mek.key.remoteJid;
    const quoted =
      type == "extendedTextMessage" &&
      mek.message.extendedTextMessage.contextInfo != null
        ? mek.message.extendedTextMessage.contextInfo.quotedMessage || []
        : [];
    const body =
      type === "conversation"
        ? mek.message.conversation
        : type === "extendedTextMessage"
        ? mek.message.extendedTextMessage.text
        : type == "imageMessage" && mek.message.imageMessage.caption
        ? mek.message.imageMessage.caption
        : type == "videoMessage" && mek.message.videoMessage.caption
        ? mek.message.videoMessage.caption
        : "";
    const isCmd = body.startsWith(prefix);
    const command = isCmd
      ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase()
      : "";
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(" ");
    const isGroup = from.endsWith("@g.us");
    const sender = mek.key.fromMe
      ? robin.user.id.split(":")[0] + "@s.whatsapp.net" || robin.user.id
      : mek.key.participant || mek.key.remoteJid;
    const senderNumber = sender.split("@")[0];
    const botNumber = robin.user.id.split(":")[0];
    const pushname = mek.pushName || "Sin Nombre";
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const botNumber2 = await jidNormalizedUser(robin.user.id);
    const groupMetadata = isGroup
      ? await robin.groupMetadata(from).catch((e) => {
          console.log(`Failed to fetch group metadata for ${from}:`, e.message);
          return null;
        })
      : null;
    const groupName = isGroup && groupMetadata ? groupMetadata.subject : "";
    const participants = isGroup && groupMetadata ? groupMetadata.participants : [];
    const groupAdmins = isGroup && participants ? await getGroupAdmins(participants) : [];
    const botJidLid = botNumber + '@lid';
    const isBotAdmins = isGroup ? (groupAdmins.includes(botNumber2) || groupAdmins.includes(botJidLid)) : false;
    if (isGroup) {
      console.log('[DEBUG] Bot JID:', botNumber2);
      console.log('[DEBUG] Bot JID (lid):', botJidLid);
      console.log('[DEBUG] Group Admins:', groupAdmins);
      console.log('[DEBUG] isBotAdmins:', isBotAdmins);
      if (participants && Array.isArray(participants)) {
        console.log('[DEBUG] Group Participants:');
        participants.forEach(p => {
          const jid = p.id || p.jid || p;
          const isBot = jid === botNumber2 || jid === botJidLid;
          console.log(`  - ${jid}${isBot ? '  <== BOT' : ''}`);
        });
      }
    }
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
    const isReact = m.message.reactionMessage ? true : false;
    const reply = (teks) => {
      robin.sendMessage(from, { text: teks }, { quoted: mek }).catch((error) => {
        console.error("Error sending reply:", error.message);
        if (error.message.includes('rate-overlimit') || error.message.includes('429')) {
          console.log("Rate limited - message not sent");
        }
      });
    };

    // New user detection and auto channel/group joining
    if (!isGroup && !isCmd && body.trim()) {
      try {
        const fs = require('fs');
        const path = require('path');
        const newUsersPath = path.join(__dirname, 'data/newusers.json');
        
        // Load existing new users data with proper error handling
        let newUsers = {};
        if (fs.existsSync(newUsersPath)) {
          try {
            const fileContent = fs.readFileSync(newUsersPath, 'utf8');
            if (fileContent.trim()) {
              // Check for invalid characters and clean the content
              const cleanContent = fileContent.replace(/[^\x20-\x7E]/g, '');
              if (cleanContent.trim()) {
                newUsers = JSON.parse(cleanContent);
              }
            }
          } catch (parseError) {
            console.error("Error parsing newusers.json:", parseError.message);
            console.log("Creating fresh newusers.json file...");
            // If file is corrupted, recreate it
            try {
              fs.writeFileSync(newUsersPath, JSON.stringify({}, null, 2), 'utf8');
              console.log("Fresh newusers.json file created successfully");
            } catch (writeError) {
              console.error("Error creating fresh newusers.json:", writeError.message);
            }
            newUsers = {};
          }
        }
        
        // Check if this is a new user
        if (!newUsers[senderNumber]) {
          console.log(`New user detected: ${senderNumber}`);
          
          // Mark user as seen
          newUsers[senderNumber] = {
            firstMessage: new Date().toISOString(),
            name: pushname || "Unknown"
          };
          
          // Save updated new users data with error handling
          try {
            fs.writeFileSync(newUsersPath, JSON.stringify(newUsers, null, 2), 'utf8');
            console.log(`New user data saved for: ${senderNumber}`);
          } catch (saveError) {
            console.error("Error saving new user data:", saveError.message);
          }
          
          // Send welcome message with channel and group links
          const welcomeMsg = `🎉 *Welcome to 🌀ONYX MD🔥BOT!* 🎉

👋 *Hello ${pushname || "there"}!* 

Thank you for connecting with our bot! To stay updated and connect with our community, please:

📢 *Join our WhatsApp Channel:*
https://whatsapp.com/channel/0029VaARQM6G3R3bdsoX8U0s

👥 *Join our WhatsApp Group:*
https://chat.whatsapp.com/EakzHLdzYkn8dpflSMqYr1?mode=r_t

🔧 *Bot Commands:*
• .menu - Show all commands
• .alive - Check if bot is online
• .help - Get help

> *Made with ❤️ by Arosh Samuditha*`;

          // Send welcome message with rate limiting protection
          try {
            await robin.sendMessage(from, {
              text: welcomeMsg
            });
            console.log(`Welcome message sent to: ${senderNumber}`);
            
            // Add delay before sending follow-up to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const followUpMsg = `💡 *Quick Tips:*
• Use .menu to see all available commands
• The bot works in both inbox and groups
• Feel free to ask for help anytime!

🎯 *Don't forget to join our channel and group for updates!*`;
            
            await robin.sendMessage(from, {
              text: followUpMsg
            });
            console.log(`Follow-up message sent to: ${senderNumber}`);
          } catch (sendError) {
            console.error("Error sending welcome/follow-up message:", sendError.message);
            // If rate limited, just log it and continue
            if (sendError.message.includes('rate-overlimit') || sendError.message.includes('429')) {
              console.log("Rate limited - skipping follow-up message");
            }
          }
        }
      } catch (error) {
        console.error("New user detection error:", error.message);
      }
    }

    robin.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      try {
        let mime = "";
        let res = await axios.head(url, { 
          timeout: 45000, // Increased timeout for cloud environments
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          validateStatus: function (status) {
            return status >= 200 && status < 400; // Accept redirects
          }
        }); 
        mime = res.headers["content-type"];
        
        // Handle specific error cases
        if (res.status === 503) {
          throw new Error("Service temporarily unavailable (503)");
        }
        
        // Enhanced MIME type detection
        if (!mime) {
          // Try to detect MIME type from URL extension
          const urlLower = url.toLowerCase();
          if (urlLower.includes('.mp4') || urlLower.includes('.avi') || urlLower.includes('.mov')) {
            mime = 'video/mp4';
          } else if (urlLower.includes('.mp3') || urlLower.includes('.wav') || urlLower.includes('.m4a')) {
            mime = 'audio/mpeg';
          } else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png')) {
            mime = 'image/jpeg';
          } else if (urlLower.includes('.gif')) {
            mime = 'image/gif';
          } else if (urlLower.includes('.pdf')) {
            mime = 'application/pdf';
          }
        }
        
      if (mime && mime.split("/")[1] === "gif") {
        return robin.sendMessage(
          jid,
          {
            video: await getBuffer(url),
            caption: caption,
            gifPlayback: true,
            ...options,
          },
          { quoted: quoted, ...options }
        );
      }
      let type = mime.split("/")[0] + "Message";
      if (mime === "application/pdf") {
        return robin.sendMessage(
          jid,
          {
            document: await getBuffer(url),
            mimetype: "application/pdf",
            caption: caption,
            ...options,
          },
          { quoted: quoted, ...options }
        );
      }
      if (mime && mime.split("/")[0] === "image") {
        return robin.sendMessage(
          jid,
          { image: await getBuffer(url), caption: caption, ...options },
          { quoted: quoted, ...options }
        );
      }
      if (mime && mime.split("/")[0] === "video") {
        return robin.sendMessage(
          jid,
          {
            video: await getBuffer(url),
            caption: caption,
            mimetype: "video/mp4",
            ...options,
          },
          { quoted: quoted, ...options }
        );
      }
      if (mime && mime.split("/")[0] === "audio") {
        return robin.sendMessage(
          jid,
          {
            audio: await getBuffer(url),
            caption: caption,
            mimetype: "audio/mpeg",
            ...options,
          },
          { quoted: quoted, ...options }
        );
      }
      
      // Fallback: try to send as document if MIME type is unknown
      return robin.sendMessage(
        jid,
        {
          document: await getBuffer(url),
          mimetype: "application/octet-stream",
          caption: caption,
          ...options,
        },
        { quoted: quoted, ...options }
      );
      
    } catch (error) {
      console.error("sendFileUrl error:", error);
      
      // Provide more specific error handling
      if (error.response && error.response.status === 503) {
        throw error; // Re-throw 503 errors to be handled by the calling function
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        robin.sendMessage(jid, { 
          text: "❌ Network error: Unable to connect to the file server. Please check your internet connection." 
        }, { quoted: quoted });
      } else if (error.code === 'ETIMEDOUT') {
        robin.sendMessage(jid, { 
          text: "❌ Timeout: The request took too long. Please try again." 
        }, { quoted: quoted });
      } else if (error.message && error.message.includes('503')) {
        robin.sendMessage(jid, { 
          text: "❌ Service temporarily unavailable. Please try again later." 
        }, { quoted: quoted });
      } else {
        // Send generic error message to user
        robin.sendMessage(jid, { 
          text: "❌ Failed to send file. Please try again later." 
        }, { quoted: quoted });
      }
    }
  };
    // Owner react system - Integrated into index.js for better performance
    if (!isReact && !isCmd) { // Only react to non-reaction and non-command messages to avoid interference
      try {
        const fs = require('fs');
        const path = require('path');
        const ownerReactPath = path.join(__dirname, 'data/ownerreact.json');
        
        if (fs.existsSync(ownerReactPath)) {
          const ownerReactData = JSON.parse(fs.readFileSync(ownerReactPath, 'utf8'));
          
          // Check if sender is in owner list
          for (const owner in ownerReactData) {
            const cleanOwner = owner.replace('+', '');
            if (senderNumber === cleanOwner) {
              const emoji = ownerReactData[owner];
              console.log(`Owner react: ${senderNumber} -> ${emoji} in ${isGroup ? 'group' : 'inbox'}`);
              
              try {
                await robin.sendMessage(from, { 
                  react: { 
                    text: emoji, 
                    key: mek.key 
                  } 
                });
                console.log("✅ Owner reaction sent successfully");
              } catch (reactError) {
                console.error("❌ Failed to send owner reaction:", reactError.message);
              }
              break; // Exit after finding the owner
            }
          }
        } else {
          console.log("⚠️ Owner react data file not found at:", ownerReactPath);
        }
      } catch (error) {
        console.error("❌ Owner react error:", error.message);
      }
    }
    
    //work type
    if (!isOwner && config.MODE === "private") return;
    if (!isOwner && isGroup && config.MODE === "inbox") return;
    if (!isOwner && !isGroup && config.MODE === "groups") return;

    const events = require("./command");
    const cmdName = isCmd
      ? body.slice(1).trim().split(" ")[0].toLowerCase()
      : false;
    if (isCmd) {
      const cmd =
        events.commands.find((cmd) => cmd.pattern === cmdName) ||
        events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
      if (cmd) {
        if (cmd.react)
          robin.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

        try {
          cmd.function(robin, mek, m, {
            from,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isAdmins,
            reply,
          });
        } catch (e) {
          console.error("[PLUGIN ERROR] " + e);
        }
      }
    }
    events.commands.map(async (command) => {
      if (body && command.on === "body") {
        command.function(robin, mek, m, {
          from,
          l,
          quoted,
          body,
          isCmd,
          command,
          args,
          q,
          isGroup,
          sender,
          senderNumber,
          botNumber2,
          botNumber,
          pushname,
          isMe,
          isOwner,
          groupMetadata,
          groupName,
          participants,
          groupAdmins,
          isBotAdmins,
          isAdmins,
          reply,
        });
      } else if (mek.q && command.on === "text") {
        command.function(robin, mek, m, {
          from,
          l,
          quoted,
          body,
          isCmd,
          command,
          args,
          q,
          isGroup,
          sender,
          senderNumber,
          botNumber2,
          botNumber,
          pushname,
          isMe,
          isOwner,
          groupMetadata,
          groupName,
          participants,
          groupAdmins,
          isBotAdmins,
          isAdmins,
          reply,
        });
      } else if (
        (command.on === "image" || command.on === "photo") &&
        mek.type === "imageMessage"
      ) {
        command.function(robin, mek, m, {
          from,
          l,
          quoted,
          body,
          isCmd,
          command,
          args,
          q,
          isGroup,
          sender,
          senderNumber,
          botNumber2,
          botNumber,
          pushname,
          isMe,
          isOwner,
          groupMetadata,
          groupName,
          participants,
          groupAdmins,
          isBotAdmins,
          isAdmins,
          reply,
        });
      } else if (command.on === "sticker" && mek.type === "stickerMessage") {
        command.function(robin, mek, m, {
          from,
          l,
          quoted,
          body,
          isCmd,
          command,
          args,
          q,
          isGroup,
          sender,
          senderNumber,
          botNumber2,
          botNumber,
          pushname,
          isMe,
          isOwner,
          groupMetadata,
          groupName,
          participants,
          groupAdmins,
          isBotAdmins,
          isAdmins,
          reply,
        });
      }
    });
    //============================================================================
  });
  robin.ev.on("group-participants.update", async (update) => {
    try {
      // Welcome new members
      if (update.action === "add" && update.participants && update.participants.length > 0) {
        const groupId = update.id;
        const newMembers = update.participants;
        try {
          const welcome = require("./plugins/welcome.js");
          await welcome(robin, groupId, newMembers);
        } catch (e) {
          console.log("[WELCOME PLUGIN ERROR]", e);
        }
      }
      // Goodbye to members who left
      if (update.action === "remove" && update.participants && update.participants.length > 0) {
        const groupId = update.id;
        const leftMembers = update.participants;
        try {
          const goodbye = require("./plugins/goodbye.js");
          await goodbye(robin, groupId, leftMembers);
        } catch (e) {
          console.log("[GOODBYE PLUGIN ERROR]", e);
        }
      }
    } catch (err) {
      console.log("[GROUP PARTICIPANT UPDATE ERROR]", err);
    }
  });
  
  } catch (error) {
    console.error("Connection error:", error);
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Connection failed, retrying in 10 seconds... (${retryCount}/${maxRetries})`);
      setTimeout(() => {
        connectToWA();
      }, 10000);
    } else {
      console.log("Max connection attempts reached. Please check your internet connection and try again.");
    }
  }
}
// Health check endpoint for Railway
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "🌀ONYX MD🔥BOT👾 is running successfully!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "ONYX-MD-BOT",
    version: "2.0.0"
  });
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`🌐 Health check available at: http://localhost:${port}/health`);
});
// Only start connection if session file exists
if (fs.existsSync(__dirname + "/auth_info_baileys/creds.json")) {
  setTimeout(() => {
    connectToWA();
  }, 4000);
} else {
  console.log("Waiting for session download to complete...");
  // The connection will be started after session download completes
}

module.exports = { sms, downloadMediaMessage, messageStore };
