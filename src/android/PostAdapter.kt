package com.ruralerides.go

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.firebase.ui.firestore.FirestoreRecyclerAdapter
import com.firebase.ui.firestore.FirestoreRecyclerOptions

/**
 * PostAdapter.kt
 * Replicates the RecyclerView adapter bound to the real-time Firestore database query.
 */
class PostAdapter(options: FirestoreRecyclerOptions<BoardPost>) :
    FirestoreRecyclerAdapter<BoardPost, PostAdapter.PostViewHolder>(options) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_board_post, parent, false)
        return PostViewHolder(view)
    }

    override fun onBindViewHolder(holder: PostViewHolder, position: Int, model: BoardPost) {
        holder.bind(model)
    }

    class PostViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val usernameText: TextView = itemView.findViewById(R.id.usernameText)
        private val badgeText: TextView = itemView.findViewById(R.id.badgeText)
        private val contentText: TextView = itemView.findViewById(R.id.contentText)
        private val timestampText: TextView = itemView.findViewById(R.id.timestampText)

        fun bind(post: BoardPost) {
            usernameText.text = post.username
            badgeText.text = post.userBadge
            contentText.text = post.content
            timestampText.text = post.timestamp
        }
    }
}
