package com.example.songfinder.model

import com.google.gson.annotations.SerializedName

data class ListeningHistory(
    @SerializedName("user") val user: User,
    @SerializedName("song") val song: Song,
    @SerializedName("playedAt") val playedAt: String,
    @SerializedName("durationPlayedMs") val durationPlayedMs: Long,
    @SerializedName("completed") val completed: Boolean = true
)
