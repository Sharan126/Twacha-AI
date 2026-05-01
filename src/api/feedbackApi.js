import { supabase } from '../config/supabaseClient';

// Helper for basic sentiment analysis
const analyzeSentiment = (rating, message) => {
  const msgLower = message.toLowerCase();
  
  // Basic positive/negative keyword check
  const negativeWords = ['terrible', 'bad', 'broken', 'hate', 'worst', 'slow', 'bug', 'crash', 'fail'];
  const positiveWords = ['great', 'awesome', 'love', 'perfect', 'amazing', 'best', 'fast', 'good'];
  
  let negativeScore = 0;
  let positiveScore = 0;
  
  negativeWords.forEach(word => { if (msgLower.includes(word)) negativeScore++; });
  positiveWords.forEach(word => { if (msgLower.includes(word)) positiveScore++; });

  if (rating >= 4 || positiveScore > negativeScore) return 'Positive';
  if (rating <= 2 || negativeScore > positiveScore) return 'Negative';
  return 'Neutral';
};

export const feedbackApi = {
  /**
   * POST /api/feedback equivalent
   */
  submitFeedback: async (data, user) => {
    try {
      const { rating, feedback_type, message, screenshot } = data;

      // 6. VALIDATION (IMPORTANT)
      if (!rating || rating < 1 || rating > 5) {
        return { success: false, error: "Rating must be between 1 and 5" };
      }
      if (!feedback_type) {
        return { success: false, error: "Feedback type is required" };
      }
      if (!message || message.length < 10) {
        return { success: false, error: "Message must be at least 10 characters long" };
      }
      if (screenshot && screenshot.size > 5 * 1024 * 1024) { // 5MB limit
        return { success: false, error: "Screenshot must be less than 5MB" };
      }

      let screenshotUrl = null;

      // 3. HANDLE IMAGE UPLOAD (Supabase Storage)
      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `feedback/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("feedback-images")
          .upload(filePath, screenshot);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // Non-fatal, we can still save the feedback without the image
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("feedback-images")
            .getPublicUrl(filePath);
            
          screenshotUrl = publicUrlData.publicUrl;
        }
      }

      // Bonus: Sentiment Analysis
      const sentiment = analyzeSentiment(rating, message);

      // 4. SAVE TO DATABASE
      const { error: dbError } = await supabase.from("feedback").insert([
        {
          user_id: user?.id || null,
          rating,
          feedback_type,
          message,
          screenshot_url: screenshotUrl || null,
          sentiment: sentiment,
          status: 'pending'
        }
      ]);

      if (dbError) {
        console.error("DB Insert Error:", dbError);
        return { success: false, error: `Failed to save feedback: ${dbError.message || JSON.stringify(dbError)}` };
      }

      // 5. RESPONSE
      return { success: true, message: "Feedback submitted successfully" };

    } catch (err) {
      console.error("Feedback API error:", err);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * ADMIN FETCH API (GET /api/feedback)
   */
  getFeedback: async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(`*`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error("Fetch feedback error:", err);
      return { success: false, error: "Failed to fetch feedback" };
    }
  },

  updateStatus: async (id, status) => {
    try {
      const { error } = await supabase.from("feedback").update({ status }).eq("id", id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Update status error:", err);
      return { success: false, error: "Failed to update status" };
    }
  }
};
