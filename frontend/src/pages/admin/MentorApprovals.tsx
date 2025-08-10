import React, { useState, useEffect } from "react";
import {
  UserCheck,
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { Layout } from "../../components/layout";
import { Button, Modal, Textarea } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { formatDate } from "../../utils";
import { apiService } from "../../services/api";

interface MentorApplication {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experience: string;
  bio: string;
  portfolio?: string;
  linkedin?: string;
  appliedAt: string;
  status: "pending" | "approved" | "rejected";
}

export const MentorApprovals: React.FC = () => {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedApplication, setSelectedApplication] =
    useState<MentorApplication | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "view" | null
  >(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success: showSuccess, error: showError } = useToast();

  // Fetch pending mentor applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getPendingMentorApplications();
        if (response.success && response.data) {
          // Transform backend data to frontend format
          const transformedApplications = response.data.map((mentor: any) => ({
            id: mentor._id || mentor.id,
            name: `${mentor.firstName} `,
            email: mentor.email,
            skills:
              mentor.skills?.map((skill: any) =>
                typeof skill === "string" ? skill : skill.name
              ) || [],
            experience: `${mentor.yearsOfExperience || 0} years`,
            bio: mentor.biography || "No bio provided",
            appliedAt: mentor.createdAt,
            status: "pending" as const,
          }));
          setApplications(transformedApplications);
        } else {
          setError(response.error || "Failed to fetch applications");
        }
      } catch (err) {
        setError("Failed to fetch mentor applications");
        console.error("Error fetching applications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const pendingApplications = applications.filter(
    (app) => app.status === "pending"
  );
  const processedApplications = applications.filter(
    (app) => app.status !== "pending"
  );

  const handleAction = (
    application: MentorApplication,
    action: "approve" | "reject" | "view"
  ) => {
    setSelectedApplication(application);
    setActionType(action);
    setResponseMessage("");
  };

  const submitDecision = async () => {
    if (!selectedApplication || !actionType || actionType === "view") return;

    setIsSubmitting(true);
    try {
      // Call real API
      const response = await apiService.approveMentorApplication(
        selectedApplication.id,
        actionType === "approve",
        responseMessage
      );

      if (response.success) {
        // Remove from pending applications list
        setApplications((prev) =>
          prev.filter((app) => app.id !== selectedApplication.id)
        );

        showSuccess(
          actionType === "approve"
            ? "Mentor application approved! The applicant will be notified."
            : "Mentor application rejected. The applicant will be notified."
        );
      } else {
        showError(response.error || "Failed to process application");
      }

      setSelectedApplication(null);
      setActionType(null);
      setResponseMessage("");
    } catch (error) {
      showError("Failed to process application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Error loading applications</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mentor Applications
          </h1>
          <p className="text-gray-600 mt-2">
            Review and approve mentor applications to maintain platform quality.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {pendingApplications.length}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {applications.filter((app) => app.status === "approved").length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {applications.filter((app) => app.status === "rejected").length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Pending Applications */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Applications
              {pendingApplications.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {pendingApplications.length}
                </span>
              )}
            </h2>
          </div>
          <div className="p-6">
            {pendingApplications.length > 0 ? (
              <div className="space-y-6">
                {pendingApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onApprove={() => handleAction(application, "approve")}
                    onReject={() => handleAction(application, "reject")}
                    onView={() => handleAction(application, "view")}
                    isPending={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No pending applications
                </h3>
                <p className="text-gray-600">
                  New mentor applications will appear here for review.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Processed Applications */}
        {processedApplications.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Decisions
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {processedApplications.slice(0, 5).map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onView={() => handleAction(application, "view")}
                    isPending={false}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={!!selectedApplication && !!actionType}
        onClose={() => {
          setSelectedApplication(null);
          setActionType(null);
          setResponseMessage("");
        }}
        title={
          actionType === "approve"
            ? "Approve Application"
            : actionType === "reject"
            ? "Reject Application"
            : "Application Details"
        }
        size="lg"
      >
        {selectedApplication && (
          <div>
            {/* Application Details */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="font-medium text-gray-900">
                    {selectedApplication.name}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{selectedApplication.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span>
                      Applied {formatDate(selectedApplication.appliedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Experience</h5>
                  <p className="text-sm text-gray-700">
                    {selectedApplication.experience}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Bio</h5>
                  <p className="text-sm text-gray-700">
                    {selectedApplication.bio}
                  </p>
                </div>

                {(selectedApplication.portfolio ||
                  selectedApplication.linkedin) && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Links</h5>
                    <div className="space-y-1">
                      {selectedApplication.portfolio && (
                        <a
                          href={selectedApplication.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 block"
                        >
                          Portfolio: {selectedApplication.portfolio}
                        </a>
                      )}
                      {selectedApplication.linkedin && (
                        <a
                          href={selectedApplication.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 block"
                        >
                          LinkedIn: {selectedApplication.linkedin}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {actionType !== "view" && (
                <div className="mt-4">
                  <Textarea
                    label={`Message to applicant (optional)`}
                    placeholder={
                      actionType === "approve"
                        ? "Welcome to SkillSphere! We're excited to have you as a mentor."
                        : "Thank you for your interest. Unfortunately, we cannot approve your application at this time."
                    }
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedApplication(null);
                  setActionType(null);
                  setResponseMessage("");
                }}
              >
                {actionType === "view" ? "Close" : "Cancel"}
              </Button>
              {actionType !== "view" && (
                <Button
                  className="flex-1"
                  onClick={submitDecision}
                  isLoading={isSubmitting}
                  variant={actionType === "approve" ? "primary" : "danger"}
                >
                  {actionType === "approve"
                    ? "Approve Application"
                    : "Reject Application"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

interface ApplicationCardProps {
  application: MentorApplication;
  onApprove?: () => void;
  onReject?: () => void;
  onView: () => void;
  isPending: boolean;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onApprove,
  onReject,
  onView,
  isPending,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
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
            <h3 className="text-lg font-semibold text-gray-900">
              {application.name}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                application.status
              )}`}
            >
              {application.status}
            </span>
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <Mail className="h-4 w-4 mr-2" />
            <span>{application.email}</span>
          </div>

          <div className="flex items-center text-gray-600 mb-3">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Applied {formatDate(application.appliedAt)}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {application.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
            {application.skills.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{application.skills.length - 4} more
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700 line-clamp-2">
            {application.bio}
          </p>
        </div>

        <div className="flex flex-col space-y-2 ml-6">
          <Button
            size="sm"
            variant="outline"
            onClick={onView}
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>

          {isPending && onApprove && onReject && (
            <>
              <Button
                size="sm"
                onClick={onApprove}
                className="flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                className="flex items-center text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
