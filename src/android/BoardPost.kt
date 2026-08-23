package com.ruralerides.go

/**
 * BoardPost.kt
 * Model class representing a post in the 'board_posts' Firestore collection.
 */
data class BoardPost(
    var id: String = "",
    var username: String = "",
    var userBadge: String = "",
    var content: String = "",
    var timestamp: String = "",
    var timestamp_epoch: Long = 0L,
    var likes: Int = 0,
    var flagged: Boolean = false,
    var reportsCount: Int = 0
)
