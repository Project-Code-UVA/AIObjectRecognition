import axios from 'axios';
import Config from 'react-native-config';

const GEMMA_MODEL = 'Salesforce/blip-image-captioning-base';
const API_KEY = '';

export const analyzeImage = async (imageBase64) => {
  console.log('Preparing image for analysis...');

  try {
    // Remove data:image/jpeg;base64, prefix if present
    let base64Data = imageBase64;
    if (base64Data.startsWith('data:image/jpeg;base64,')) {
      base64Data = base64Data.split('data:image/jpeg;base64,')[1];
    }

    console.log('Sending image to Hugging Face Inference API...');

    // Use Hugging Face Inference API with the Gemma model
    const response = await axios({
      method: 'post',
      url: `https://api-inference.huggingface.co/models/${GEMMA_MODEL}`,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        inputs: base64Data
      },
      timeout: 20000,
    });

    if (response.status === 200 && response.data) {
      console.log('Successfully received analysis:', response.data);

      // Handle response format
      let description = '';
      if (typeof response.data === 'string') {
        description = response.data;
      } else if (Array.isArray(response.data) && response.data[0]?.generated_text) {
        description = response.data[0].generated_text;
      } else if (response.data.generated_text) {
        description = response.data.generated_text;
      } else {
        description = "I see an image, but I'm not sure what it contains.";
      }

      // Clean up description
      description = description.replace(/^[Aa]n? image of/, "I see");
      description = description.charAt(0).toUpperCase() + description.slice(1);

      return {
        description,
        objects: [],
        confidence: 0.7
      };
    }

    throw new Error('Model failed to produce results');
  } catch (error) {
    console.error('Error during image analysis:', error.message);
    if (error.response) {
      console.log('API Error details:', JSON.stringify(error.response.data));
    }

    // Return graceful error with specific message
    return {
      description: `I couldn't analyze this image. ${getErrorMessage(error)}`,
      objects: [],
      confidence: 0
    };
  }
};

// Helper function for user-friendly error messages
function getErrorMessage(error) {
  if (error.response) {
    const status = error.response.status;

    if (status === 401 || status === 403) {
      return "The image analysis service requires authentication.";
    } else if (status === 429) {
      return "We've reached the limit of images we can analyze right now. Please try again later.";
    } else if (status === 503 || status === 502) {
      return "The image analysis service is temporarily unavailable.";
    } else if (status === 413) {
      return "The image is too large to analyze.";
    }
  }

  if (error.code === 'ECONNABORTED') {
    return "The analysis took too long. Try again with a simpler image.";
  }

  return "There was a problem with the image analysis service. Please try again.";
}