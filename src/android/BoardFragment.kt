package com.ruralerides.go

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.firebase.ui.firestore.FirestoreRecyclerOptions
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

/**
 * BoardFragment.kt
 * Displays the real-time Rider Board using a FirestoreRecyclerAdapter on Android.
 */
class BoardFragment : Fragment() {

    private var recyclerView: RecyclerView? = null
    private var adapter: PostAdapter? = null
    private val db = FirebaseFirestore.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_board, container, false)
        
        // Find the RecyclerView component
        recyclerView = view.findViewById(R.id.boardRecyclerView)
        
        // Ensure the RecyclerView layout manager is correctly set
        recyclerView?.layoutManager = LinearLayoutManager(context).apply {
            orientation = LinearLayoutManager.VERTICAL
            reverseLayout = false
            stackFromEnd = false
        }
        
        setupFirestoreAdapter()
        
        return view
    }

    private fun setupFirestoreAdapter() {
        // Implement a FirestoreRecyclerOptions query to listen to the 'board_posts' collection in real-time
        val query = db.collection("board_posts")
            .orderBy("timestamp_epoch", Query.Direction.DESCENDING)

        val options = FirestoreRecyclerOptions.Builder<BoardPost>()
            .setQuery(query, BoardPost::class.java)
            .build()

        // Ensure the PostAdapter is initialized with this query
        adapter = PostAdapter(options)
        recyclerView?.adapter = adapter
    }

    override fun onStart() {
        super.onStart()
        // Correctly start the Firestore real-time listener during fragment onStart()
        adapter?.startListening()
    }

    override fun onStop() {
        super.onStop()
        // Correctly stop the Firestore listener during fragment onStop() to prevent leaks
        adapter?.stopListening()
    }
}
