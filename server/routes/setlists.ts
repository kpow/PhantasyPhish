import express from "express";
import { fetchPhishData } from "../utils/api-utils";
import { z } from "zod";
import { processRawSetlist } from "../utils/scoring-utils";

const router = express.Router();

// Get setlist for a specific show
router.get("/setlists/:showId", async (req, res) => {
  try {
    const { showId } = req.params;
    const setlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
      username: "phishnet"
    });

    if (Array.isArray(setlistData) && setlistData.length > 0) {
      const setGroups = setlistData.reduce((acc: any, song: any) => {
        if (!acc[song.set]) {
          acc[song.set] = [];
        }
        acc[song.set].push({
          name: song.song,
          transition: song.trans_mark,
          position: song.position,
          jamchart: song.isjamchart ? song.jamchart_description : null,
        });
        return acc;
      }, {});

      const formatSet = (songs: any[]) => {
        return songs
          .sort((a, b) => a.position - b.position)
          .map((song) => song.name + song.transition)
          .join(" ")
          .trim();
      };

      let setlistText = "";
      if (setGroups["1"]) {
        setlistText += "Set 1: " + formatSet(setGroups["1"]) + "\n\n";
      }
      if (setGroups["2"]) {
        setlistText += "Set 2: " + formatSet(setGroups["2"]) + "\n\n";
      }
      if (setGroups["e"]) {
        setlistText += "Encore: " + formatSet(setGroups["e"]) + "\n\n";
      }

      const firstSong = setlistData[0];
      res.json({
        showdate: firstSong.showdate,
        venue: firstSong.venue,
        location: `${firstSong.city}, ${firstSong.state}`,
        setlistdata: setlistText,
        setlistnotes:
          firstSong.setlistnotes?.replace(/<\/?[^>]+(>|$)/g, "") || "",
      });
    } else {
      res.status(404).json({ message: "Setlist not found" });
    }
  } catch (error) {
    console.error("Error fetching setlist:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get structured setlist for a specific show (used for scoring)
router.get("/setlists/:showId/structured", async (req, res) => {
  try {
    const { showId } = req.params;
    const setlistData = await fetchPhishData(`/setlists/showid/${showId}.json`, {
      username: "phishnet"
    });
    
    if (Array.isArray(setlistData) && setlistData.length > 0) {
      // Process the raw setlist data into a structured format for scoring
      const processedSetlist = processRawSetlist(setlistData);
      res.json(processedSetlist);
    } else {
      res.status(404).json({ message: "Setlist not found" });
    }
  } catch (error) {
    console.error("Error fetching structured setlist:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;