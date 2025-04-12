import axios from 'axios';

const API_BASE_URL = 'https://api.phish.net/v5';
const API_KEY = process.env.PHISH_API_KEY || 'DE6FDFF136D545E19C4C';

// Function to fetch data from Phish.net API
export async function fetchPhishData(endpoint: string, params: Record<string, string> = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}.json`;
    
    console.log(`Fetching data from: ${url}`);
    
    const response = await axios.get(url, {
      params: {
        apikey: API_KEY,
        ...params,
      },
    });

    if (response.data && response.data.error_code === 0) {
      return response.data.data || [];
    } else {
      console.error('API Error:', response.data.error_message || 'Unknown error');
      throw new Error(response.data.error_message || 'Failed to fetch data from Phish.net API');
    }
  } catch (error) {
    console.error('Error fetching data from Phish.net API:', error);
    throw error;
  }
}

// Helper function to convert song name to slug
export function slugifySongName(songName: string): string {
  return songName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Format date for display
export function formatShowDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
