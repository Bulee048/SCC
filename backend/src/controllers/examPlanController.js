import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const generateExamPlan = async (req, res) => {
  try {
    // 1. Frontend එකෙන් එන දත්ත බලාගැනීමට log එකක් දාමු (පරීක්ෂා කිරීමට පහසුයි)
    console.log("Received data from Frontend:", req.body);

    // 2. දත්ත ලබා ගැනීම (Frontend එකෙන් එන විදිහටම අල්ලගමු)
    // සමහරවිට 'subjects' කියන එක string එකක් වෙන්නත් පුළුවන්, array එකක් වෙන්නත් පුළුවන්
    const { 
      subjects, 
      examDate, 
      availableHoursPerDay, 
      userPreferences,
      // Frontend එකේ "Coverage Topics" (EER කියලා ගහපු එක) එන්නේ වෙන නමකින් නම් ඒකත් ගමු
      topics 
    } = req.body;

    // 3. Subjects එක String එකක් විදිහට හදාගැනීම (join error එක නැති කිරීමට)
    let subjectsString = "Selected Subjects"; // Default අගයක්
    
    if (Array.isArray(subjects)) {
        subjectsString = subjects.join(', '); // Array එකක් නම් join කරනවා
    } else if (typeof subjects === 'string') {
        subjectsString = subjects; // String එකක් නම් ඒකම ගන්නවා
    } else if (req.body.moduleName || req.body.moduleId) {
        // Frontend එකේ "MODULE ID & NAME" එකෙන් එන දත්ත
        subjectsString = `${req.body.moduleId || ''} ${req.body.moduleName || ''}`.trim();
    }

    // 4. Prompt එක
    const prompt = `
      Create a personalized study plan for an upcoming exam on ${examDate || "a future date"}. 
      The student is studying the following subjects/modules: ${subjectsString}.
      Coverage Topics: ${topics || "General syllabus"}.
      They have ${availableHoursPerDay || 4} hours available per day.
      Preferences: ${userPreferences || "Focus on key concepts"}.
      
      Generate a mind map style study plan in JSON format. The output MUST be a strict JSON object with the following structure:
      {
        "id": "root",
        "type": "main",
        "data": { "label": "Exam Study Plan" },
        "position": { "x": 0, "y": 0 },
        "children": [
          {
            "id": "subject1",
            "type": "subject",
            "data": { "label": "Subject 1" },
            "position": { "x": 200, "y": -100 },
            "children": [
              { "id": "topic1", "type": "topic", "data": { "label": "Topic 1" }, "position": { "x": 400, "y": -150 } }
            ]
          }
        ]
      }
      Use unique IDs for all nodes. Return strictly valid JSON.
    `;

    // 5. DeepSeek API Call එක
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful study planner assistant that generates structured data for mind maps. You must return ONLY a JSON object." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" }
    });

    // 6. JSON දත්ත සකසා යැවීම
    const mindMapData = JSON.parse(response.choices[0].message.content);

    res.status(200).json({
      success: true,
      data: mindMapData,
    });

  } catch (error) {
    console.error("DeepSeek Error Details:", error);
    res.status(500).json({
      success: false,
      message: "Study plan එක generate කිරීමට අපොහොසත් විය.",
      error: error.message // Frontend එකට error එකේ නම යවනවා බලන්න ලේසි වෙන්න
    });
  }
};