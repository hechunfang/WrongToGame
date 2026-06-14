import mysql from "mysql2/promise";
import OSS from "ali-oss";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// 1. LAZY-INITIALIZED MYSQL CONNECTION POOL
// ==========================================
let mysqlPool: mysql.Pool | null = null;
let isDbHealthy = false;
let connectionPromise: Promise<mysql.Pool | null> | null = null;
let lastDbError: string | null = null;

export function getDbStatus() {
  return {
    healthy: isDbHealthy && mysqlPool !== null,
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DATABASE,
    lastError: lastDbError
  };
}

export async function getMySQLPool(): Promise<mysql.Pool | null> {
  if (isDbHealthy && mysqlPool) {
    return mysqlPool;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const host = process.env.MYSQL_HOST;
  const port = parseInt(process.env.MYSQL_PORT || "3306");
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || !database) {
    console.warn(
      "⚠️ [MySQL Config] MySQL credentials not fully configured in environment variables. Database features will fallback to memory simulation."
    );
    lastDbError = "Host, User or Database missing from .env variables";
    return null;
  }

  connectionPromise = (async () => {
    try {
      console.log(`🔌 [MySQL] Connecting to database '${database}' on ${host}:${port}...`);
      const pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000, // Explicitly cap connection attempts at 5 seconds to prevent hanging
      });

      // Test connection with a promise race to fail fast under slow connection or firewall blockage
      const connectAttempt = pool.getConnection();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection verification timed out (5000ms)")), 5000)
      );

      const connection = await Promise.race([connectAttempt, timeoutPromise]);
      console.log("✅ [MySQL] Database connection verified successfully.");
      connection.release();
      isDbHealthy = true;
      mysqlPool = pool;
      lastDbError = null;
      return pool;
    } catch (error: any) {
      console.error("❌ [MySQL] Database connection failed:", error.message);
      console.warn("⚠️ [MySQL] Backend will temporarily operate in offline Simulation Mode.");
      isDbHealthy = false;
      mysqlPool = null;
      connectionPromise = null; // Allow a future call to retry connecting
      lastDbError = error.message;
      return null;
    }
  })();

  return connectionPromise;
}

// ==========================================
// 2. AUTOMATIC DATABASE SCHEMA BOOTSTRAPPING
// ==========================================
export async function bootstrapDatabaseSchema(): Promise<boolean> {
  const pool = await getMySQLPool();
  if (!pool) return false;

  try {
    console.log("⚙️ [MySQL] Bootstrapping database schemas...");

    // Create Table: users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(50) NOT NULL UNIQUE,
        nickname VARCHAR(100) NULL,
        is_vip TINYINT DEFAULT 0,
        vip_expire_time DATETIME NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Upgrade existing users table with nickname column safely
    try {
      await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) NULL AFTER phone;");
    } catch (alterErr: any) {
      try {
        await pool.query("ALTER TABLE users ADD COLUMN nickname VARCHAR(100) NULL AFTER phone;");
      } catch (e: any) {
        // Suppress if already exists or not supported
      }
    }

    // Create Table: wrong_questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wrong_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject VARCHAR(50) NOT NULL,
        raw_image_url VARCHAR(255) NOT NULL,
        wrong_word VARCHAR(100) NULL,
        ai_analysis TEXT NOT NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create Table: english_scenes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS english_scenes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        keyword VARCHAR(100) NOT NULL UNIQUE,
        scene_image_url VARCHAR(255) NOT NULL,
        english_sentence VARCHAR(255) NOT NULL,
        chinese_meaning VARCHAR(255) NOT NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create Table: pdf_reports
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pdf_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        report_name VARCHAR(150) NOT NULL,
        oss_url VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create Table: promotional_codes for distributors/promoters
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promotional_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        promoter_name VARCHAR(100) NOT NULL,
        vip_days INT DEFAULT 30,
        max_uses INT DEFAULT 9999,
        current_uses INT DEFAULT 0,
        passcode VARCHAR(50) NOT NULL DEFAULT '123456',
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Upgrade existing promotional_codes table with passcode column safely
    try {
      await pool.query("ALTER TABLE promotional_codes ADD COLUMN IF NOT EXISTS passcode VARCHAR(50) NOT NULL DEFAULT '123456';");
    } catch (alterErr: any) {
      try {
        await pool.query("ALTER TABLE promotional_codes ADD COLUMN passcode VARCHAR(50) NOT NULL DEFAULT '123456';");
      } catch (e: any) {
        // Suppress if already exists or not supported
      }
    }

    // Create Table: activation_logs for auditing promoter performance ("哪些是他的客户")
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_phone VARCHAR(50) NOT NULL,
        code VARCHAR(50) NOT NULL,
        promoter_name VARCHAR(100) NOT NULL,
        vip_days INT NOT NULL,
        use_time DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Pre-insert default codes to make it immediately operational and testable
    try {
      await pool.query("INSERT IGNORE INTO promotional_codes (code, promoter_name, vip_days, max_uses, passcode) VALUES ('VIP666', '林老师', 30, 100, '666666'), ('VIP888', '陈老板', 90, 50, '888888'), ('KAIXUAN99', '叶经理', 365, 200, '123456');");
    } catch (dbInitErr: any) {
      // Suppress on duplicate / error
    }

    console.log("🎉 [MySQL] All database schemas are successfully verified/bootstrapped.");
    return true;
  } catch (error: any) {
    console.error("❌ [MySQL] Schema bootstrapping failed:", error.message);
    return false;
  }
}

// ==========================================
// 3. LAZY-INITIALIZED ALICLOUD OSS CLIENT
// ==========================================
let ossClient: any = null;

export function getOSSClient(): any {
  if (ossClient) {
    return ossClient;
  }

  const region = process.env.OSS_REGION || "oss-cn-hongkong";
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.OSS_BUCKET;
  const endpoint = process.env.OSS_ENDPOINT || "oss-cn-hongkong.aliyuncs.com";

  if (!accessKeyId || !accessKeySecret || !bucket) {
    console.warn(
      "⚠️ [OSS Config] Alibaba Cloud OSS AccessKey ID, AccessKey Secret or Bucket is missing in environment variables. Image uploads will fallback to simulated URLs."
    );
    return null;
  }

  try {
    // Configure client. We pass the region, access credentials, and bucket.
    // If running in Hong Kong ECS, the endpoint should be 'oss-cn-hongkong-internal.aliyuncs.com' as per rules
    const options: any = {
      region,
      accessKeyId,
      accessKeySecret,
      bucket,
      endpoint,
      timeout: "60s"
    };

    // If using signature-based internal routing, ali-oss automatically handles custom endpoint configurations
    ossClient = new (OSS as any)(options);
    console.log(`✅ [OSS] Initialized AliCloud OSS client bound to bucket: '${bucket}'`);
    return ossClient;
  } catch (err: any) {
    console.error("❌ [OSS] Client initialization failed:", err.message);
    return null;
  }
}

// Helper to convert base64 to Buffer for OSS upload
function decodeBase64Image(dataString: string): { type: string; data: Buffer } {
  const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    // If not standard base64 data-url but just base64 data
    return {
      type: "image/jpeg",
      data: Buffer.from(dataString, "base64")
    };
  }

  return {
    type: matches[1],
    data: Buffer.from(matches[2], "base64")
  };
}

/**
 * Uploads a base64 encoded image to Aliyun OSS.
 * @param base64Str Base64 representation of the image. Might contain 'data:image/...;base64,' prefix.
 * @param destinationPath The path in OSS bucket, e.g., 'wrong-questions/users/1/upload-1700000000.jpg'
 * @returns The public resource URL on AliCloud OSS.
 */
export async function uploadBase64ToOSS(base64Str: string, destinationPath: string): Promise<string> {
  const client = getOSSClient();
  
  if (!client) {
    // Graceful offline fallback
    console.log(`✨ [OSS SimulationMode] Uploading Base64 image to mock store: ${destinationPath}`);
    // Return a beautiful mock placeholder that mimics standard AliCloud format
    const bucket = process.env.OSS_BUCKET || "wrong-questions-bucket";
    const region = process.env.OSS_REGION || "oss-cn-hongkong";
    return `https://${bucket}.${region}.aliyuncs.com/${destinationPath}`;
  }

  try {
    const { type, data } = decodeBase64Image(base64Str);
    
    // Put buffer to AliCloud OSS
    console.log(`🚀 [OSS] Uploading buffer/image to ${destinationPath} (${type})...`);
    const result = await client.put(destinationPath, data, {
      mime: type,
      headers: {
        "x-oss-object-acl": "public-read" // Ensure public accessibility for the child's interactive view
      }
    });

    console.log("✅ [OSS] Upload completed successfully path =", result.name);
    // Prefer public accessible URL or generated URL
    return result.url || `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION || "oss-cn-hongkong"}.aliyuncs.com/${destinationPath}`;
  } catch (error: any) {
    console.error("❌ [OSS] Upload failed:", error.message);
    throw new Error(`Aliyun OSS upload failed: ${error.message}`);
  }
}

/**
 * Uploads a text or binary Buffer (like generated PDF files) to Aliyun OSS.
 * @param buffer Raw data buffer
 * @param destinationPath Destination path in the OSS bucket
 * @param mimeType Optional MIME type
 */
export async function uploadBufferToOSS(
  buffer: Buffer,
  destinationPath: string,
  mimeType: string = "application/pdf"
): Promise<string> {
  const client = getOSSClient();

  if (!client) {
    console.log(`✨ [OSS SimulationMode] Uploading Document buffer to mock store: ${destinationPath}`);
    const bucket = process.env.OSS_BUCKET || "wrong-questions-bucket";
    const region = process.env.OSS_REGION || "oss-cn-hongkong";
    return `https://${bucket}.${region}.aliyuncs.com/${destinationPath}`;
  }

  try {
    console.log(`🚀 [OSS] Uploading document buffer to ${destinationPath} (${mimeType})...`);
    const result = await client.put(destinationPath, buffer, {
      mime: mimeType,
      headers: {
        "x-oss-object-acl": "public-read"
      }
    });

    console.log("✅ [OSS] Document completed successfully path =", result.name);
    return result.url || `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION || "oss-cn-hongkong"}.aliyuncs.com/${destinationPath}`;
  } catch (error: any) {
    console.error("❌ [OSS] Document upload failed:", error.message);
    throw new Error(`Aliyun OSS Document upload failed: ${error.message}`);
  }
}

// ==========================================
// 4. IN-MEMORY FALLBACK DATABASE FOR DEV MODES
// ==========================================
// If MySQL is not set up, we fallback gracefully to simple memory records so the preview flows nicely
export interface DBUser {
  id: number;
  phone: string;
  nickname: string | null;
  is_vip: number;
  vip_expire_time: string | null;
  create_time: string;
}

export interface DBWrongQuestion {
  id: number;
  user_id: number;
  subject: string;
  raw_image_url: string;
  wrong_word: string | null;
  ai_analysis: string;
  create_time: string;
}

export interface DBEnglishScene {
  id: number;
  keyword: string;
  scene_image_url: string;
  english_sentence: string;
  chinese_meaning: string;
  create_time: string;
}

export interface DBPdfReport {
  id: number;
  user_id: number;
  report_name: string;
  oss_url: string;
  status: string;
  create_time: string;
}

class InMemStore {
  users: DBUser[] = [
    { id: 1, phone: "13800138000", nickname: "小火伴家长", is_vip: 1, vip_expire_time: "2030-12-31 23:59:59", create_time: new Date().toISOString() }
  ];
  wrongQuestions: DBWrongQuestion[] = [];
  englishScenes: DBEnglishScene[] = [];
  pdfReports: DBPdfReport[] = [];
  promotionalCodes: any[] = [
    { id: 1, code: "VIP666", promoter_name: "林老师", vip_days: 30, max_uses: 100, current_uses: 2, passcode: "666666", create_time: new Date().toISOString() },
    { id: 2, code: "VIP888", promoter_name: "陈老板", vip_days: 90, max_uses: 50, current_uses: 1, passcode: "888888", create_time: new Date().toISOString() },
    { id: 3, code: "KAIXUAN99", promoter_name: "叶经理", vip_days: 365, max_uses: 200, current_uses: 5, passcode: "123456", create_time: new Date().toISOString() }
  ];
  activationLogs: any[] = [
    { id: 1, user_id: 1, user_phone: "13800138000", code: "VIP888", promoter_name: "陈老板", vip_days: 90, use_time: new Date(Date.now() - 3600000).toISOString() }
  ];
}

const memoryStore = new InMemStore();

// ==========================================
// 5. SECURE DATABASE & MODEL INTERACTION API
// ==========================================

/**
 * Ensures user exists by phone and returns them.
 */
export async function getOrCreateUser(phone: string, nickname?: string): Promise<DBUser> {
  const pool = await getMySQLPool();
  
  if (pool) {
    try {
      const [rows]: any = await pool.query("SELECT * FROM users WHERE phone = ?", [phone]);
      if (rows.length > 0) {
        const u = rows[0] as DBUser;
        // If a new nickname was provided, let's sync/update it in the DB
        if (nickname && nickname.trim() !== "" && u.nickname !== nickname) {
          await pool.query("UPDATE users SET nickname = ? WHERE id = ?", [nickname, u.id]);
          u.nickname = nickname;
        }
        return u;
      }
      
      // Newly created users start as NON-VIP (is_vip: 0) so they can test activation code,
      // EXCEPT the preset test number "13800138000" which gets VIP status automatically.
      const isTestNumber = phone === "13800138000";
      const isVipInitially = isTestNumber ? 1 : 0;
      let expireTime: Date | null = null;
      if (isTestNumber) {
        expireTime = new Date();
        expireTime.setFullYear(expireTime.getFullYear() + 5);
      }
      
      const finalNickname = nickname || `小火伴家长_${phone.slice(-4)}`;
      const [result]: any = await pool.query(
        "INSERT INTO users (phone, nickname, is_vip, vip_expire_time) VALUES (?, ?, ?, ?)",
        [phone, finalNickname, isVipInitially, expireTime]
      );
      
      const newId = result.insertId;
      const [rowsNew]: any = await pool.query("SELECT * FROM users WHERE id = ?", [newId]);
      return rowsNew[0] as DBUser;
    } catch (err: any) {
      console.error("Database query failed, using memory state fallback:", err.message);
    }
  }

  // Fallback to in-memory state
  let user = memoryStore.users.find(u => u.phone === phone);
  if (!user) {
    const isTestNumber = phone === "13800138000";
    user = {
      id: memoryStore.users.length + 1,
      phone,
      nickname: nickname || `小火伴家长_${phone.slice(-4)}`,
      is_vip: isTestNumber ? 1 : 0,
      vip_expire_time: isTestNumber ? new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000).toISOString() : null,
      create_time: new Date().toISOString()
    };
    memoryStore.users.push(user);
  } else if (nickname && nickname.trim() !== "" && user.nickname !== nickname) {
    user.nickname = nickname;
  }
  return user;
}

/**
 * Saves a wrong question to database with OSS image and Markdown analysis
 */
export async function saveWrongQuestion(
  userId: number,
  subject: string,
  rawImageUrl: string,
  wrongWord: string | null,
  aiAnalysisMarkdown: string
): Promise<number> {
  const pool = await getMySQLPool();

  if (pool) {
    try {
      const [result]: any = await pool.query(
        "INSERT INTO wrong_questions (user_id, subject, raw_image_url, wrong_word, ai_analysis) VALUES (?, ?, ?, ?, ?)",
        [userId, subject, rawImageUrl, wrongWord, aiAnalysisMarkdown]
      );
      return result.insertId;
    } catch (err: any) {
      console.error("Failed to insert wrong question into database:", err.message);
    }
  }

  // Memory fallback
  const newId = memoryStore.wrongQuestions.length + 1;
  memoryStore.wrongQuestions.push({
    id: newId,
    user_id: userId,
    subject,
    raw_image_url: rawImageUrl,
    wrong_word: wrongWord,
    ai_analysis: aiAnalysisMarkdown,
    create_time: new Date().toISOString()
  });
  return newId;
}

/**
 * Retrieves all wrong questions for a specific user.
 */
export async function getWrongQuestionsForUser(userId: number): Promise<DBWrongQuestion[]> {
  const pool = await getMySQLPool();

  if (pool) {
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM wrong_questions WHERE user_id = ? ORDER BY id DESC",
        [userId]
      );
      return rows as DBWrongQuestion[];
    } catch (err: any) {
      console.error("Failed to fetch wrong questions from database:", err.message);
    }
  }

  return memoryStore.wrongQuestions.filter(q => q.user_id === userId);
}

/**
 * Inserts or retrieves an English Scene record to map key visual words to beautiful OSS cards
 */
export async function saveOrCreateEnglishScene(
  keyword: string,
  sceneImageUrl: string,
  englishSentence: string,
  chineseMeaning: string
): Promise<DBEnglishScene> {
  const pool = await getMySQLPool();

  if (pool) {
    try {
      // Upsert pattern
      const [rows]: any = await pool.query("SELECT * FROM english_scenes WHERE keyword = ?", [keyword]);
      if (rows.length > 0) {
        return rows[0] as DBEnglishScene;
      }

      await pool.query(
        "INSERT INTO english_scenes (keyword, scene_image_url, english_sentence, chinese_meaning) VALUES (?, ?, ?, ?)",
        [keyword, sceneImageUrl, englishSentence, chineseMeaning]
      );

      const [rowsNew]: any = await pool.query("SELECT * FROM english_scenes WHERE keyword = ?", [keyword]);
      return rowsNew[0] as DBEnglishScene;
    } catch (err: any) {
      console.error("Failed to upsert english scene:", err.message);
    }
  }

  let scene = memoryStore.englishScenes.find(s => s.keyword === keyword);
  if (!scene) {
    scene = {
      id: memoryStore.englishScenes.length + 1,
      keyword,
      scene_image_url: sceneImageUrl,
      english_sentence: englishSentence,
      chinese_meaning: chineseMeaning,
      create_time: new Date().toISOString()
    };
    memoryStore.englishScenes.push(scene);
  }
  return scene;
}

/**
 * Save record of generated PDF report on OSS
 */
export async function savePdfReport(userId: number, reportName: string, ossUrl: string): Promise<number> {
  const pool = await getMySQLPool();

  if (pool) {
    try {
      const [result]: any = await pool.query(
        "INSERT INTO pdf_reports (user_id, report_name, oss_url, status) VALUES (?, ?, ?, ?)",
        [userId, reportName, ossUrl, "completed"]
      );
      return result.insertId;
    } catch (err: any) {
      console.error("Failed to insert pdf report:", err.message);
    }
  }

  const newId = memoryStore.pdfReports.length + 1;
  memoryStore.pdfReports.push({
    id: newId,
    user_id: userId,
    report_name: reportName,
    oss_url: ossUrl,
    status: "completed",
    create_time: new Date().toISOString()
  });
  return newId;
}

/**
 * Retrieves PDF report links for standard listing
 */
export async function getPdfReportsForUser(userId: number): Promise<DBPdfReport[]> {
  const pool = await getMySQLPool();

  if (pool) {
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM pdf_reports WHERE user_id = ? ORDER BY id DESC",
        [userId]
      );
      return rows as DBPdfReport[];
    } catch (err: any) {
      console.error("Failed to retrieve pdf reports:", err.message);
    }
  }

  return memoryStore.pdfReports.filter(r => r.user_id === userId);
}

// ==========================================
// 6. PROMOTIONAL CODES & DISTRIBUTED COMMISSION API
// ==========================================

export interface DBPromoCode {
  id: number;
  code: string;
  promoter_name: string;
  vip_days: number;
  max_uses: number;
  current_uses: number;
  create_time: string;
}

export interface DBActivationLog {
  id: number;
  user_id: number;
  user_phone: string;
  code: string;
  promoter_name: string;
  vip_days: number;
  use_time: string;
}

/**
 * Validates and redeems a promo code to extend/grant a user VIP status.
 * Increments uses in promotional_codes and adds a record to activation_logs.
 */
export async function usePromoCode(phone: string, codeStr: string): Promise<{ success: boolean; message: string; user?: DBUser }> {
  const normalizedCode = codeStr.trim().toUpperCase();
  const pool = await getMySQLPool();
  const user = await getOrCreateUser(phone);

  if (pool) {
    try {
      // Find the promotional code in DB
      const [codes]: any = await pool.query("SELECT * FROM promotional_codes WHERE UPPER(code) = UPPER(?)", [normalizedCode]);
      if (codes.length === 0) {
        return { success: false, message: "该激活码不存在，请检查或联系分享老师！" };
      }
      
      const pc = codes[0] as DBPromoCode;
      if (pc.current_uses >= pc.max_uses) {
        return { success: false, message: "激活码已被领完或超过使用次数限制！" };
      }

      // Check if user already used this exact code to prevent double activation
      const [existingLogs]: any = await pool.query(
        "SELECT * FROM activation_logs WHERE user_id = ? AND UPPER(code) = UPPER(?)",
        [user.id, normalizedCode]
      );
      if (existingLogs.length > 0) {
        return { success: false, message: "您已激活过此礼包码，无需重复输入！" };
      }

      // Calculate new premium expiration date
      let newExpireTime = new Date();
      if (user.is_vip && user.vip_expire_time) {
        const currentExpire = new Date(user.vip_expire_time);
        if (currentExpire > newExpireTime) {
          newExpireTime = currentExpire;
        }
      }
      newExpireTime.setDate(newExpireTime.getDate() + pc.vip_days);

      // Save database updates inside one flow
      await pool.query("UPDATE users SET is_vip = 1, vip_expire_time = ? WHERE id = ?", [newExpireTime, user.id]);
      await pool.query("UPDATE promotional_codes SET current_uses = current_uses + 1 WHERE id = ?", [pc.id]);
      await pool.query(
        "INSERT INTO activation_logs (user_id, user_phone, code, promoter_name, vip_days) VALUES (?, ?, ?, ?, ?)",
        [user.id, user.phone, normalizedCode, pc.promoter_name, pc.vip_days]
      );

      // Retrieve updated user details
      const [updatedUserRows]: any = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
      console.log(`✅ [PROMO] User ${user.phone} unlocked ${pc.vip_days} days VIP via code '${normalizedCode}' by promoter '${pc.promoter_name}'`);
      return { success: true, message: `激活成功！获得【${pc.vip_days}天】尊享特权版，由 ${pc.promoter_name} 赞助提供。`, user: updatedUserRows[0] as DBUser };
    } catch (err: any) {
      console.error("❌ Failed to redeem activation code:", err.message);
      return { success: false, message: "数据库操作异常，请稍后再试！" };
    }
  }

  // Fallback state simulation
  const pc = memoryStore.promotionalCodes.find(c => c.code.toUpperCase() === normalizedCode);
  if (!pc) {
    return { success: false, message: "激活码不存在！演示环境下只支持: VIP666, VIP888, KAIXUAN99" };
  }
  if (pc.current_uses >= pc.max_uses) {
    return { success: false, message: "该推广激活码使用次数已满" };
  }
  const existsLog = memoryStore.activationLogs.find(l => l.user_id === user.id && l.code.toUpperCase() === normalizedCode);
  if (existsLog) {
    return { success: false, message: "您已激活过此礼包，无需重复使用！" };
  }

  let newExpireTime = new Date();
  if (user.is_vip && user.vip_expire_time) {
    const currentExpire = new Date(user.vip_expire_time);
    if (currentExpire > newExpireTime) {
      newExpireTime = currentExpire;
    }
  }
  newExpireTime.setDate(newExpireTime.getDate() + pc.vip_days);

  user.is_vip = 1;
  user.vip_expire_time = newExpireTime.toISOString();
  pc.current_uses += 1;
  
  memoryStore.activationLogs.push({
    id: memoryStore.activationLogs.length + 1,
    user_id: user.id,
    user_phone: user.phone,
    code: normalizedCode,
    promoter_name: pc.promoter_name,
    vip_days: pc.vip_days,
    use_time: new Date().toISOString()
  });

  return { success: true, message: `【演示测试】激活成功！获得 ${pc.vip_days}天 赞助会员 (渠道: ${pc.promoter_name})`, user };
}

/**
 * Creates/registers a new promotion activation code for a friend/agent.
 */
export async function createPromoCode(codeStr: string, promoterName: string, vipDays: number, maxUses: number = 9999, passcode: string = "123456"): Promise<boolean> {
  const normalizedCode = codeStr.trim().toUpperCase();
  const pool = await getMySQLPool();
  if (pool) {
    try {
      await pool.query(
        "INSERT INTO promotional_codes (code, promoter_name, vip_days, max_uses, passcode, current_uses) VALUES (?, ?, ?, ?, ?, 0) ON DUPLICATE KEY UPDATE promoter_name = VALUES(promoter_name), vip_days = VALUES(vip_days), max_uses = VALUES(max_uses), passcode = VALUES(passcode)",
        [normalizedCode, promoterName || "普通推广员", vipDays, maxUses, passcode]
      );
      return true;
    } catch (err: any) {
      console.error("❌ Failed to insert promotion code:", err.message);
      return false;
    }
  }

  // Fallback memory state update
  const idx = memoryStore.promotionalCodes.findIndex(c => c.code.toUpperCase() === normalizedCode);
  if (idx !== -1) {
    memoryStore.promotionalCodes[idx] = {
      ...memoryStore.promotionalCodes[idx],
      promoter_name: promoterName,
      vip_days: vipDays,
      max_uses: maxUses,
      passcode: passcode
    };
  } else {
    memoryStore.promotionalCodes.push({
      id: memoryStore.promotionalCodes.length + 1,
      code: normalizedCode,
      promoter_name: promoterName,
      vip_days: vipDays,
      max_uses: maxUses,
      passcode: passcode,
      current_uses: 0,
      create_time: new Date().toISOString()
    });
  }
  return true;
}

/**
 * Returns promotional codes and corresponding customer activation logs to compute commissions and identify clients.
 */
export async function getPromoterStats(): Promise<{ codes: any[]; logs: any[] }> {
  const pool = await getMySQLPool();
  if (pool) {
    try {
      const [codes]: any = await pool.query("SELECT * FROM promotional_codes ORDER BY id DESC");
      const [logs]: any = await pool.query("SELECT * FROM activation_logs ORDER BY id DESC");
      return { codes, logs };
    } catch (err: any) {
      console.error("❌ Failed to read promoter statistics:", err.message);
    }
  }
  return {
    codes: memoryStore.promotionalCodes,
    logs: memoryStore.activationLogs
  };
}
