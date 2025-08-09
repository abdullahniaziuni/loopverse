import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  User, 
  Calendar, 
  Filter,
  Search,
  Eye,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button, Input, Modal } from '../../components/ui';

interface Feedback {
  id: string;
  sessionId: string;
  learnerName: string;
  mentorName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'flagged' | 'hidden';
  category: 'positive' | 'negative' | 'neutral';
  reportCount: number;
}

const mockFeedback: Feedback[] = [
  {
    id: '1',
    sessionId: 'sess_001',
    learnerName: 'Alice Johnson',
    mentorName: 'John Smith',
    rating: 5,
    comment: 'Excellent session! John explained React concepts very clearly and provided great examples.',
    date: '2024-01-15',
    status: 'approved',
    category: 'positive',
    reportCount: 0
  },
  {
    id: '2',
    sessionId: 'sess_002',
    learnerName: 'Bob Wilson',
    mentorName: 'Sarah Davis',
    rating: 2,
    comment: 'The session was not helpful. The mentor seemed unprepared and couldn\'t answer my questions properly.',
    date: '2024-01-14',
    status: 'flagged',
    category: 'negative',
    reportCount: 2
  },
  {
    id: '3',
    sessionId: 'sess_003',
    learnerName: 'Carol Brown',
    mentorName: 'Mike Johnson',
    rating: 4,
    comment: 'Good session overall. Mike was knowledgeable but the pace was a bit fast for me.',
    date: '2024-01-13',
    status: 'pending',
    category: 'positive',
    reportCount: 0
  },
  {
    id: '4',
    sessionId: 'sess_004',
    learnerName: 'David Lee',
    mentorName: 'Emma Wilson',
    rating: 1,
    comment: 'Terrible experience. The mentor was rude and dismissive. Would not recommend.',
    date: '2024-01-12',
    status: 'pending',
    category: 'negative',
    reportCount: 1
  }
];

export const FeedbackManagement: React.FC = () => {
  const [feedback] = useState<Feedback[]>(mockFeedback);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = 
      item.learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mentorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: Feedback['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'hidden': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Feedback['status']) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'flagged': return <Flag className="h-4 w-4" />;
      case 'hidden': return <XCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: Feedback['category']) => {
    switch (category) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleViewDetails = (feedbackItem: Feedback) => {
    setSelectedFeedback(feedbackItem);
    setIsModalOpen(true);
  };

  const handleStatusChange = (feedbackId: string, newStatus: Feedback['status']) => {
    // TODO: Implement status change logic
    console.log(`Changing feedback ${feedbackId} status to ${newStatus}`);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="mt-2 text-gray-600">
            Review and moderate session feedback from learners
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-600 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedback.filter(f => f.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-red-600 rounded-lg">
                <Flag className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Flagged</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedback.filter(f => f.status === 'flagged').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-600 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedback.filter(f => f.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by learner, mentor, or comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div className="lg:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Categories</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedback.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            filteredFeedback.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status}</span>
                      </span>
                      {item.reportCount > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Flag className="h-3 w-3 mr-1" />
                          {item.reportCount} reports
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-900 mb-3">{item.comment}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{item.learnerName} → {item.mentorName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <span className={`font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {item.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'approved')}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'flagged')}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Flag
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Feedback Detail Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Feedback Details"
          size="lg"
        >
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < selectedFeedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">
                  {selectedFeedback.rating}/5
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900">{selectedFeedback.comment}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Learner:</span>
                  <p className="text-gray-900">{selectedFeedback.learnerName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Mentor:</span>
                  <p className="text-gray-900">{selectedFeedback.mentorName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <p className="text-gray-900">{new Date(selectedFeedback.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Session ID:</span>
                  <p className="text-gray-900">{selectedFeedback.sessionId}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </Button>
                {selectedFeedback.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        handleStatusChange(selectedFeedback.id, 'approved');
                        setIsModalOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        handleStatusChange(selectedFeedback.id, 'flagged');
                        setIsModalOpen(false);
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Flag
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
