import { useQuery } from '@tanstack/react-query';
import { PhishShow, PhishSong, Setlist } from '@/types';

export function formatShowDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

  // Fetch recent show
  const {
    data: recentShowData,
    isLoading: isLoadingRecentShow
  } = useQuery<PhishShow>({
    queryKey: ['/api/shows/recent'],
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
    upcomingShow: upcomingShowsData?.shows?.[0],
    recentShow: recentShowData,
    isLoadingSongs,
    isLoadingUpcomingShow,
    isLoadingRecentShow,
    fetchSetlist,
    formatShowDate
  };
}
