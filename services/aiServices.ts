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
    console.log('error analyzing image, returning base schedule:', error);
    // switch the error off for testing, and switch on the return of the base schedule.
    throw new Error('Failed to analyze image. Please try again later.');
    // return "{'monday': {}, 'tuesday': {}, 'wednesday': {}, 'thursday': {}, 'friday': {}}";
  }
};
