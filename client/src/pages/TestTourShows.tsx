import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Show = {
  id: number;
  show_id: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  tour_id: number;
  is_scored: boolean;
};

export default function TestTourShows() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTourShows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tours/1/shows');
      if (!response.ok) {
        throw new Error(`Error fetching shows: ${response.status}`);
      }
      const data = await response.json();
      setShows(data.shows || []);
    } catch (err) {
      console.error('Error fetching tour shows:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Test Tour Shows</h1>
      
      <Button onClick={fetchTourShows} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Tour 1 Shows'}
      </Button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Shows ({shows.length})</h2>
        
        {shows.length === 0 ? (
          <p>No shows found.</p>
        ) : (
          <div className="space-y-4">
            {shows.map(show => (
              <Card key={show.id}>
                <CardHeader>
                  <CardTitle>{show.venue}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Date: {new Date(show.date).toLocaleDateString()}</p>
                  <p>Location: {show.city}, {show.state}</p>
                  <p>Show ID: {show.show_id}</p>
                  <p>Is Scored: {show.is_scored ? 'Yes' : 'No'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}