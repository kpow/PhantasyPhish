import axios from 'axios';

const API_BASE_URL = 'https://api.phish.net/v5';
const API_KEY = process.env.PHISH_API_KEY || 'DE6FDFF136D545E19C4C';

// Function to fetch data from Phish.net API
export async function fetchPhishData(endpoint: string, params: Record<string, string> = {}) {
  try {
    // Format the URL correctly - URL should include .json extension
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`Fetching data from: ${url}`);
    
    // Add API key as a parameter - the exact parameter name matters
    const paramsWithApiKey = {
      ...params,
      apikey: API_KEY
    };
    
    // For debugging
    console.log('Request parameters:', paramsWithApiKey);
    
    const response = await axios.get(url, {
      params: paramsWithApiKey,
    });

    // Show abbreviated response for debug purposes
    console.log('API Response Summary:', {
      status: response.status,
      errorFlag: response.data?.error,
      hasResponseData: !!response.data?.data,
      dataCount: response.data?.data?.length || 0
    });
    
    // Debug specific endpoints
    if (endpoint.includes('/songs/')) {
      console.log('Song API Response Sample:', JSON.stringify(response.data).substring(0, 500) + '...');
      
      // Try to extract useful info from song response
      if (response.data?.data?.length > 0) {
        console.log('First song:', response.data.data[0]);
      }
    }
    
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
        params: paramsWithApiKey,
        errorMessage: response.data?.error_message || 'Unknown error',
        statusCode: response.status,
        responseDataSample: JSON.stringify(response.data).substring(0, 300) + '...'
      });
      throw new Error(response.data?.error_message || 'Failed to fetch data from Phish.net API');
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

// Format date for display with UTC handling to prevent timezone issues
export function formatShowDate(dateString: string): string {
  // Create a UTC date to prevent timezone offset issues
  // Format: YYYY-MM-DD to ensure we get the exact date specified
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
  const day = parseInt(parts[2], 10);
  
  // Create date with UTC time to avoid timezone shifts
  const date = new Date(Date.UTC(year, month, day));
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // This ensures timezone doesn't affect the date
  });
}
