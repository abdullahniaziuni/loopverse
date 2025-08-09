import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Button, Modal, Textarea } from '../ui';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface SessionFeedbackProps {
  sessionId: string;
  mentorName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const SessionFeedback: React.FC<SessionFeedbackProps> = ({
  sessionId,
  mentorName,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { success: showSuccess, error: showError } = useToast();

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showError('Please provide a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.submitFeedback(sessionId, {
        rating,
        comment: comment.trim(),
      });

      if (response.success) {
        setIsSubmitted(true);
        showSuccess('Thank you for your feedback!');
        onSubmitted?.();
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        showError(response.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showError('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setIsSubmitting(false);
    setIsSubmitted(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Rate your experience';
    }
  };

  if (isSubmitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Feedback Submitted">
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Thank you for your feedback!
          </h3>
          <p className="text-gray-600">
            Your feedback helps us improve the mentoring experience.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Rate Your Session">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            How was your session with {mentorName}?
          </h3>
          <p className="text-gray-600">
            Your feedback helps us maintain quality mentoring experiences.
          </p>
        </div>

        {/* Rating Stars */}
        <div className="text-center">
          <div className="flex justify-center space-x-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                className="p-1 transition-colors duration-150"
                disabled={isSubmitting}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  } transition-colors duration-150`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-gray-700">
            {getRatingText(hoveredRating || rating)}
          </p>
        </div>

        {/* Comment Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Additional Comments (Optional)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about the session, what went well, or areas for improvement..."
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>

        {/* Privacy Note */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
          Your feedback is confidential and helps improve our platform.
        </div>
      </div>
    </Modal>
  );
};

// Rating Display Component for showing existing feedback
interface RatingDisplayProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const starSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showText && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)} out of 5
        </span>
      )}
    </div>
  );
};

// Feedback Summary Component for mentor profiles
interface FeedbackSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: { [key: number]: number };
  className?: string;
}

export const FeedbackSummary: React.FC<FeedbackSummaryProps> = ({
  averageRating,
  totalReviews,
  ratingDistribution,
  className = '',
}) => {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900 mr-2">
              {averageRating.toFixed(1)}
            </span>
            <RatingDisplay rating={averageRating} size="lg" />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {ratingDistribution && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center text-sm">
                <span className="w-3 text-gray-600">{rating}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-current mx-1" />
                <div className="flex-1 mx-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-gray-600 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
