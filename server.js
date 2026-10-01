require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");

const app = express();

const PORT = 5000;


/* ================================
   MIDDLEWARE
================================ */

app.use(cors());

app.use(express.json());


/* ================================
   FILE UPLOAD
================================ */

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


/* ================================
   HOME ROUTE
================================ */

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "AI Interview Assistant Backend is running 🚀"

    });

});


/* ================================
   TEST API
================================ */

app.get("/api/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Backend API connected successfully 🤖"

    });

});


/* ================================
   INTERVIEW API
================================ */

app.post("/api/interview", (req, res) => {

    const {
        question,
        answer,
        role,
        difficulty
    } = req.body;


    if (!question || !answer) {

        return res.status(400).json({

            success: false,

            message:
                "Question and answer are required."

        });

    }


    const answerLength =
        answer.trim().length;


    let score = 40;


    if (answerLength >= 80) {

        score += 20;

    }

    else if (answerLength >= 40) {

        score += 10;

    }


    const interviewKeywords = [

        "project",
        "skills",
        "experience",
        "learning",
        "problem",
        "team",
        "communication",
        "technology",
        "goal",
        "career"

    ];


    const lowerAnswer =
        answer.toLowerCase();


    let matchedKeywords = 0;


    interviewKeywords.forEach(
        function(keyword) {

            if (
                lowerAnswer.includes(
                    keyword
                )
            ) {

                matchedKeywords++;

            }

        }
    );


    score +=
        matchedKeywords * 5;


    if (score > 100) {

        score = 100;

    }


    let strength;

    let improvement;


    if (score >= 80) {

        strength =
            "Your answer is detailed, relevant and well structured.";

        improvement =
            "Add measurable results and specific examples to make it even stronger.";

    }

    else if (score >= 60) {

        strength =
            "Your answer has a good direction and includes relevant points.";

        improvement =
            "Add more specific examples and explain your contribution clearly.";

    }

    else {

        strength =
            "You attempted the interview question successfully.";

        improvement =
            "Give a more detailed answer and include relevant examples from your projects, skills or experience.";

    }


    res.json({

        success: true,

        role:
            role || "Not specified",

        difficulty:
            difficulty || "Not specified",

        question:

            question,

        score:

            score,

        strength:

            strength,

        improvement:

            improvement,

        message:

            "Interview answer evaluated successfully 🤖"

    });

});


/* ================================
   RESUME ANALYZER API
================================ */

app.post(
    "/api/resume",
    upload.single("resume"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please upload a PDF resume."

                });

            }


            const jobRole =
                req.body.jobRole ||
                "Software Developer";


            /* ============================
               CHECK FILE TYPE
            ============================ */

            if (
                req.file.mimetype !==
                "application/pdf"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Only PDF resumes are supported."

                });

            }


            /* ============================
               EXTRACT PDF TEXT
            ============================ */

            const parser = new PDFParse({
    data: req.file.buffer
});

const pdfData = await parser.getText();

const resumeText =
    pdfData.text || "";

await parser.destroy();


            const text =
                resumeText.toLowerCase();


            /* ============================
               SKILL DATABASE
            ============================ */

            const skillList = [

                "java",
                "python",
                "javascript",
                "html",
                "css",
                "sql",
                "react",
                "node.js",
                "express",
                "mongodb",
                "git",
                "github",
                "dsa",
                "data structures",
                "algorithms",
                "machine learning",
                "tensorflow",
                "power bi",
                "excel",
                "communication"

            ];


            const detectedSkills = [];


            skillList.forEach(
                function(skill) {

                    if (
                        text.includes(
                            skill.toLowerCase()
                        )
                    ) {

                        detectedSkills.push(
                            skill
                        );

                    }

                }
            );


            /* ============================
               ROLE BASED SKILLS
            ============================ */

            const roleSkills = {

                "Software Developer": [

                    "dsa",
                    "java",
                    "python",
                    "sql",
                    "git"

                ],

                "Frontend Developer": [

                    "html",
                    "css",
                    "javascript",
                    "react",
                    "git"

                ],

                "Backend Developer": [

                    "java",
                    "node.js",
                    "express",
                    "sql",
                    "mongodb"

                ],

                "Data Analyst": [

                    "python",
                    "sql",
                    "excel",
                    "power bi"

                ],

                "AI/ML Engineer": [

                    "python",
                    "machine learning",
                    "tensorflow",
                    "sql"

                ]

            };


            const requiredSkills =
                roleSkills[jobRole] ||
                roleSkills["Software Developer"];


            const missingSkills =
                requiredSkills.filter(
                    function(skill) {

                        return !detectedSkills
                            .map(
                                function(item) {

                                    return item.toLowerCase();

                                }
                            )
                            .includes(
                                skill.toLowerCase()
                            );

                    }
                );


            /* ============================
               RESUME SCORE
            ============================ */

            let score = 40;


            /* Skills */

            score +=
                Math.min(
                    detectedSkills.length * 5,
                    30
                );


            /* Resume length */

            if (
                resumeText.length >= 1000
            ) {

                score += 15;

            }

            else if (
                resumeText.length >= 500
            ) {

                score += 10;

            }

            else if (
                resumeText.length >= 200
            ) {

                score += 5;

            }


            /* Role matching */

            const matchingSkills =
                requiredSkills.filter(
                    function(skill) {

                        return detectedSkills
                            .map(
                                function(item) {

                                    return item.toLowerCase();

                                }
                            )
                            .includes(
                                skill.toLowerCase()
                            );

                    }
                );


            if (
                matchingSkills.length >=
                Math.ceil(
                    requiredSkills.length / 2
                )
            ) {

                score += 15;

            }


            if (score > 100) {

                score = 100;

            }


            /* ============================
               RECOMMENDATIONS
            ============================ */

            let recommendedSkills;


            if (
                missingSkills.length > 0
            ) {

                recommendedSkills =
                    missingSkills.join(" • ");

            }

            else {

                recommendedSkills =
                    "Your resume covers the main skills for this role.";

            }


            /* ============================
               SUGGESTIONS
            ============================ */

            let suggestions =
                [];


            if (
                resumeText.length < 500
            ) {

                suggestions.push(
                    "Add more project details and achievements."
                );

            }


            if (
                detectedSkills.length < 4
            ) {

                suggestions.push(
                    "Add more relevant technical skills."
                );

            }


            if (
                !text.includes("project")
            ) {

                suggestions.push(
                    "Add a dedicated Projects section."
                );

            }


            if (
                !text.includes("education")
            ) {

                suggestions.push(
                    "Add or improve your Education section."
                );

            }


            if (
                suggestions.length === 0
            ) {

                suggestions.push(
                    "Keep your resume focused on the target role and highlight measurable achievements."
                );

            }


            /* ============================
               RESPONSE
            ============================ */

            res.json({

                success: true,

                jobRole:

                    jobRole,

                score:

                    score,

                skills:

                    detectedSkills.length > 0
                        ? detectedSkills
                        : ["No technical skills detected"],

                recommendedSkills:

                    recommendedSkills,

                suggestions:

                    suggestions.join(" "),

                message:

                    "Resume analyzed successfully 🤖"

            });

        }

        catch (error) {

            console.error(
                "Resume Analysis Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to analyze the resume."

            });

        }

    }
);


/* ================================
   START SERVER
================================ */

app.listen(
    PORT,
    () => {

        console.log(
            `Backend server running at http://localhost:${PORT}`
        );

    }
);