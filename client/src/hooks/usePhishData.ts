import { useQuery } from '@tanstack/react-query';
import { PhishShow, PhishSong, Setlist } from '@/types';

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

export function usePhishData() {
  // Fetch songs
  const { 
    data: songsData,
    isLoading: isLoadingSongs
  } = useQuery<{ songs: PhishSong[] }>({
    queryKey: ['/api/songs/all'],
  });

  // Fetch upcoming shows
  const {
    data: upcomingShowsData,
    isLoading: isLoadingUpcomingShow
  } = useQuery<{ shows: PhishShow[] }>({
    queryKey: ['/api/shows/upcoming'],
  });

  // Fetch recent show (single)
  const {
    data: recentShowData,
    isLoading: isLoadingRecentShow
  } = useQuery<PhishShow>({
    queryKey: ['/api/shows/recent'],
  });
  
  // Fetch multiple recent shows
  const {
    data: recentShowsData,
    isLoading: isLoadingRecentShows
  } = useQuery<{ shows: PhishShow[] }>({
    queryKey: ['/api/shows/recent/multiple'],
  });

  // Function to fetch setlist for a specific show
  const fetchSetlist = async (showId: string): Promise<Setlist> => {
    const response = await fetch(`/api/setlists/${showId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch setlist');
    }
    return response.json();
  };

  return {
    songs: songsData?.songs || [],
    upcomingShows: upcomingShowsData?.shows || [],
    upcomingShow: upcomingShowsData?.shows?.[0],
    recentShow: recentShowData,
    recentShows: recentShowsData?.shows || [],
    isLoadingSongs,
    isLoadingUpcomingShow,
    isLoadingRecentShow,
    isLoadingRecentShows,
    fetchSetlist,
    formatShowDate
  };
}
