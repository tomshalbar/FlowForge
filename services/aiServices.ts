import { model } from '@/config/firebase';

export const analyzeImage = async (base64Image: string, prompt: string) => {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const text = result.response.text();
    return text;
  } catch (error) {
    console.error(' AI error:', error);
    return null;
  }
};
