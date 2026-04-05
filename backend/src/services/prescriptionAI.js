/**
 * AI Prescription Reading Service
 * Uses Google Gemini Vision API to extract medicine details from prescription images.
 * Falls back to a demo mode if no API key is configured.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini only if API key is available
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('✅ AI Prescription Reading: Gemini API initialized');
} else {
  console.log('⚠️  AI Prescription Reading: No GEMINI_API_KEY set, running in demo mode');
}

/**
 * The prompt that tells Gemini exactly what to extract from the prescription image.
 * Optimized for Indian pharmacy prescriptions.
 */
const EXTRACTION_PROMPT = `You are an expert pharmacist AI assistant in India. Analyze this prescription image carefully and extract ALL medicines mentioned.

For EACH medicine found, provide:
1. medicine_name: The BRAND NAME exactly as written on the prescription (e.g., "Zocon 200", "Dolo 650", "Augmentin 625"). Use the brand name as primary — do NOT replace it with the generic/molecule name.
2. dosage: Strength/dosage as written (e.g., "200mg", "250", "10mg/5ml")
3. frequency: How often to take (e.g., "twice daily", "once at night", "thrice daily")
4. duration_days: Number of days prescribed (estimate 7 if not clear)
5. quantity: Total quantity to dispense (estimate based on frequency × duration if not written)
6. instructions: Any special instructions (e.g., "after food", "before breakfast", "with water")

Also extract:
- doctor_name: Doctor's name if visible
- hospital_name: Hospital/clinic name if visible
- diagnosis: Diagnosis or condition if mentioned
- prescription_date: Date on prescription if visible (format: YYYY-MM-DD)

IMPORTANT RULES:
- ALWAYS keep brand names as primary. Indian doctors write brand names, not molecule names.
- If text is handwritten and hard to read, make your best guess and note confidence
- Include ALL medicines, even vitamins, supplements, creams, and topical applications
- Provide handwriting_confidence score (0.0 to 1.0) for readability assessment
- If you cannot read the prescription at all, return an empty medicines array

Respond ONLY with valid JSON in this exact format:
{
  "doctor_name": "Dr. Name" or null,
  "hospital_name": "Hospital Name" or null,
  "diagnosis": "Condition" or null,
  "prescription_date": "YYYY-MM-DD" or null,
  "confidence": 0.0 to 1.0,
  "handwriting_confidence": 0.0 to 1.0,
  "medicines": [
    {
      "medicine_name": "Brand Name as written",
      "dosage": "500mg",
      "frequency": "twice daily",
      "duration_days": 7,
      "quantity": 14,
      "instructions": "after food"
    }
  ]
}`;

/**
 * Read a prescription image and extract medicines using Gemini Vision AI
 * @param {string} imagePath - Path to the prescription image file
 * @returns {Object} Extracted prescription data
 */
async function readPrescriptionFromFile(imagePath) {
  if (!model) {
    console.log('AI: No Gemini API key, using demo extraction');
    return getDemoExtraction();
  }

  try {
    // Read image file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Determine MIME type from extension
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    return await readPrescriptionFromBase64(base64Image, mimeType);
  } catch (error) {
    console.error('AI: Error reading prescription from file:', error);
    throw new Error('Failed to process prescription image');
  }
}

/**
 * Read a prescription from base64-encoded image data
 * @param {string} base64Data - Base64 encoded image (without data URL prefix)
 * @param {string} mimeType - Image MIME type
 * @returns {Object} Extracted prescription data
 */
async function readPrescriptionFromBase64(base64Data, mimeType = 'image/jpeg') {
  if (!model) {
    console.log('AI: No Gemini API key, using demo extraction');
    return getDemoExtraction();
  }

  try {
    // Strip data URL prefix if present
    let cleanBase64 = base64Data;
    if (base64Data.includes(',')) {
      cleanBase64 = base64Data.split(',')[1];
    }

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType,
      },
    };

    console.log('AI: Sending prescription to Gemini for analysis...');
    const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log('AI: Received response from Gemini');

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const extracted = JSON.parse(jsonStr);

    // Validate the response structure
    if (!extracted.medicines || !Array.isArray(extracted.medicines)) {
      extracted.medicines = [];
    }

    // Ensure each medicine has required fields with defaults
    extracted.medicines = extracted.medicines.map((med, index) => ({
      medicine_name: med.medicine_name || `Unknown Medicine ${index + 1}`,
      dosage: med.dosage || 'unknown',
      frequency: med.frequency || 'once daily',
      duration_days: med.duration_days || 7,
      quantity: med.quantity || 10,
      instructions: med.instructions || '',
    }));

    extracted.confidence = extracted.confidence || 0.8;
    extracted.handwriting_confidence = extracted.handwriting_confidence || 0.7;

    return extracted;
  } catch (error) {
    console.error('AI: Error extracting prescription:', error.message);
    throw new Error('Failed to extract prescription data');
  }
}

/**
 * Demo extraction for testing without API key
 */
function getDemoExtraction() {
  return {
    doctor_name: 'Dr. Rajesh Kumar',
    hospital_name: 'Apollo Hospitals',
    diagnosis: 'Type 2 Diabetes Mellitus',
    prescription_date: new Date().toISOString().split('T')[0],
    confidence: 0.85,
    handwriting_confidence: 0.75,
    demo_mode: true,
    medicines: [
      {
        medicine_name: 'Metformin 500mg',
        dosage: '500mg',
        frequency: 'twice daily',
        duration_days: 30,
        quantity: 60,
        instructions: 'after food',
      },
      {
        medicine_name: 'Aspirin 75mg',
        dosage: '75mg',
        frequency: 'once daily',
        duration_days: 30,
        quantity: 30,
        instructions: 'once in the evening',
      },
      {
        medicine_name: 'Atorvastatin 10mg',
        dosage: '10mg',
        frequency: 'once daily',
        duration_days: 30,
        quantity: 30,
        instructions: 'at bedtime',
      },
    ],
  };
}

module.exports = {
  readPrescriptionFromFile,
  readPrescriptionFromBase64,
  getDemoExtraction,
};
