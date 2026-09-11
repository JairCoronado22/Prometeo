package com.example.songfinder

import com.example.songfinder.model.Song

object HistoryManager {
    private val history = mutableListOf<Song>()

    fun addSong(song: Song) {
        if (!history.contains(song)) {
            history.add(0, song) // Add to the top
        }
    }

    fun getHistory(): List<Song> {
        return history
    }
}
