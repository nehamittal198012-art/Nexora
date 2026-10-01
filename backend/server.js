require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");

const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const { pipeline } = require("@huggingface/transformers");

const app = express();
const PORT = 5000;

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */

app.use(express.static(__dirname));

/* =========================
   MONGODB CONNECTION
========================= */

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully ✅");
    })
    .catch((error) => {
        console.error(
            "MongoDB connection error:",
            error.message
        );
    });

/* =========================
   USER MODEL
========================= */

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        college: {
            type: String,
            default: ""
        },

        branch: {
            type: String,
            default: ""
        },

        year: {
            type: String,
            default: ""
        },

        graduationYear: {
            type: String,
            default: ""
        },

        targetRole: {
            type: String,
            default: "Software Developer"
        },

        preparationType: {
            type: String,
            default: "Placement"
        },

        currentLevel: {
            type: String,
            default: "Beginner"
        },

        dailyGoal: {
            type: Number,
            default: 1
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model(
    "User",
    userSchema
);

/* =========================
   FILE UPLOAD
========================= */

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [

            "application/pdf",

            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

            "text/plain"
        ];

        if (
            allowedTypes.includes(
                file.mimetype
            )
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only PDF, DOCX and TXT files are allowed."
                )
            );
        }
    }
});

/* =========================
   HOME ROUTE
========================= */

app.get("/", (req, res) => {

    res.send(`
        <h1>NEXORA AI Interview Assistant Backend 🚀</h1>
        <p>Backend server is running successfully.</p>
    `);
});

/* =========================
   TEST API
========================= */

app.get("/api/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Backend API connected successfully 🤖"
    });
});

/* =========================
   RESUME TEXT EXTRACTION
========================= */

async function extractResumeText(file) {

    if (!file) {

        throw new Error(
            "No resume file uploaded."
        );
    }

    /* ---------- PDF ---------- */

    if (
        file.mimetype ===
        "application/pdf"
    ) {

        const parser = new PDFParse({
            data: file.buffer
        });

        const result =
            await parser.getText();

        await parser.destroy();

        return result.text || "";
    }

    /* ---------- DOCX ---------- */

    if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

        const result =
            await mammoth.extractRawText({
                buffer: file.buffer
            });

        return result.value || "";
    }

    /* ---------- TXT ---------- */

    if (
        file.mimetype ===
        "text/plain"
    ) {

        return file.buffer.toString(
            "utf8"
        );
    }

    throw new Error(
        "Unsupported resume file type."
    );
}

/* =========================
   TEXT NORMALIZATION
========================= */

function normalizeText(text) {

    return String(text || "")
        .replace(/\r/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/* =========================
   SKILL ALIASES
========================= */

const skillAliases = {

    "Java": [
        "java"
    ],

    "Python": [
        "python"
    ],

    "C++": [
        "c++",
        "cpp"
    ],

    "C": [
        "c programming",
        "c language"
    ],

    "JavaScript": [
        "javascript",
        "js"
    ],

    "HTML": [
        "html"
    ],

    "CSS": [
        "css"
    ],

    "React": [
        "react",
        "reactjs",
        "react.js"
    ],

    "Node.js": [
        "node.js",
        "nodejs",
        "node js"
    ],

    "Express": [
        "express",
        "express.js"
    ],

    "MongoDB": [
        "mongodb",
        "mongo db"
    ],

    "SQL": [
        "sql",
        "mysql",
        "postgresql",
        "postgres"
    ],

    "Git": [
        "git"
    ],

    "GitHub": [
        "github",
        "git hub"
    ],

    "DSA": [
        "dsa",
        "data structures and algorithms"
    ],

    "Data Structures": [
        "data structures",
        "data structure"
    ],

    "Algorithms": [
        "algorithms",
        "algorithm"
    ],

    "OOP": [
        "oop",
        "oops",
        "object oriented programming",
        "object-oriented programming"
    ],

    "DBMS": [
        "dbms",
        "database management system"
    ],

    "Operating Systems": [
        "operating systems",
        "operating system",
        "os"
    ],

    "Computer Networks": [
        "computer networks",
        "computer network",
        "networking"
    ],

    "REST API": [
        "rest api",
        "restful api",
        "rest"
    ],

    "Responsive Design": [
        "responsive design",
        "responsive web design"
    ],

    "UI/UX": [
        "ui/ux",
        "ui ux",
        "user interface",
        "user experience"
    ],

    "Authentication": [
        "authentication",
        "authorization",
        "jwt",
        "json web token"
    ],

    "Docker": [
        "docker"
    ],

    "Excel": [
        "excel",
        "microsoft excel"
    ],

    "Power BI": [
        "power bi",
        "powerbi"
    ],

    "Tableau": [
        "tableau"
    ],

    "Statistics": [
        "statistics",
        "statistical analysis"
    ],

    "Pandas": [
        "pandas"
    ],

    "NumPy": [
        "numpy"
    ],

    "R": [
        "r programming",
        "r language"
    ],

    "Machine Learning": [
        "machine learning",
        "machine-learning",
        "ml"
    ],

    "Deep Learning": [
        "deep learning",
        "deep-learning",
        "dl"
    ],

    "Scikit-learn": [
        "scikit-learn",
        "scikit learn",
        "sklearn"
    ],

    "TensorFlow": [
        "tensorflow"
    ],

    "PyTorch": [
        "pytorch"
    ],

    "NLP": [
        "nlp",
        "natural language processing"
    ],

    "Testing": [
        "software testing",
        "testing"
    ],

    "Selenium": [
        "selenium"
    ],

    "API Testing": [
        "api testing"
    ]
};

/* =========================
   SKILL DETECTOR
========================= */

function skillDetected(
    text,
    aliases
) {

    const lowerText =
        String(text || "").toLowerCase();

    if (!Array.isArray(aliases)) {
        return false;
    }

    return aliases.some(
        (alias) => {

            const value =
                String(alias).toLowerCase();

            if (value.length <= 2) {

                const escaped =
                    value.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    );

                const regex =
                    new RegExp(
                        `(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`,
                        "i"
                    );

                return regex.test(
                    lowerText
                );
            }

            return lowerText.includes(
                value
            );
        }
    );
}

/* =========================
   DETECT SKILLS
========================= */

function detectSkills(text) {

    const detected = [];

    for (
        const skill of
        Object.keys(skillAliases)
    ) {

        if (
            skillDetected(
                text,
                skillAliases[skill]
            )
        ) {

            detected.push(skill);
        }
    }

    return detected;
}

/* =========================
   ROLE PROFILES
========================= */

const roleProfiles = {

    "Software Developer": {

        requiredGroups: [

            {
                name:
                    "Programming Language",

                skills: [
                    "Java",
                    "Python",
                    "C++",
                    "C",
                    "JavaScript"
                ]
            },

            {
                name:
                    "Problem Solving",

                skills: [
                    "DSA",
                    "Data Structures",
                    "Algorithms"
                ]
            },

            {
                name:
                    "Development / Version Control",

                skills: [
                    "Git",
                    "GitHub"
                ]
            }
        ],

        recommended: [
            "OOP",
            "DBMS",
            "Operating Systems",
            "Computer Networks"
        ]
    },

    "Frontend Developer": {

        requiredGroups: [

            {
                name:
                    "Frontend Basics",

                skills: [
                    "HTML",
                    "CSS",
                    "JavaScript"
                ]
            },

            {
                name:
                    "Frontend Framework",

                skills: [
                    "React"
                ]
            }
        ],

        recommended: [
            "Git",
            "GitHub",
            "Responsive Design",
            "UI/UX"
        ]
    },

    "Backend Developer": {

        requiredGroups: [

            {
                name:
                    "Programming",

                skills: [
                    "Java",
                    "Python",
                    "JavaScript"
                ]
            },

            {
                name:
                    "Backend Technology",

                skills: [
                    "Node.js",
                    "Express"
                ]
            },

            {
                name:
                    "Database",

                skills: [
                    "MongoDB",
                    "SQL"
                ]
            }
        ],

        recommended: [
            "REST API",
            "Git",
            "GitHub",
            "Authentication",
            "Docker"
        ]
    },

    "Full Stack Developer": {

        requiredGroups: [

            {
                name:
                    "Frontend",

                skills: [
                    "HTML",
                    "CSS",
                    "JavaScript",
                    "React"
                ]
            },

            {
                name:
                    "Backend",

                skills: [
                    "Node.js",
                    "Express"
                ]
            },

            {
                name:
                    "Database",

                skills: [
                    "MongoDB",
                    "SQL"
                ]
            }
        ],

        recommended: [
            "Git",
            "GitHub",
            "REST API",
            "Authentication",
            "Responsive Design"
        ]
    },

    "Data Analyst": {

        requiredGroups: [

            {
                name:
                    "Data Analysis",

                skills: [
                    "SQL",
                    "Excel",
                    "Python"
                ]
            },

            {
                name:
                    "Data Libraries",

                skills: [
                    "Pandas",
                    "NumPy"
                ]
            }
        ],

        recommended: [
            "Power BI",
            "Tableau",
            "Statistics"
        ]
    },

    "Data Scientist": {

        requiredGroups: [

            {
                name:
                    "Programming",

                skills: [
                    "Python",
                    "R"
                ]
            },

            {
                name:
                    "Data Science",

                skills: [
                    "Pandas",
                    "NumPy",
                    "Statistics"
                ]
            },

            {
                name:
                    "Machine Learning",

                skills: [
                    "Machine Learning",
                    "Scikit-learn"
                ]
            }
        ],

        recommended: [
            "Deep Learning",
            "TensorFlow",
            "PyTorch",
            "NLP"
        ]
    },

    "AI/ML Engineer": {

        requiredGroups: [

            {
                name:
                    "Programming",

                skills: [
                    "Python"
                ]
            },

            {
                name:
                    "Machine Learning",

                skills: [
                    "Machine Learning",
                    "Scikit-learn"
                ]
            },

            {
                name:
                    "Deep Learning",

                skills: [
                    "Deep Learning",
                    "TensorFlow",
                    "PyTorch"
                ]
            }
        ],

        recommended: [
            "NLP",
            "NumPy",
            "Pandas"
        ]
    },

    "QA Engineer": {

        requiredGroups: [

            {
                name:
                    "Testing",

                skills: [
                    "Testing"
                ]
            },

            {
                name:
                    "Automation",

                skills: [
                    "Selenium"
                ]
            }
        ],

        recommended: [
            "API Testing",
            "SQL",
            "Java",
            "Python"
        ]
    }
};

/* =========================
   ROLE ANALYSIS
========================= */

function calculateRoleAnalysis(
    resumeText,
    detectedSkills,
    selectedRole
) {

    const profile =
        roleProfiles[selectedRole] ||
        roleProfiles["Software Developer"];

    const requiredGroups =
        profile.requiredGroups || [];

    const recommended =
        profile.recommended || [];

    const strongSkills =
        [...detectedSkills];

    const missingGroups = [];

    let completedGroups = 0;

    requiredGroups.forEach(
        (group) => {

            const found =
                group.skills.some(
                    (skill) =>
                        detectedSkills.includes(
                            skill
                        )
                );

            if (found) {

                completedGroups++;

            } else {

                missingGroups.push(
                    group.name
                );
            }
        }
    );

    const totalGroups =
        Math.max(
            requiredGroups.length,
            1
        );

    let roleScore =
        Math.round(
            (
                completedGroups /
                totalGroups
            ) * 100
        );

    const lowerText =
        resumeText.toLowerCase();

    const projectKeywords = [

        "project",
        "developed",
        "built",
        "created",
        "implemented",
        "application",
        "website",
        "system",
        "platform",
        "dashboard"
    ];

    const projectEvidence =
        projectKeywords.some(
            (keyword) =>
                lowerText.includes(
                    keyword
                )
        );

    if (
        projectEvidence &&
        roleScore > 0
    ) {

        roleScore =
            Math.min(
                100,
                roleScore + 10
            );
    }

    if (
        detectedSkills.length > 0 &&
        roleScore === 0
    ) {

        roleScore = 20;
    }

    const recommendedSkills =
        recommended.filter(
            (skill) =>
                !detectedSkills.includes(
                    skill
                )
        );

    const recommendedFound =
        recommended.filter(
            (skill) =>
                detectedSkills.includes(
                    skill
                )
        );

    return {

        roleScore,

        strongSkills,

        missingSkills:
            missingGroups,

        recommendedSkills,

        recommendedFound,

        completedGroups,

        totalGroups,

        projectEvidence
    };
}/* =========================
   ATS SCORE
========================= */

function calculateATSScore(resumeText) {

    const text =
        String(resumeText || "");

    const lower =
        text.toLowerCase();

    const words =
        text
            .split(/\s+/)
            .filter(Boolean);

    let score = 0;

    /* ---------- LENGTH ---------- */

    if (
        words.length >= 250 &&
        words.length <= 900
    ) {

        score += 20;

    } else if (
        words.length >= 150 &&
        words.length <= 1200
    ) {

        score += 15;

    } else {

        score += 8;
    }

    /* ---------- SECTIONS ---------- */

    const sections = [

        "education",
        "skills",
        "projects",
        "experience",
        "certifications",
        "achievements"
    ];

    let sectionCount = 0;

    sections.forEach(
        (section) => {

            if (
                lower.includes(section)
            ) {

                sectionCount++;
            }
        }
    );

    score += Math.min(
        25,
        sectionCount * 4
    );

    /* ---------- EMAIL ---------- */

    if (
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
            .test(text)
    ) {

        score += 10;
    }

    /* ---------- PHONE ---------- */

    if (
        /(?:\+91[\s-]?)?[6-9]\d{9}/
            .test(text)
    ) {

        score += 10;
    }

    /* ---------- ACTION WORDS ---------- */

    const actionWords = [

        "developed",
        "built",
        "created",
        "implemented",
        "designed",
        "managed",
        "improved",
        "optimized",
        "developed",
        "led"
    ];

    const actionCount =
        actionWords.filter(
            (word) =>
                lower.includes(word)
        ).length;

    score += Math.min(
        15,
        actionCount * 2
    );

    /* ---------- CLEAN TEXT ---------- */

    if (
        !/[^\x00-\x7F]{10,}/.test(text)
    ) {

        score += 5;
    }

    return Math.max(
        0,
        Math.min(
            100,
            Math.round(score)
        )
    );
}

/* =========================
   EVIDENCE SCORE
========================= */

function calculateEvidenceScore(
    resumeText
) {

    const lower =
        String(resumeText || "")
            .toLowerCase();

    let score = 0;

    const evidenceWords = [

        "developed",
        "built",
        "created",
        "implemented",
        "designed",
        "worked",
        "managed",
        "achieved",
        "improved",
        "optimized"
    ];

    const evidenceCount =
        evidenceWords.filter(
            (word) =>
                lower.includes(word)
        ).length;

    score += Math.min(
        35,
        evidenceCount * 4
    );

    /* ---------- NUMBERS ---------- */

    const numberMatches =
        lower.match(
            /\b\d+(?:\.\d+)?%?\b/g
        ) || [];

    if (
        numberMatches.length >= 3
    ) {

        score += 25;

    } else if (
        numberMatches.length >= 1
    ) {

        score += 15;
    }

    /* ---------- PROJECT EVIDENCE ---------- */

    const projectWords = [

        "project",
        "application",
        "website",
        "system",
        "platform",
        "dashboard"
    ];

    const projectCount =
        projectWords.filter(
            (word) =>
                lower.includes(word)
        ).length;

    score += Math.min(
        20,
        projectCount * 4
    );

    /* ---------- EDUCATION ---------- */

    if (
        lower.includes("education") ||
        lower.includes("b.tech") ||
        lower.includes("btech") ||
        lower.includes("bachelor")
    ) {

        score += 10;
    }

    /* ---------- EXPERIENCE ---------- */

    if (
        lower.includes("experience") ||
        lower.includes("internship")
    ) {

        score += 10;
    }

    return Math.max(
        0,
        Math.min(
            100,
            Math.round(score)
        )
    );
}

/* =========================
   JOB DESCRIPTION ANALYSIS
========================= */

function analyzeJobDescription(
    resumeText,
    jobDescription
) {

    const jd =
        String(jobDescription || "")
            .trim();

    if (!jd) {

        return {

            score: 0,

            found: [],

            missing: []
        };
    }

    const detectedJD =
        detectSkills(jd);

    const detectedResume =
        detectSkills(resumeText);

    const found =
        detectedJD.filter(
            (skill) =>
                detectedResume.includes(
                    skill
                )
        );

    const missing =
        detectedJD.filter(
            (skill) =>
                !detectedResume.includes(
                    skill
                )
        );

    const score =
        detectedJD.length === 0
            ? 0
            : Math.round(
                (
                    found.length /
                    detectedJD.length
                ) * 100
            );

    return {

        score,

        found,

        missing
    };
}

/* =========================
   PROJECT ANALYSIS
========================= */

function analyzeProjects(
    resumeText
) {

    const text =
        String(resumeText || "");

    const lower =
        text.toLowerCase();

    const projectKeywords = [

        "project",
        "projects",
        "developed",
        "built",
        "created",
        "implemented",
        "application",
        "website",
        "system",
        "platform"
    ];

    const foundKeywords =
        projectKeywords.filter(
            (keyword) =>
                lower.includes(keyword)
        );

    let projectScore = 0;

    if (
        foundKeywords.length >= 5
    ) {

        projectScore = 100;

    } else if (
        foundKeywords.length >= 3
    ) {

        projectScore = 80;

    } else if (
        foundKeywords.length >= 1
    ) {

        projectScore = 60;

    } else {

        projectScore = 20;
    }

    const hasTechnology =
        detectSkills(text).length > 0;

    const hasNumbers =
        /\b\d+(?:\.\d+)?%?\b/
            .test(text);

    if (hasTechnology) {

        projectScore =
            Math.min(
                100,
                projectScore + 5
            );
    }

    if (hasNumbers) {

        projectScore =
            Math.min(
                100,
                projectScore + 5
            );
    }

    return {

        score: projectScore,

        foundKeywords,

        hasTechnology,

        hasNumbers,

        suggestion:
            projectScore < 70
                ? "Add clear project details, technologies and measurable results."
                : "Project section contains useful evidence."
    };
}

/* =========================
   BULLET ANALYSIS
========================= */

function analyzeBullets(
    resumeText
) {

    const text =
        String(resumeText || "");

    const lines =
        text
            .split(/\n/)
            .map(
                (line) =>
                    line.trim()
            )
            .filter(Boolean);

    const bulletLines =
        lines.filter(
            (line) =>
                /^[•●▪◦\-*]/.test(line)
        );

    const actionWords = [

        "developed",
        "built",
        "created",
        "implemented",
        "designed",
        "managed",
        "improved",
        "optimized",
        "led",
        "analyzed",
        "tested"
    ];

    let strongBullets = 0;

    bulletLines.forEach(
        (line) => {

            const lower =
                line.toLowerCase();

            if (
                actionWords.some(
                    (word) =>
                        lower.includes(word)
                )
            ) {

                strongBullets++;
            }
        }
    );

    let score;

    if (
        bulletLines.length === 0
    ) {

        score = 45;

    } else {

        score =
            Math.round(
                (
                    strongBullets /
                    bulletLines.length
                ) * 100
            );
    }

    return {

        score,

        totalBullets:
            bulletLines.length,

        strongBullets,

        suggestion:
            score < 70
                ? "Start bullets with action words and add measurable results."
                : "Bullet points use useful action-oriented language."
    };
}

/* =========================
   RESUME ISSUES
========================= */

function findResumeIssues(
    resumeText,
    atsScore,
    roleAnalysis,
    evidenceScore
) {

    const issues = [];

    const lower =
        String(resumeText || "")
            .toLowerCase();

    if (
        atsScore < 70
    ) {

        issues.push(
            "Improve ATS-friendly resume structure."
        );
    }

    if (
        roleAnalysis.roleScore < 50
    ) {

        issues.push(
            "Add more skills relevant to the selected target role."
        );
    }

    if (
        evidenceScore < 60
    ) {

        issues.push(
            "Add measurable achievements and stronger project evidence."
        );
    }

    if (
        !lower.includes("education")
    ) {

        issues.push(
            "Add a clear Education section."
        );
    }

    if (
        !lower.includes("skills")
    ) {

        issues.push(
            "Add a dedicated Skills section."
        );
    }

    if (
        !lower.includes("project")
    ) {

        issues.push(
            "Add a Projects section with clear contributions."
        );
    }

    if (
        !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
            .test(resumeText)
    ) {

        issues.push(
            "Add a valid professional email address."
        );
    }

    return issues;
}

/* =========================
   ACTION PLAN
========================= */

function createActionPlan(
    issues,
    missingSkills,
    recommendedSkills
) {

    const plan = [];

    issues.forEach(
        (issue) => {

            plan.push(issue);
        }
    );

    if (
        missingSkills.length > 0
    ) {

        plan.push(
            "Consider adding relevant role skills: " +
            missingSkills
                .slice(0, 5)
                .join(", ") +
            "."
        );
    }

    if (
        recommendedSkills.length > 0
    ) {

        plan.push(
            "Recommended skills to strengthen: " +
            recommendedSkills
                .slice(0, 5)
                .join(", ") +
            "."
        );
    }

    if (
        plan.length === 0
    ) {

        plan.push(
            "Resume has a good base. Continue improving measurable impact and role relevance."
        );
    }

    return plan;
}

/* =========================
   LOCAL AI MODEL
========================= */

let resumeAI = null;

let resumeAILoading = null;

async function loadResumeAI() {

    if (resumeAI) {

        return resumeAI;
    }

    if (resumeAILoading) {

        return resumeAILoading;
    }

    resumeAILoading =
        (async () => {

            try {

                console.log(
                    "Loading NEXORA local AI model..."
                );

                resumeAI =
                    await pipeline(
                        "feature-extraction",
                        "Xenova/all-MiniLM-L6-v2"
                    );

                console.log(
                    "NEXORA local AI model loaded ✅"
                );

                return resumeAI;

            } catch (error) {

                console.error(
                    "AI model loading failed:",
                    error.message
                );

                resumeAI = null;

                return null;
            }
        })();

    return resumeAILoading;
}

/* =========================
   AI TEXT EMBEDDING
========================= */

async function createEmbedding(
    model,
    text
) {

    const output =
        await model(
            String(text || ""),
            {
                pooling: "mean",
                normalize: true
            }
        );

    return Array.from(
        output.data
    );
}

/* =========================
   COSINE SIMILARITY
========================= */

function cosineSimilarity(
    vectorA,
    vectorB
) {

    if (
        !Array.isArray(vectorA) ||
        !Array.isArray(vectorB) ||
        vectorA.length !== vectorB.length ||
        vectorA.length === 0
    ) {

        return 0;
    }

    let dot = 0;

    let normA = 0;

    let normB = 0;

    for (
        let i = 0;
        i < vectorA.length;
        i++
    ) {

        dot +=
            vectorA[i] *
            vectorB[i];

        normA +=
            vectorA[i] *
            vectorA[i];

        normB +=
            vectorB[i] *
            vectorB[i];
    }

    if (
        normA === 0 ||
        normB === 0
    ) {

        return 0;
    }

    return (
        dot /
        (
            Math.sqrt(normA) *
            Math.sqrt(normB)
        )
    );
}

/* =========================
   AI ROLE SEMANTIC ANALYSIS
========================= */

async function analyzeResumeWithAI(
    resumeText,
    selectedRole
) {

    const model =
        await loadResumeAI();

    if (!model) {

        return {

            available: false,

            score: 0,

            confidence: 0,

            explanation:
                "Local AI model unavailable. Rule-based analysis was used.",

            matchedConcepts: [],

            missingConcepts: []
        };
    }

    const profile =
    roleProfiles[selectedRole] ||
    roleProfiles["Software Developer"];

const detectedSkills =
    detectSkills(normalizedResume);

const roleAnalysis =
    calculateRoleAnalysis(
        normalizedResume,
        detectedSkills,
        selectedRole
    );

const matchedSkills =
    roleAnalysis.strongSkills;

const missingSkills =
    roleAnalysis.missingSkills;

const recommendedSkills =
    roleAnalysis.recommendedSkills;

const recommendedFound =
    roleAnalysis.recommendedFound;

/* ---------- SCORES ---------- */
            /* ---------- SCORES ---------- */

            const atsScore =
                calculateATSScore(
                    normalizedResume
                );

            const evidenceScore =
                calculateEvidenceScore(
                    normalizedResume
                );

            const ruleRoleScore =
                roleAnalysis.roleScore;

            /* ---------- JD ---------- */

            const jdAnalysis =
                analyzeJobDescription(
                    normalizedResume,
                    jobDescription
                );

            /* ---------- PROJECTS ---------- */

            const projectAnalysis =
                analyzeProjects(
                    normalizedResume
                );

            /* ---------- BULLETS ---------- */

            const bulletImprovement =
                analyzeBullets(
                    resumeText
                );

            /* ---------- AI ---------- */

            const aiAnalysis =
                await analyzeResumeWithAI(
                    normalizedResume,
                    selectedRole
                );

            /* ---------- COMBINED ROLE SCORE ---------- */

            let roleScore =
                ruleRoleScore;

            if (
                aiAnalysis.available
            ) {

                roleScore =
                    Math.round(
                        (
                            ruleRoleScore *
                            0.65
                        ) +
                        (
                            aiAnalysis.score *
                            0.35
                        )
                    );
            }

            roleScore =
                Math.max(
                    0,
                    Math.min(
                        100,
                        roleScore
                    )
                );

            /* ---------- OVERALL SCORE ---------- */

            const overall =
                Math.round(
                    (
                        atsScore * 0.40
                    ) +
                    (
                        roleScore * 0.35
                    ) +
                    (
                        evidenceScore * 0.15
                    ) +
                    (
                        (
                            aiAnalysis.available
                                ? aiAnalysis.score
                                : roleScore
                        ) * 0.10
                    )
                );

            /* ---------- ROLE ALIGNMENT ---------- */

            let roleAlignment =
                "Needs Improvement";

            if (
                roleScore >= 70
            ) {

                roleAlignment =
                    "Strong Match";

            } else if (
                roleScore >= 40
            ) {

                roleAlignment =
                    "Moderate Match";
            }

            /* ---------- ISSUES ---------- */

            const issues =
                findResumeIssues(
                    normalizedResume,
                    atsScore,
                    {
                        ...roleAnalysis,
                        roleScore
                    },
                    evidenceScore
                );

            if (
                projectAnalysis.score < 70
            ) {

                issues.push(
                    "Strengthen project descriptions with technologies and measurable outcomes."
                );
            }

            if (
                bulletImprovement.score < 70
            ) {

                issues.push(
                    "Improve resume bullet points using strong action words and measurable impact."
                );
            }

            if (
                jobDescription &&
                jdAnalysis.score < 60
            ) {

                issues.push(
                    "Align the resume more closely with the supplied job description."
                );
            }

            /* ---------- IMPROVEMENTS ---------- */

            const improvements = [];

            if (
                missingSkills.length > 0
            ) {

                improvements.push(
                    "Consider adding relevant role skills: " +
                    missingSkills
                        .slice(0, 6)
                        .join(", ") +
                    "."
                );
            }

            if (
                recommendedSkills.length > 0
            ) {

                improvements.push(
                    "Recommended skills: " +
                    recommendedSkills
                        .slice(0, 5)
                        .join(", ") +
                    "."
                );
            }

            if (
                projectAnalysis.score < 70
            ) {

                improvements.push(
                    projectAnalysis.suggestion
                );
            }

            if (
                bulletImprovement.score < 70
            ) {

                improvements.push(
                    bulletImprovement.suggestion
                );
            }

            if (
                aiAnalysis.available &&
                aiAnalysis.score < 60
            ) {

                improvements.push(
                    "Improve semantic alignment between your resume content and the selected target role."
                );
            }

            if (
                improvements.length === 0
            ) {

                improvements.push(
                    "Your resume has a solid base. Continue improving measurable impact and role-specific relevance."
                );
            }

            /* ---------- ACTION PLAN ---------- */

            const actionPlan =
                createActionPlan(
                    issues,
                    missingSkills,
                    recommendedSkills
                );

            /* ---------- RESPONSE ---------- */
            try{ 

            return res.json({

                success: true,

                analyzerVersion:
                    "NEXORA-AI-RESUME-V1",

                aiUsed:
                    aiAnalysis.available,

                selectedRole,

                targetRole:
                    selectedRole,

                role:
                    selectedRole,

                overall,

                score:
                    overall,

                atsScore,

                roleScore,

                ruleBasedRoleScore:
                    ruleRoleScore,

                evidenceScore,

                aiScore:
                    aiAnalysis.available
                        ? aiAnalysis.score
                        : null,

                aiConfidence:
                    aiAnalysis.available
                        ? aiAnalysis.confidence
                        : "Unavailable",

                aiExplanation:
                    aiAnalysis.explanation,

                detectedSkills,

                skills:
                    detectedSkills,

                matchedSkills,

                strongSkills:
                    matchedSkills,

                missingSkills,

                weakSkills:
                    missingSkills,

                recommendedSkills,

                recommendedFound,

                matchedGroups:
                    roleAnalysis.completedGroups,

                missingGroups:
                    roleAnalysis.missingSkills,

                totalGroups:
                    roleAnalysis.totalGroups,

                completedGroups:
                    roleAnalysis.completedGroups,

                roleAlignment,

                roleExplanation:
                    `Resume alignment for ${selectedRole} is ${roleAlignment.toLowerCase()}.`,

                aiMatchedConcepts:
                    aiAnalysis.matchedConcepts,

                aiMissingConcepts:
                    aiAnalysis.missingConcepts,

                jdScore:
                    jdAnalysis.score,

                jdFound:
                    jdAnalysis.found,

                jdMissing:
                    jdAnalysis.missing,

                projectAnalysis,

                bulletImprovement,

                issues,

                improvements,

                actionPlan,

                resumeStats: {

                    words:
                        normalizedResume
                            .split(/\s+/)
                            .filter(Boolean)
                            .length,

                    characters:
                        normalizedResume.length,

                    detectedSkills:
                        detectedSkills.length,

                    matchedSkills:
                        matchedSkills.length,

                    missingSkills:
                        missingSkills.length
                },

                analysis: {

                    ats: atsScore,

                    role:
                        roleScore,

                    evidence:
                        evidenceScore,

                    ai:
                        aiAnalysis.available
                            ? aiAnalysis.score
                            : null,

                    overall
                },

                resumeText:
                    normalizedResume,
                   

                jobDescription,

                message:
                    "Resume analyzed successfully using NEXORA rule-based checks and local AI semantic analysis."
            });

        } catch (error) {

            console.error(
                "Resume analysis failed:",
                error
            );
        }

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Resume analysis failed.",

                    error:
                        error.message
                });
        }

        /* =========================
   RESUME ANALYZER
========================= */

app.post(
    "/api/resume",
    upload.single("resume"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload a resume file."
                });
            }

            const selectedRole =
                req.body.targetRole ||
                req.body.role ||
                "Software Developer";

            const jobDescription =
                req.body.jobDescription || "";

            const resumeText =
                await extractResumeText(req.file);

            const normalizedResume =
                normalizeText(resumeText);

            if (normalizedResume.length < 30) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Could not extract enough text from the resume."
                });
            }

            const detectedSkills =
                detectSkills(normalizedResume);

            const roleAnalysis =
                calculateRoleAnalysis(
                    normalizedResume,
                    detectedSkills,
                    selectedRole
                );

            const matchedSkills =
                roleAnalysis.strongSkills || [];

            const missingSkills =
                roleAnalysis.missingSkills || [];

            const recommendedSkills =
                roleAnalysis.recommendedSkills || [];

            const recommendedFound =
                roleAnalysis.recommendedFound || [];

            const atsScore =
                calculateATSScore(normalizedResume);

            const evidenceScore =
                calculateEvidenceScore(normalizedResume);

            const roleScore =
                Math.max(
                    0,
                    Math.min(
                        100,
                        roleAnalysis.roleScore || 0
                    )
                );

            const jdAnalysis =
                analyzeJobDescription(
                    normalizedResume,
                    jobDescription
                );

            const projectAnalysis =
                analyzeProjects(normalizedResume);

            const bulletImprovement =
                analyzeBullets(resumeText);

            let roleAlignment = "Needs Improvement";

            if (roleScore >= 70) {
                roleAlignment = "Strong Match";
            } else if (roleScore >= 40) {
                roleAlignment = "Moderate Match";
            }

            const issues =
                findResumeIssues(
                    normalizedResume,
                    atsScore,
                    {
                        ...roleAnalysis,
                        roleScore
                    },
                    evidenceScore
                );

            const improvements = [];

            if (missingSkills.length > 0) {
                improvements.push(
                    "Relevant skills to consider: " +
                    missingSkills.slice(0, 6).join(", ") +
                    "."
                );
            }

            if (recommendedSkills.length > 0) {
                improvements.push(
                    "Recommended skills: " +
                    recommendedSkills.slice(0, 5).join(", ") +
                    "."
                );
            }

            if (projectAnalysis.score < 70) {
                improvements.push(
                    projectAnalysis.suggestion
                );
            }

            if (bulletImprovement.score < 70) {
                improvements.push(
                    bulletImprovement.suggestion
                );
            }

            if (improvements.length === 0) {
                improvements.push(
                    "Your resume has a solid base. Continue improving role-specific relevance."
                );
            }

            const actionPlan =
                createActionPlan(
                    issues,
                    missingSkills,
                    recommendedSkills
                );

            const overall =
                Math.round(
                    atsScore * 0.40 +
                    roleScore * 0.35 +
                    evidenceScore * 0.15 +
                    jdAnalysis.score * 0.10
                );

            return res.json({

                success: true,

                analyzerVersion:
                    "NEXORA-RULE-BASED-V1",

                aiUsed: false,

                selectedRole,

                targetRole: selectedRole,

                role: selectedRole,

                overall,

                score: overall,

                atsScore,

                roleScore,

                ruleBasedRoleScore: roleScore,

                evidenceScore,

                aiScore: null,

                aiConfidence: "Not Used",

                aiExplanation:
                    "NEXORA is using rule-based resume analysis.",

                detectedSkills,

                skills: detectedSkills,

                matchedSkills,

                strongSkills: matchedSkills,

                missingSkills,

                weakSkills: missingSkills,

                recommendedSkills,

                recommendedFound,

                matchedGroups:
                    roleAnalysis.completedGroups,

                missingGroups:
                    roleAnalysis.missingSkills,

                totalGroups:
                    roleAnalysis.totalGroups,

                completedGroups:
                    roleAnalysis.completedGroups,

                roleAlignment,

                roleExplanation:
                    `Resume alignment for ${selectedRole} is ${roleAlignment.toLowerCase()}.`,

                aiMatchedConcepts: [],

                aiMissingConcepts: [],

                jdScore: jdAnalysis.score,

                jdFound: jdAnalysis.found,

                jdMissing: jdAnalysis.missing,

                projectAnalysis,

                bulletImprovement,

                issues,

                improvements,

                actionPlan,

                resumeStats: {

                    words:
                        normalizedResume
                            .split(/\s+/)
                            .filter(Boolean)
                            .length,

                    characters:
                        normalizedResume.length,

                    detectedSkills:
                        detectedSkills.length,

                    matchedSkills:
                        matchedSkills.length,

                    missingSkills:
                        missingSkills.length
                },

                analysis: {

                    ats: atsScore,

                    role: roleScore,

                    evidence: evidenceScore,

                    ai: null,

                    overall
                },

                resumeText: normalizedResume,

                jobDescription,

                message:
                    "Resume analyzed successfully by NEXORA Resume Analyzer."
            });

        } catch (error) {

            console.error(
                "Resume analysis failed:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Resume analysis failed.",

                error:
                    error.message
            });
        }
    }
);
    

/* =========================
   AUTH - SIGN UP
========================= */

app.post(
    "/api/auth/signup",
    async (req, res) => {

        try {

            const {
                name,
                email,
                password,
                college,
                branch,
                year,
                graduationYear,
                targetRole,
                preparationType,
                currentLevel,
                dailyGoal
            } = req.body;

            if (
                !name ||
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Name, email and password are required."
                    });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const existingUser =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (existingUser) {

                return res
                    .status(409)
                    .json({

                        success: false,

                        message:
                            "An account with this email already exists."
                    });
            }

            const user =
                new User({

                    name:
                        name.trim(),

                    email:
                        normalizedEmail,

                    password,

                    college:
                        college || "",

                    branch:
                        branch || "",

                    year:
                        year || "",

                    graduationYear:
                        graduationYear || "",

                    targetRole:
                        targetRole ||
                        "Software Developer",

                    preparationType:
                        preparationType ||
                        "Placement",

                    currentLevel:
                        currentLevel ||
                        "Beginner",

                    dailyGoal:
                        Number(
                            dailyGoal
                        ) || 1
                });

            await user.save();

            return res.json({

                success: true,

                message:
                    "Account created successfully!",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    college:
                        user.college,

                    branch:
                        user.branch,

                    year:
                        user.year,

                    graduationYear:
                        user.graduationYear,

                    targetRole:
                        user.targetRole,

                    preparationType:
                        user.preparationType,

                    currentLevel:
                        user.currentLevel,

                    dailyGoal:
                        user.dailyGoal
                }
            });

        } catch (error) {

            console.error(
                "Signup error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Signup failed.",

                    error:
                        error.message
                });
        }
    }
);

/* =========================
   AUTH - LOGIN
========================= */

app.post(
    "/api/auth/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Email and password are required."
                    });
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            const user =
                await User.findOne({
                    email:
                        normalizedEmail
                });

            if (!user) {

                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Invalid email or password."
                    });
            }

            if (
                user.password !==
                password
            ) {

                return res
                    .status(401)
                    .json({

                        success: false,

                        message:
                            "Invalid email or password."
                    });
            }

            return res.json({

                success: true,

                message:
                    "Login successful!",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    college:
                        user.college,

                    branch:
                        user.branch,

                    year:
                        user.year,

                    graduationYear:
                        user.graduationYear,

                    targetRole:
                        user.targetRole,

                    preparationType:
                        user.preparationType,

                    currentLevel:
                        user.currentLevel,

                    dailyGoal:
                        user.dailyGoal
                }
            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Login failed.",

                    error:
                        error.message
                });
        }
    }
);

/* =========================
   INTERVIEW QUESTION BANK
========================= */

const interviewQuestions = [

    {
        question:
            "What is TCP and how is it different from UDP?",

        topic:
            "Computer Networks",

        difficulty:
            "Beginner",

        area:
            "Core CS",

        role:
            "Software Developer"
    },

    {
        question:
            "What is polymorphism in OOP?",

        topic:
            "OOP",

        difficulty:
            "Beginner",

        area:
            "Core CS",

        role:
            "Software Developer"
    },

    {
        question:
            "What is DNS and why is it used?",

        topic:
            "Computer Networks",

        difficulty:
            "Beginner",

        area:
            "Core CS",

        role:
            "Software Developer"
    },

    {
        question:
            "What are ACID properties in DBMS?",

        topic:
            "DBMS",

        difficulty:
            "Intermediate",

        area:
            "Core CS",

        role:
            "Software Developer"
    },

    {
        question:
            "What is normalization in DBMS?",

        topic:
            "DBMS",

        difficulty:
            "Intermediate",

        area:
            "Core CS",

        role:
            "Software Developer"
    },

    {
        question:
            "What is the difference between a process and a thread?",

        topic:
            "Operating Systems",

        difficulty:
            "Beginner",

        area:
            "Core CS",

        role:
            "Software Developer"
    },

    {
        question:
            "What is deadlock in an operating system?",

        topic:
            "Operating Systems",

        difficulty:
            "Intermediate",

        area:
            "Core CS",

        role:
            "Software Developer"
    },

    {
        question:
            "What is inheritance in OOP?",

        topic:
            "OOP",

        difficulty:
            "Beginner",

        area:
            "Core CS",

        role:
            "Software Developer"
    },

    {
        question:
            "What is an API?",

        topic:
            "Web",

        difficulty:
            "Beginner",

        area:
            "Technical",

        role:
            "Software Developer"
    },

    {
        question:
            "What is the difference between SQL and NoSQL databases?",

        topic:
            "DBMS",

        difficulty:
            "Intermediate",

        area:
            "Core CS",

        role:
            "Software Developer"
    }
];

/* =========================
   GET INTERVIEW QUESTION
========================= */

app.get(
    "/api/interview",
    (req, res) => {

        const role =
            req.query.role ||
            "Software Developer";

        const difficulty =
            req.query.difficulty ||
            "Beginner";

        const area =
            req.query.area ||
            "Core CS";

        let available =
            interviewQuestions.filter(
                (item) => {

                    const roleMatch =
                        item.role === role ||
                        role ===
                            "Software Developer";

                    const difficultyMatch =
                        item.difficulty ===
                        difficulty;

                    const areaMatch =
                        item.area === area ||
                        area === "Technical";

                    return (
                        roleMatch &&
                        difficultyMatch &&
                        areaMatch
                    );
                }
            );

        if (
            available.length === 0
        ) {

            available =
                interviewQuestions.filter(
                    (item) =>
                        item.difficulty ===
                        difficulty
                );
        }

        if (
            available.length === 0
        ) {

            available =
                interviewQuestions;
        }

        const randomIndex =
            Math.floor(
                Math.random() *
                available.length
            );

        return res.json({

            success: true,

            question:
                available[randomIndex]
        });
    }
);

/* =========================
   INTERVIEW EVALUATOR HELPERS
========================= */

const interviewReferenceData = {

    "TCP and UDP": {

        keywords: [
            "connection",
            "reliable",
            "acknowledgment",
            "acknowledgement",
            "retransmission",
            "ordered",
            "connectionless",
            "fast",
            "udp"
        ],

        concepts: [
            "TCP is connection-oriented",
            "TCP provides reliable delivery",
            "UDP is connectionless",
            "UDP does not guarantee delivery",
            "TCP uses acknowledgements",
            "TCP can retransmit lost data"
        ]
    },

    "polymorphism": {

        keywords: [
            "same interface",
            "different behavior",
            "overloading",
            "overriding",
            "compile time",
            "runtime",
            "method"
        ],

        concepts: [
            "Polymorphism means many forms",
            "Same interface can have different behavior",
            "Method overloading is compile-time polymorphism",
            "Method overriding is runtime polymorphism"
        ]
    },

    "dns": {

        keywords: [
            "domain",
            "name",
            "ip",
            "address",
            "server",
            "resolve",
            "resolution"
        ],

        concepts: [
            "DNS translates domain names to IP addresses",
            "DNS helps clients locate servers",
            "DNS resolution maps names to network addresses"
        ]
    },

    "acid": {

        keywords: [
            "atomicity",
            "consistency",
            "isolation",
            "durability",
            "transaction"
        ],

        concepts: [
            "Atomicity",
            "Consistency",
            "Isolation",
            "Durability"
        ]
    },

    "normalization": {

        keywords: [
            "redundancy",
            "duplicate",
            "duplication",
            "normal form",
            "dependency",
            "database",
            "anomaly"
        ],

        concepts: [
            "Normalization reduces data redundancy",
            "Normalization organizes database tables",
            "Normalization helps reduce update anomalies"
        ]
    },

    "process and thread": {

        keywords: [
            "process",
            "thread",
            "memory",
            "independent",
            "shared",
            "resource",
            "execution"
        ],

        concepts: [
            "A process has its own address space",
            "Threads belong to a process",
            "Threads can share process resources",
            "Threads are lighter than processes"
        ]
    },

    "deadlock": {

        keywords: [
            "deadlock",
            "resource",
            "wait",
            "circular",
            "mutual exclusion",
            "hold and wait",
            "no preemption"
        ],

        concepts: [
            "Deadlock occurs when processes wait indefinitely",
            "Deadlock involves circular waiting",
            "Mutual exclusion can be a necessary condition"
        ]
    },

    "inheritance": {

        keywords: [
            "parent",
            "child",
            "class",
            "properties",
            "methods",
            "reuse",
            "extends"
        ],

        concepts: [
            "Inheritance allows a class to acquire properties and methods",
            "Inheritance supports code reuse",
            "A child class can inherit from a parent class"
        ]
    },

    "api": {

        keywords: [
            "application",
            "programming",
            "interface",
            "communication",
            "request",
            "response",
            "server",
            "client"
        ],

        concepts: [
            "API stands for Application Programming Interface",
            "API allows software components to communicate",
            "APIs commonly use requests and responses"
        ]
    },

    "sql and nosql": {

        keywords: [
            "sql",
            "nosql",
            "relational",
            "table",
            "document",
            "schema",
            "structured",
            "non relational"
        ],

        concepts: [
            "SQL databases are generally relational",
            "SQL commonly uses tables",
            "NoSQL databases can use document-based models",
            "NoSQL databases can have flexible schemas"
        ]
    }
};

/* =========================
   INTERVIEW TEXT HELPERS
========================= */

function cleanInterviewText(
    text
) {

    return String(text || "")
        .toLowerCase()
        .replace(
            /[^a-z0-9+#.\s-]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

function getInterviewReference(
    question
) {

    const lower =
        cleanInterviewText(
            question
        );

    const keys =
        Object.keys(
            interviewReferenceData
        );

    for (
        const key of keys
    ) {

        const keyWords =
            key
                .toLowerCase()
                .split(" ");

        const matches =
            keyWords.filter(
                (word) =>
                    lower.includes(word)
            ).length;

        if (
            matches >=
            Math.max(
                1,
                Math.ceil(
                    keyWords.length * 0.6
                )
            )
        ) {

            return interviewReferenceData[
                key
            ];
        }
    }

    return null;
}

/* =========================
   INTERVIEW EVALUATION
========================= */

app.post(
    "/api/interview",
    async (req, res) => {

        try {

            const {
                question,
                answer,
                role,
                difficulty,
                area,
                previousQuestions,
                resumeContext
            } = req.body;

            if (
                !question ||
                !answer
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Question and answer are required."
                    });
            }

            const cleanQuestion =
                cleanInterviewText(
                    question
                );

            const cleanAnswer =
                cleanInterviewText(
                    answer
                );

            /* ---------- GIBBERISH CHECK ---------- */

            const words =
                cleanAnswer
                    .split(/\s+/)
                    .filter(Boolean);

            const uniqueWords =
                new Set(words);

            const hasRepeatedPattern =
                words.length >= 8 &&
                uniqueWords.size <= 2;

            const hasLetters =
                /[a-z]/i.test(
                    cleanAnswer
                );

            if (
                words.length < 2 ||
                !hasLetters ||
                hasRepeatedPattern
            ) {

                return res.json({

                    success: true,

                    score: 0,

                    answerValidity:
                        "Meaningless / Gibberish",

                    relevance: 0,

                    technicalCorrectness: 0,

                    technicalDepth: 0,

                    clarity: 0,

                    structure: 0,

                    feedback:
                        "Meaningful technical content was not detected in the answer.",

                    strengths: [],

                    weaknesses: [
                        "Provide a clear answer related to the question."
                    ],

                    missingPoints: [],

                    recommendations: [
                        "Use complete sentences and explain the main technical concept."
                    ],

                    contradictionResults: [],

                    question,

                    answer,

                    role:
                        role ||
                        "Software Developer",

                    difficulty:
                        difficulty ||
                        "Beginner",

                    area:
                        area ||
                        "Core CS"
                });
            }

            /* ---------- REFERENCE ---------- */

            const reference =
                getInterviewReference(
                    cleanQuestion
                );

            let relevance = 25;

            let technicalCorrectness = 20;

            let technicalDepth = 15;

            let clarity = 40;

            let structure = 20;

            const strengths = [];

            const weaknesses = [];

            const missingPoints = [];

            const recommendations = [];

            const contradictionResults = [];

            /* ---------- GENERAL RELEVANCE ---------- */

            const questionWords =
                cleanQuestion
                    .split(/\s+/)
                    .filter(
                        (word) =>
                            word.length > 3
                    );

            const answerWordMatches =
                questionWords.filter(
                    (word) =>
                        cleanAnswer.includes(
                            word
                        )
                );

            if (
                answerWordMatches.length >= 1
            ) {

                relevance += 25;
            }

            if (
                answerWordMatches.length >= 3
            ) {

                relevance += 25;
            }

            /* ---------- REFERENCE KEYWORDS ---------- */

            if (reference) {

                const keywordMatches =
                    reference.keywords.filter(
                        (keyword) =>
                            cleanAnswer.includes(
                                keyword
                            )
                    );

                const keywordRatio =
                    keywordMatches.length /
                    Math.max(
                        reference.keywords.length,
                        1
                    );

                relevance =
                    Math.min(
                        100,
                        relevance +
                        Math.round(
                            keywordRatio *
                            35
                        )
                    );

                if (
                    keywordMatches.length >= 2
                ) {

                    technicalCorrectness += 25;

                    strengths.push(
                        "Relevant technical concepts were included."
                    );
                }

                if (
                    keywordMatches.length >= 4
                ) {

                    technicalDepth += 25;
                }

                /* ---------- CONCEPT COVERAGE ---------- */

                const conceptMatches =
                    reference.concepts.filter(
                        (concept) => {

                            const conceptWords =
                                cleanInterviewText(
                                    concept
                                )
                                    .split(/\s+/)
                                    .filter(
                                        (word) =>
                                            word.length > 3
                                    );

                            const matchCount =
                                conceptWords.filter(
                                    (word) =>
                                        cleanAnswer.includes(
                                            word
                                        )
                                ).length;

                            return (
                                matchCount >=
                                Math.max(
                                    1,
                                    Math.ceil(
                                        conceptWords.length *
                                        0.25
                                    )
                                )
                            );
                        }
                    );

                if (
                    conceptMatches.length >= 1
                ) {

                    technicalCorrectness += 15;
                }

                if (
                    conceptMatches.length >= 2
                ) {

                    technicalDepth += 15;
                }

                if (
                    conceptMatches.length === 0
                ) {

                    missingPoints.push(
                        ...reference.concepts
                            .slice(0, 3)
                    );
                }

                /* ---------- SPECIFIC FACT CHECKS ---------- */

                if (
                    cleanQuestion.includes(
                        "tcp"
                    ) &&
                    cleanQuestion.includes(
                        "udp"
                    )
                ) {

                    if (
                        cleanAnswer.includes(
                            "reliable"
                        ) &&
                        cleanAnswer.includes(
                            "connectionless"
                        )
                    ) {

                        technicalCorrectness += 15;

                    } else {

                        weaknesses.push(
                            "Mention TCP reliability and UDP's connectionless nature."
                        );
                    }
                }

                if (
                    cleanQuestion.includes(
                        "dns"
                    )
                ) {

                    if (
                        cleanAnswer.includes(
                            "ip"
                        ) &&
                        (
                            cleanAnswer.includes(
                                "domain"
                            ) ||
                            cleanAnswer.includes(
                                "name"
                            )
                        )
                    ) {

                        technicalCorrectness += 15;

                    } else {

                        weaknesses.push(
                            "Explain that DNS maps domain names to IP addresses."
                        );
                    }
                }

                if (
                    cleanQuestion.includes(
                        "acid"
                    )
                ) {

                    const acidCount = [

                        "atomicity",
                        "consistency",
                        "isolation",
                        "durability"

                    ].filter(
                        (word) =>
                            cleanAnswer.includes(
                                word
                            )
                    ).length;

                    if (
                        acidCount >= 3
                    ) {

                        technicalCorrectness += 20;

                        technicalDepth += 15;

                    } else {

                        missingPoints.push(
                            "Atomicity, Consistency, Isolation and Durability"
                        );
                    }
                }

                if (
                    cleanQuestion.includes(
                        "polymorphism"
                    )
                ) {

                    if (
                        cleanAnswer.includes(
                            "overriding"
                        ) ||
                        cleanAnswer.includes(
                            "overloading"
                        ) ||
                        cleanAnswer.includes(
                            "different behavior"
                        )
                    ) {

                        technicalCorrectness += 20;

                    } else {

                        missingPoints.push(
                            "Explain that polymorphism allows different behavior through a common interface."
                        );
                    }
                }

                /* ---------- CONTRADICTIONS ---------- */

                if (
                    cleanQuestion.includes(
                        "tcp"
                    ) &&
                    cleanQuestion.includes(
                        "udp"
                    )
                ) {

                    if (
                        cleanAnswer.includes(
                            "udp is reliable"
                        ) ||
                        cleanAnswer.includes(
                            "udp guarantees delivery"
                        )
                    ) {

                        contradictionResults.push(
                            "UDP does not guarantee reliable delivery."
                        );
                    }

                    if (
                        cleanAnswer.includes(
                            "tcp is connectionless"
                        )
                    ) {

                        contradictionResults.push(
                            "TCP is connection-oriented."
                        );
                    }
                }

                if (
                    cleanQuestion.includes(
                        "dns"
                    ) &&
                    (
                        cleanAnswer.includes(
                            "dns creates ip"
                        ) ||
                        cleanAnswer.includes(
                            "dns changes domain"
                        )
                    )
                ) {

                    contradictionResults.push(
                        "DNS resolves names to network addresses; it does not create IP addresses."
                    );
                }
            }

            /* ---------- ANSWER QUALITY ---------- */

            if (
                words.length >= 8
            ) {

                clarity += 15;

                structure += 20;
            }

            if (
                words.length >= 20
            ) {

                technicalDepth += 10;

                structure += 10;
            }

            if (
                words.length >= 35
            ) {

                technicalDepth += 10;
            }

            if (
                /because|therefore|for example|such as|first|second|finally/
                    .test(
                        cleanAnswer
                    )
            ) {

                structure += 15;
            }

            if (
                cleanAnswer.includes(
                    "for example"
                ) ||
                cleanAnswer.includes(
                    "example"
                )
            ) {

                technicalDepth += 10;

                strengths.push(
                    "An example or supporting explanation was included."
                );
            }

            /* ---------- UNRELATED ANSWER ---------- */

            if (
                relevance < 45
            ) {

                return res.json({

                    success: true,

                    score: 0,

                    answerValidity:
                        "Unrelated",

                    relevance: 0,

                    technicalCorrectness: 0,

                    technicalDepth: 0,

                    clarity: Math.min(
                        100,
                        clarity
                    ),

                    structure: Math.min(
                        100,
                        structure
                    ),

                    feedback:
                        "Answer is unrelated to the question.",

                    strengths: [],

                    weaknesses: [
                        "The response does not address the asked question."
                    ],

                    missingPoints:
                        reference
                            ? reference.concepts.slice(
                                0,
                                3
                            )
                            : [],

                    recommendations: [
                        "Read the question carefully and answer the specific technical concept being asked."
                    ],

                    contradictionResults: [],

                    question,

                    answer,

                    role:
                        role ||
                        "Software Developer",

                    difficulty:
                        difficulty ||
                        "Beginner",

                    area:
                        area ||
                        "Core CS",

                    previousQuestions:
                        previousQuestions || [],

                    resumeContext:
                        resumeContext || ""
                });
            }

            /* ---------- CLAMP ---------- */

            relevance =
                Math.max(
                    0,
                    Math.min(
                        100,
                        relevance
                    )
                );

            technicalCorrectness =
                Math.max(
                    0,
                    Math.min(
                        100,
                        technicalCorrectness
                    )
                );

            technicalDepth =
                Math.max(
                    0,
                    Math.min(
                        100,
                        technicalDepth
                    )
                );

            clarity =
                Math.max(
                    0,
                    Math.min(
                        100,
                        clarity
                    )
                );

            structure =
                Math.max(
                    0,
                    Math.min(
                        100,
                        structure
                    )
                );

            /* ---------- VALIDITY ---------- */

            let answerValidity =
                "Partially Correct";

            if (
                contradictionResults.length > 0
            ) {

                answerValidity =
                    "Technically Incorrect";

            } else if (
                relevance >= 65 &&
                technicalCorrectness >= 65
            ) {

                answerValidity =
                    "Correct";
            }

            /* ---------- SCORE ---------- */

            let score =
                Math.round(
                    (
                        relevance * 0.25 +
                        technicalCorrectness * 0.30 +
                        technicalDepth * 0.20 +
                        clarity * 0.15 +
                        structure * 0.10
                    )
                );

            if (
                answerValidity ===
                "Technically Incorrect"
            ) {

                score =
                    Math.min(
                        score,
                        35
                    );
            }

            if (
                contradictionResults.length > 0
            ) {

                score =
                    Math.min(
                        score,
                        35
                    );
            }

            if (
                answerValidity ===
                "Partially Correct"
            ) {

                score =
                    Math.min(
                        score,
                        75
                    );
            }

            score =
                Math.max(
                    0,
                    Math.min(
                        100,
                        score
                    )
                );

            /* ---------- FEEDBACK ---------- */

            if (
                relevance >= 70
            ) {

                strengths.push(
                    "Answer is relevant to the question."
                );

            } else {

                weaknesses.push(
                    "Make the answer more directly related to the question."
                );
            }

            if (
                technicalCorrectness >= 70
            ) {

                strengths.push(
                    "Technical concepts are mostly correct."
                );

            } else {

                weaknesses.push(
                    "Add more technically accurate concepts."
                );
            }

            if (
                technicalDepth >= 70
            ) {

                strengths.push(
                    "Good technical depth."
                );

            } else {

                weaknesses.push(
                    "Explain the concept with more technical detail."
                );
            }

            if (
                clarity >= 70
            ) {

                strengths.push(
                    "Answer is reasonably clear."
                );

            } else {

                weaknesses.push(
                    "Use shorter and clearer sentences."
                );
            }

            if (
                structure >= 70
            ) {

                strengths.push(
                    "Answer has a useful structure."
                );

            } else {

                weaknesses.push(
                    "Structure the answer using definition, explanation and example."
                );
            }

            if (
                contradictionResults.length > 0
            ) {

                weaknesses.push(
                    ...contradictionResults
                );
            }

            if (
                missingPoints.length > 0
            ) {

                recommendations.push(
                    "Cover these missing points: " +
                    missingPoints
                        .slice(0, 4)
                        .join("; ")
                );
            }

            if (
                recommendations.length === 0
            ) {

                recommendations.push(
                    "Keep answers concise, technically accurate and supported with examples."
                );
            }

            let feedback =
                "Good effort.";

            if (
                answerValidity ===
                "Correct"
            ) {

                feedback =
                    "Good answer. The response is relevant and covers important technical concepts.";

            } else if (
                answerValidity ===
                "Technically Incorrect"
            ) {

                feedback =
                    "The answer contains technical inaccuracies. Review the core concept and correct the identified points.";

            } else {

                feedback =
                    "The answer has some relevant content but needs more technical depth and accuracy.";
            }

            return res.json({

                success: true,

                score,

                answerValidity,

                relevance,

                technicalCorrectness,

                technicalDepth,

                clarity,

                structure,

                feedback,

                strengths,

                weaknesses,

                missingPoints,

                recommendations,

                contradictionResults,

                question,

                answer,

                role:
                    role ||
                    "Software Developer",

                difficulty:
                    difficulty ||
                    "Beginner",

                area:
                    area ||
                    "Core CS",

                previousQuestions:
                    previousQuestions || [],

                resumeContext:
                    resumeContext || ""
            });

        } catch (error) {

            console.error(
                "Interview evaluation error:",
                error
            );

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Interview evaluation failed.",

                    error:
                        error.message
                });
        }
    }
);

/* =========================
   404 HANDLER
========================= */

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API route not found"
        });
    }
);

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:",
            error
        );

        if (
            error instanceof multer.MulterError
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        error.message
                });
        }

        return res
            .status(500)
            .json({

                success: false,

                message:
                    error.message ||
                    "Internal server error."
            });
    }
);

/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    () => {

        console.log(
            `Backend server running at http://localhost:${PORT}`
        );
    }
);