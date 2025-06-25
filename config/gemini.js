const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the generative model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to analyze multiple YouTube channel images
const analyzeMultipleYouTubeImages = async (imageBuffers, imageUrls) => {
  try {
    // Convert all buffers to base64
    const imageParts = imageBuffers.map((buffer, index) => ({
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: "image/jpeg" // Adjust based on your image type
      }
    }));

    // Create comprehensive prompt for multiple images
    const prompt = `
    Analyze these ${imageBuffers.length} YouTube channel screenshots. Each image contains different information about the same YouTube channel. 
    Combine all the information from all images to create a complete analysis.
    
    Pay special attention to any warnings, strikes, or policy violations that might be visible in the screenshots.
    
    Return ONLY valid JSON without any markdown formatting, code blocks, or extra text:
    
    {
      "channelName": "Channel name",
      "subscriberCount": "Number of subscribers (e.g., '1.2M', '500K')",
      "totalViews": "Total views (e.g., '10M', '5.2B')",
      "estimatedRevenue": "Estimated monthly revenue (e.g., '$1K', '$5K', '$10K')",
      "watchTime": "Total watch time (e.g., '1M hours', '500K hours')",
      "views48h": "Views in last 48 hours (e.g., '10K', '50K')",
      "views60min": "Views in last 60 minutes (e.g., '100', '500')",
      "recentVideos": [
        {
          "title": "Video title 1",
          "views": "Views count (e.g., '10K', '100K')",
          "likes": "Likes count (e.g., '1K', '5K')",
          "comments": "Comments count (e.g., '100', '500')"
        },
        {
          "title": "Video title 2",
          "views": "Views count",
          "likes": "Likes count",
          "comments": "Comments count"
        },
        {
          "title": "Video title 3",
          "views": "Views count",
          "likes": "Likes count",
          "comments": "Comments count"
        },
        {
          "title": "Video title 4",
          "views": "Views count",
          "likes": "Likes count",
          "comments": "Comments count"
        },
        {
          "title": "Video title 5",
          "views": "Views count",
          "likes": "Likes count",
          "comments": "Comments count"
        }
      ],
      "description": "Channel description",
      "category": "Channel category",
      "joinDate": "Join date",
      "location": "Channel location",
      "socialLinks": {
        "website": "Website URL if available",
        "twitter": "Twitter/X URL if available",
        "instagram": "Instagram URL if available",
        "facebook": "Facebook URL if available"
      },
      "aiAnalysis": {
        "channelType": "Type of content (e.g., 'Gaming', 'Education', 'Entertainment')",
        "targetAudience": "Target audience",
        "contentQuality": "Content quality assessment",
        "engagementLevel": "Engagement level assessment",
        "monetizationPotential": "Monetization potential",
        "growthTrend": "Growth trend analysis"
      },
      "warnings": {
        "monetizationWarning": {
          "hasWarning": false,
          "reason": null,
          "date": null,
          "details": "Any monetization policy violations, demonetization notices, or revenue-related warnings visible in the screenshots"
        },
        "communityGuidelinesWarning": {
          "hasWarning": false,
          "reason": null,
          "date": null,
          "details": "Any community guidelines strikes, content policy violations, or warning notices visible in the screenshots"
        },
        "overallWarningStatus": "clean",
        "warningSummary": "Summary of any warnings or policy violations found"
      }
    }
    
    For warnings analysis:
    - Look for any warning messages, strikes, or policy violation notices
    - Check for demonetization indicators or monetization policy violations
    - Look for community guidelines strikes or content policy warnings
    - If warnings are found, set hasWarning to true and provide detailed reason
    - If no warnings are visible, set hasWarning to false and reason to null
    
    If any information is not visible or unclear, use "N/A" or null. For recentVideos, if you can't see 5 videos, fill the remaining slots with null values. 
    Combine information from all images to get the most complete picture of the channel.
    Return ONLY the JSON object, no other text.
    `;

    // Generate content with all images
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to extract only JSON
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
    }
    
    // Parse JSON response
    const analysisData = JSON.parse(jsonText);
    
    return {
      success: true,
      data: analysisData
    };
    
  } catch (error) {
    console.error('Gemini AI Multiple Images Analysis Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to analyze YouTube channel image (single image - kept for backward compatibility)
const analyzeYouTubeChannel = async (imageBuffer, imageName) => {
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Create image part for Gemini
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg" // Adjust based on your image type
      }
    };

    // Prompt for YouTube channel analysis with new structure
    const prompt = `
    Analyze this YouTube channel screenshot and extract the following information. Return ONLY valid JSON without any markdown formatting, code blocks, or extra text:
    
    {
      "channelName": "Channel name",
      "subscriberCount": "Number of subscribers (e.g., '1.2M', '500K')",
      "totalViews": "Total views (e.g., '10M', '5.2B')",
      "estimatedRevenue": "Estimated monthly revenue (e.g., '$1K', '$5K', '$10K')",
      "watchTime": "Total watch time (e.g., '1M hours', '500K hours')",
      "views48h": "Views in last 48 hours (e.g., '10K', '50K')",
      "views60min": "Views in last 60 minutes (e.g., '100', '500')",
      "recentVideos": [
        {
          "title": "Video title 1",
          "views": "Views count (e.g., '10K', '100K')",
          "likes": "Likes count (e.g., '1K', '5K')",
          "comments": "Comments count (e.g., '100', '500')"
        },
        {
          "title": "Video title 2",
          "views": "Views count",
          "likes": "Likes count",
          "comments": "Comments count"
        },
        {
          "title": "Video title 3",
          "views": "Views count",
          "likes": "Likes count",
          "comments": "Comments count"
        },
        {
          "title": "Video title 4",
          "views": "Views count",
          "likes": "Likes count",
          "comments": "Comments count"
        },
        {
          "title": "Video title 5",
          "views": "Views count",
          "likes": "Likes count",
          "comments": "Comments count"
        }
      ],
      "description": "Channel description",
      "category": "Channel category",
      "joinDate": "Join date",
      "location": "Channel location",
      "socialLinks": {
        "website": "Website URL if available",
        "twitter": "Twitter/X URL if available",
        "instagram": "Instagram URL if available",
        "facebook": "Facebook URL if available"
      },
      "aiAnalysis": {
        "channelType": "Type of content (e.g., 'Gaming', 'Education', 'Entertainment')",
        "targetAudience": "Target audience",
        "contentQuality": "Content quality assessment",
        "engagementLevel": "Engagement level assessment",
        "monetizationPotential": "Monetization potential",
        "growthTrend": "Growth trend analysis"
      },
      "warnings": {
        "monetizationWarning": {
          "hasWarning": false,
          "reason": null,
          "date": null,
          "details": "Any monetization policy violations, demonetization notices, or revenue-related warnings visible in the screenshots"
        },
        "communityGuidelinesWarning": {
          "hasWarning": false,
          "reason": null,
          "date": null,
          "details": "Any community guidelines strikes, content policy violations, or warning notices visible in the screenshots"
        },
        "overallWarningStatus": "clean",
        "warningSummary": "Summary of any warnings or policy violations found"
      }
    }
    
    If any information is not visible or unclear, use "N/A" or null. For recentVideos, if you can't see 5 videos, fill the remaining slots with null values. Be as accurate as possible based on the visible information. Return ONLY the JSON object, no other text.
    `;

    // Generate content
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to extract only JSON
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
    }
    
    // Parse JSON response
    const analysisData = JSON.parse(jsonText);
    
    return {
      success: true,
      data: analysisData
    };
    
  } catch (error) {
    console.error('Gemini AI Analysis Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  analyzeYouTubeChannel,
  analyzeMultipleYouTubeImages
}; 