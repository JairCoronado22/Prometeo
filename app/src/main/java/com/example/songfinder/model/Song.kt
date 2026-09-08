package com.example.songfinder.model

import com.google.gson.annotations.SerializedName

data class SongId(
    @SerializedName("songName") val songName: String,
    @SerializedName("songArtist") val songArtist: String
)

data class Song(
    @SerializedName("id") val id: SongId,
    @SerializedName("songPopularity") val songPopularity: Double?,
    @SerializedName("durationMs") val durationMs: Double?,
    @SerializedName("danceability") val danceability: Double?
)
