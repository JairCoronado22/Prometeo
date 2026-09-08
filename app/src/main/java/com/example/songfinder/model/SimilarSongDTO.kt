package com.example.songfinder.model

import com.google.gson.annotations.SerializedName

data class SimilarSongDTO(
    @SerializedName("songName") val songName: String,
    @SerializedName("artist") val artist: String,
    @SerializedName("durationSeconds") val durationSeconds: Long,
    @SerializedName("genres") val genres: List<String>,
    @SerializedName("subgenres") val subgenres: List<String>,
    @SerializedName("popularity") val popularity: Double,
    @SerializedName("similarity") val similarity: Double
)
