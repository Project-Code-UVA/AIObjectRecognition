const CHAT_ENDPOINT = 'https://api-inference.huggingface.co/models/meta-llama/Llama-2-13b-chat-hf';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig.extra.HUGGINGFACE_API_KEY;

export async function chatWithImage(context, message) {
  const systemPrompt = `You are an assistant helping a visually impaired user. The image is described as: "${context.gemmaDescription}". The main object is: "${context.objectLabel}". Answer questions about this image.`;
  const payload = {
    inputs: {
      past_user_inputs: [],
      generated_responses: [],
      text: message,
    },
    parameters: {
      system_prompt: systemPrompt,
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
      if (res.data && typeof res.data.generated_text === 'string') {
        return res.data.generated_text.trim();
      }
      if (Array.isArray(res.data) && res.data[0]?.generated_text) {
        return res.data[0].generated_text.trim();
      }
      throw new Error('No AI reply');
    } catch (err) {
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