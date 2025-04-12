import axios from 'axios';

const API_BASE_URL = 'https://api.phish.net/v5';
const API_KEY = process.env.PHISH_API_KEY || 'DE6FDFF136D545E19C4C';

// Function to fetch data from Phish.net API
export async function fetchPhishData(endpoint: string, params: Record<string, string> = {}) {
  try {
    // Format the URL correctly - URL should include .json extension
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`Fetching data from: ${url}`);
    
    // Add default parameters for all requests
    const defaultParams = {
      apikey: API_KEY
    };
    
    const response = await axios.get(url, {
      params: {
        ...defaultParams,
        ...params,
      },
    });

    // The Phish.net API returns data with 'error' field instead of 'error_code'
    if (response.data && response.data.error === false) {
      // For debugging setlist data
      if (endpoint.includes('/setlists/')) {
        console.log(`API Response for ${url}:`, {
          dataLength: response.data.data ? response.data.data.length : 0,
          sampleSong: response.data.data && response.data.data.length > 0 ? 
            JSON.stringify(response.data.data[0].song) : 'No songs found'
        });
      }
      return response.data.data || [];
    } else {
      // Enhanced error logging
      console.error('API Error Details:', {
        url,
        params: { ...defaultParams, ...params },
        errorMessage: response.data.error_message || 'Unknown error',
        statusCode: response.status,
        responseData: response.data
      });
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
