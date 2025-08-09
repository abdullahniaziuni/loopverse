import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  User,
  MessageCircle,
  Check,
  X,
  Calendar,
  Video,
} from "lucide-react";
import { Layout } from "../../components/layout";
import { Button, Modal, Textarea } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { formatDate, formatTime } from "../../utils";
import { apiService } from "../../services/api";

interface BookingRequest {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerAvatar?: string;
  date: string;
  startTime: string;
  endTime: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export const BookingRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success: showSuccess, error: showError } = useToast();

  // Fetch pending booking requests
  useEffect(() => {
    const fetchPendingBookings = async () => {
      try {
        console.log("📋 BookingRequests - Fetching pending bookings");
        setIsLoading(true);

        const response = await apiService.getPendingBookings();
        console.log("📋 BookingRequests - API response:", response);

        if (response.success && response.data) {
          console.log(
            "✅ BookingRequests - Bookings fetched successfully:",
            response.data
          );
          setRequests(response.data);
        } else {
          console.log(
            "❌ BookingRequests - No bookings data or failed response"
          );
          console.log("📄 Response details:", response);
        }
      } catch (error) {
        console.error("💥 BookingRequests - Error fetching bookings:", error);
        showError("Failed to fetch booking requests");
      } finally {
        setIsLoading(false);
        console.log("⏳ BookingRequests - Set loading to false");
      }
    };

    fetchPendingBookings();
  }, []);

  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null
  );
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  const handleAction = (
    request: BookingRequest,
    action: "accept" | "reject"
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setResponseMessage("");
  };

  const submitResponse = async () => {
    if (!selectedRequest || !actionType) return;

    setIsSubmitting(true);
    try {
      console.log("📋 BookingRequests - Submitting response:", {
        requestId: selectedRequest.id,
        action: actionType,
        message: responseMessage,
      });

      const response = await apiService.respondToBooking(
        selectedRequest.id,
        actionType,
        responseMessage
      );

      console.log("📋 BookingRequests - Response result:", response);

      if (response.success) {
        // Update the local state
        setRequests((prev) =>
          prev.map((request) =>
            request.id === selectedRequest.id
              ? {
                  ...request,
                  status: actionType === "accept" ? "accepted" : "rejected",
                }
              : request
          )
        );

        showSuccess(
          actionType === "accept"
            ? "Booking request accepted! The learner will be notified."
            : "Booking request declined. The learner will be notified."
        );

        setSelectedRequest(null);
        setActionType(null);
        setResponseMessage("");
      } else {
        showError(response.error || "Failed to process request");
      }
    } catch (error) {
      console.error("💥 BookingRequests - Error submitting response:", error);
      showError("Failed to process request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSession = (request: BookingRequest) => {
    console.log(
      "🎯 BookingRequests - Starting session for request:",
      request.id
    );
    showSuccess("Starting session...");
    navigate(`/session/${request.id}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Requests</h1>
          <p className="text-gray-600 mt-2">
            Review and respond to learner booking requests.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {pendingRequests.length}
            </div>
            <div className="text-sm text-gray-600">Pending Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {requests.filter((r) => r.status === "accepted").length}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {requests.filter((r) => r.status === "rejected").length}
            </div>
            <div className="text-sm text-gray-600">Declined</div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </h2>
          </div>
          <div className="p-6">
            {pendingRequests.length > 0 ? (
              <div className="space-y-6">
                {pendingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onAccept={() => handleAction(request, "accept")}
                    onReject={() => handleAction(request, "reject")}
                    isPending={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No pending requests
                </h3>
                <p className="text-gray-600">
                  New booking requests will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {processedRequests.slice(0, 5).map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isPending={false}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Response Modal */}
      <Modal
        isOpen={!!selectedRequest && !!actionType}
        onClose={() => {
          setSelectedRequest(null);
          setActionType(null);
          setResponseMessage("");
        }}
        title={
          actionType === "accept"
            ? "Accept Booking Request"
            : "Decline Booking Request"
        }
      >
        {selectedRequest && (
          <div>
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900">
                  {selectedRequest.learnerName}
                </h4>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedRequest.date)} at{" "}
                  {formatTime(selectedRequest.startTime)} -{" "}
                  {formatTime(selectedRequest.endTime)}
                </p>
                {selectedRequest.message && (
                  <p className="text-sm text-gray-700 mt-2 italic">
                    "{selectedRequest.message}"
                  </p>
                )}
              </div>

              <Textarea
                label={`Message to learner (optional)`}
                placeholder={
                  actionType === "accept"
                    ? "Looking forward to our session! Please let me know if you have any specific topics you'd like to focus on."
                    : "Thank you for your interest. Unfortunately, I'm not available at this time. Please check my other available slots."
                }
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setResponseMessage("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={submitResponse}
                isLoading={isSubmitting}
                variant={actionType === "accept" ? "primary" : "danger"}
              >
                {actionType === "accept" ? "Accept Request" : "Decline Request"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

interface RequestCardProps {
  request: BookingRequest;
  onAccept?: () => void;
  onReject?: () => void;
  isPending: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onReject,
  isPending,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center">
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={
                  request.learnerAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    request.learnerName
                  )}&background=3B82F6&color=fff`
                }
                alt={request.learnerName}
              />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {request.learnerName}
                </h3>
                <p className="text-sm text-gray-500">
                  Requested {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                request.status
              )}`}
            >
              {request.status}
            </span>
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(request.date)}</span>
          </div>

          <div className="flex items-center text-gray-600 mb-3">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              {formatTime(request.startTime)} - {formatTime(request.endTime)}
            </span>
          </div>

          {request.message && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <MessageCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">"{request.message}"</p>
              </div>
            </div>
          )}
        </div>

        {isPending && onAccept && onReject && (
          <div className="flex space-x-2 ml-6">
            <Button size="sm" onClick={onAccept} className="flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="flex items-center text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
