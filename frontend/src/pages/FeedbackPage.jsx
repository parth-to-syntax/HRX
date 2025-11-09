import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Star } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Employee Feedback Form
 * Allows employees to submit feedback about workplace, management, or suggestions
 */
export default function FeedbackForm() {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    rating: 0,
    isAnonymous: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    'Workplace Environment',
    'Management',
    'Team Collaboration',
    'Work-Life Balance',
    'Benefits & Compensation',
    'Career Development',
    'Tools & Resources',
    'Other'
  ]

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    
    if (!formData.subject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    
    if (!formData.message.trim()) {
      toast.error('Please enter your feedback')
      return
    }

    setIsSubmitting(true)
    
    try {
      // TODO: Backend API call will be implemented later
      // await submitFeedback(formData)
      
      // Simulated success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Thank you for your feedback!')
      
      // Reset form
      setFormData({
        category: '',
        subject: '',
        message: '',
        rating: 0,
        isAnonymous: false
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="text-white" size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl">Employee Feedback</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your voice matters! Share your thoughts, suggestions, or concerns.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of your feedback..."
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.subject.length}/100 characters
              </p>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Overall Satisfaction (Optional)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={
                        star <= formData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
                {formData.rating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formData.rating} out of 5
                  </span>
                )}
              </div>
            </div>

            {/* Feedback Message */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Share your thoughts, suggestions, or concerns in detail..."
                rows={6}
                maxLength={1000}
                className="resize-none"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.message.length}/1000 characters
              </p>
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center gap-2 p-4 bg-accent/50 rounded-lg">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="anonymous" className="text-sm cursor-pointer">
                Submit anonymously
                <span className="text-muted-foreground ml-2">
                  (Your identity will not be shared with management)
                </span>
              </label>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📢 Your feedback is important to us!</strong>
                <br />
                All feedback is reviewed by HR and used to improve our workplace. 
                {formData.isAnonymous 
                  ? ' Anonymous submissions are handled with strict confidentiality.'
                  : ' Your name will be kept confidential unless you choose to be contacted.'
                }
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    category: '',
                    subject: '',
                    message: '',
                    rating: 0,
                    isAnonymous: false
                  })
                }}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">💡 Tips for Effective Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Be specific about the issue or suggestion</li>
            <li>✓ Provide examples when possible</li>
            <li>✓ Focus on constructive criticism</li>
            <li>✓ Suggest potential solutions if you have ideas</li>
            <li>✓ Be respectful and professional</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
