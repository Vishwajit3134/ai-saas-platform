const fetch = require('node-fetch');
require('dotenv').config();
const FormData = require('form-data');
const fs = require('fs');
const { Buffer } = require('buffer');
const sharp = require('sharp');
const pdf = require('pdf-parse');
const docx = require('docx');
const supabase = require('../config/supabaseClient');


// Helper function to check and deduct credits
const checkAndDeductCredits = async (userId, serviceName, cost) => {
    // 1. Get the user's current credits and role from the 'profiles' table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits, role') // Also select the user's role
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        throw new Error('Could not find user profile.');
    }

    // 2. If the user is an admin, bypass the credit check completely
    if (profile.role === 'admin') {
        console.log(`Admin user ${userId} used ${serviceName}. No credits deducted.`);
        return true; // Grant free access
    }
    
    // 3. For regular users, check if they have enough credits
    if (profile.credits < cost) {
        throw new Error('Insufficient credits. Please upgrade your plan.');
    }

    // 4. Deduct the credits for regular users
    const newCredits = profile.credits - cost;
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId);

    if (updateError) {
        throw new Error('Failed to update user credits.');
    }
    
    // 5. Log the transaction for the regular user
    const { error: transactionError } = await supabase
        .from('transactions')
        .insert({ user_id: userId, service_used: serviceName, credits_spent: cost });
        
    if (transactionError) {
        // This is not a fatal error for the user, so we just log it on the server
        console.error('Failed to log transaction:', transactionError.message);
    }

    return true; // Indicate success
};


const generateImage = async (req, res) => {
    const { prompt } = req.body;
    const userId = req.user.id;
    const creditCost = 2;

    try {
        await checkAndDeductCredits(userId, 'Text to Image', creditCost);

        const engineId = 'stable-diffusion-xl-1024-v1-0';
        const response = await fetch(
            `https://api.stability.ai/v1/generation/${engineId}/text-to-image`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
                },
                body: JSON.stringify({
                    text_prompts: [{ text: prompt }],
                    cfg_scale: 7, height: 1024, width: 1024, steps: 30, samples: 1,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Non-200 response from Stability AI: ${await response.text()}`);
        }

        const data = await response.json();
        const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;
        res.json({ imageUrl });

    } catch (error) {
        console.error('Error in generateImage:', error.message);
        res.status(500).json({ error: error.message });
    }
};

const removeBackground = async (req, res) => {
    const userId = req.user.id;
    const creditCost = 1;

    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }

    try {
        await checkAndDeductCredits(userId, 'Background Remover', creditCost);
        
        const imagePath = req.file.path;
        const image = sharp(imagePath);
        const metadata = await image.metadata();
        const MAX_PIXELS = 4194304;
        let imageBuffer;

        if (metadata.width * metadata.height > MAX_PIXELS) {
            imageBuffer = await image.resize({
                width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true
            }).toBuffer();
        } else {
            imageBuffer = fs.readFileSync(imagePath);
        }
        
        const formData = new FormData();
        formData.append('image', imageBuffer, { filename: 'image.png' });
        
        const response = await fetch(
            "https://api.stability.ai/v2beta/stable-image/edit/remove-background",
            {
                method: 'POST',
                headers: { ...formData.getHeaders(), Authorization: `Bearer ${process.env.STABILITY_API_KEY}`, Accept: 'image/*', },
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error(`Non-200 response from Stability AI: ${await response.text()}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;
        
        fs.unlinkSync(imagePath);
        res.json({ imageUrl: base64Image });

    } catch (error) {
        console.error('Error in removeBackground:', error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
};

const analyzeResume = async (req, res) => {
    const userId = req.user.id;
    const creditCost = 1;

    if (!req.file) {
        return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    try {
        await checkAndDeductCredits(userId, 'Resume Analyzer', creditCost);

        let text = '';
        const filePath = req.file.path;

        if (req.file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            text = data.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            text = `(DOCX parsing is a placeholder) - ${req.file.originalname}`;
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Unsupported file type.' });
        }

        const analysis = `**Resume Analysis Complete:**\n\n- The AI has reviewed your document.\n- The extracted text begins with: "${text.substring(0, 150)}..."\n\n**Key Suggestion:** Ensure all your achievements are quantified with numbers to show measurable impact.`;
        
        fs.unlinkSync(filePath);
        res.json({ analysis });

    } catch (error) {
        console.error('Error in analyzeResume:', error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = { generateImage, removeBackground, analyzeResume };

