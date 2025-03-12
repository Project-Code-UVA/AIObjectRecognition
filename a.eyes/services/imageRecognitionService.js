import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Models for image analysis
const IMAGE_CAPTION_MODEL = 'Xenova/vit-gpt2-image-captioning';
const OBJECT_DETECTION_MODEL = 'facebook/detr-resnet-50';

export const analyzeImage = async (imageBase64) => {
  console.log('Preparing image for analysis...');
  
  try {
    // Remove data:image/jpeg;base64, prefix if present
    let base64Data = imageBase64;
    if (base64Data.startsWith('data:image/jpeg;base64,')) {
      base64Data = base64Data.split('data:image/jpeg;base64,')[1];
    }
    
    console.log('Sending image to Hugging Face API...');
    
    // Load API key from environment variables
    const API_KEY = process.env.HUGGING_FACE_API_KEY;
    
    // Try image captioning first
    try {
      const response = await axios({
        method: 'post',
        url: `https://api-inference.huggingface.co/models/${IMAGE_CAPTION_MODEL}`,
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        data: { inputs: base64Data },
        timeout: 15000, 
      });

      if (response.status === 200 && response.data) {
        console.log('Successfully received analysis:', response.data);
        
        // Handle different response formats
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
    } catch (captionError) {
      console.log('Caption model failed, trying object detection:', captionError.message);
      // Continue to object detection on error
    }
    
    // Fallback to object detection if captioning fails
    const objResponse = await axios({
      method: 'post',
      url: `https://api-inference.huggingface.co/models/${OBJECT_DETECTION_MODEL}`,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: { inputs: base64Data },
      timeout: 15000,
    });
    
    if (objResponse.status === 200 && objResponse.data) {
      console.log('Successfully received object detection');
      
      // Process object detection results
      const objects = Array.isArray(objResponse.data) 
        ? objResponse.data.map(obj => ({
            label: obj.label || obj.class || 'object',
            confidence: obj.score || obj.confidence || 0.5,
            box: obj.box
          }))
        : [];
      
      // Generate description from detected objects
      let description = generateDescriptionFromObjects(objects);
      
      return {
        description,
        objects,
        confidence: objects.length > 0 ? objects[0].confidence : 0
      };
    }
    
    throw new Error('Both models failed to produce results');
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

// Helper function to generate descriptions from objects
function generateDescriptionFromObjects(objects) {
  if (!objects || objects.length === 0) {
    return "I don't see any recognizable objects in this image.";
  }
  
  // Only include higher confidence detections
  const significantObjects = objects.filter(obj => obj.confidence > 0.3);
  
  if (significantObjects.length === 0) {
    return "There might be some objects in this image, but I'm not confident about what they are.";
  }
  
  // Group similar objects
  const objectCounts = {};
  significantObjects.forEach(obj => {
    objectCounts[obj.label] = (objectCounts[obj.label] || 0) + 1;
  });
  
  // Create description
  const objectPhrases = Object.entries(objectCounts).map(([label, count]) => {
    if (count === 1) return `a ${label}`;
    return `${count} ${label}s`;
  });
  
  if (objectPhrases.length === 1) {
    return `I see ${objectPhrases[0]} in this image.`;
  }
  
  const lastObject = objectPhrases.pop();
  return `I see ${objectPhrases.join(', ')} and ${lastObject} in this image.`;
}

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