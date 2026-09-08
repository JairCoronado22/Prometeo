package com.example.songfinder.model

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("username") val username: String,
    @SerializedName("email") val email: String = "${username}@example.com",
    @SerializedName("createdAt") val createdAt: String = "2026-09-08T10:00:00"
)
