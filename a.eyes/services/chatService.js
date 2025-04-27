const CHAT_ENDPOINT = 'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta'; // google/gemma-7-it is good alt
import Constants from 'expo-constants';
import axios from 'axios';

const API_KEY = Constants.expoConfig.extra.HUGGINGFACE_API_KEY;

export async function chatWithImage(context, message) {
  const systemPrompt = `You are an assistant helping a visually impaired user. The image is described as: "${context.gemmaDescription}". The main object is: "${context.objectLabel}". Answer questions about this image.`;
  const payload = {
    inputs: `${systemPrompt}\nUser: ${message}`,
    parameters: {
      max_new_tokens: 256,
      temperature: 0.7,
    }
  };

  let attempt = 0;
  let delay = 1000;
  while (attempt < 3) {
    try {
      const res = await axios.post(
        CHAT_ENDPOINT,
        payload,
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );
      let aiText = '';
      if (res.data && typeof res.data.generated_text === 'string') {
        aiText = res.data.generated_text;
      } else if (Array.isArray(res.data) && res.data[0]?.generated_text) {
        aiText = res.data[0].generated_text;
      } else {
        throw new Error('No AI reply');
      }
      // Extract only the AI's response after the last "User:" or "user:" or "Assistant:" or "assistant:"
      const match = aiText.match(/(?:Assistant:|assistant:)([\s\S]*)$/);
      if (match && match[1]) {
        return match[1].trim();
      }
      // Fallback: remove everything before the last user message
      const lastUserIdx = aiText.lastIndexOf(`User: ${message}`);
      if (lastUserIdx !== -1) {
        return aiText.slice(lastUserIdx + (`User: ${message}`).length).trim();
      }
      // If all else fails, return the whole text trimmed
      return aiText.trim();
    } catch (err) {
      console.error('chatWithImage error:', err?.response?.data || err.message || err);
      if (err.response && err.response.status === 429 || err.code === 'ECONNABORTED') {
        attempt++;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error('Failed to get AI reply after retries');
}