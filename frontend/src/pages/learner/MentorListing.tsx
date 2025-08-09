import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Star, MapPin, Clock } from "lucide-react";
import { Layout } from "../../components/layout";
import { Button, Input, Select } from "../../components/ui";
import { generateMockMentors, renderStars } from "../../utils";
import { Mentor } from "../../types";

export const MentorListing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  const allMentors = generateMockMentors();

  // Get unique skills for filter
  const allSkills = Array.from(
    new Set(allMentors.flatMap((mentor) => mentor.skills))
  ).sort();

  // Filter and sort mentors
  const filteredMentors = allMentors
    .filter((mentor) => {
      const matchesSearch =
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.skills.some((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesSkill =
        !selectedSkill || mentor.skills.includes(selectedSkill);
      return matchesSearch && matchesSkill && mentor.isApproved;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "sessions":
          return b.totalSessions - a.totalSessions;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const skillOptions = [
    { value: "", label: "All Skills" },
    ...allSkills.map((skill) => ({ value: skill, label: skill })),
  ];

  const sortOptions = [
    { value: "rating", label: "Highest Rated" },
    { value: "sessions", label: "Most Sessions" },
    { value: "name", label: "Name (A-Z)" },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Find Your Perfect Mentor
          </h1>
          <p className="text-gray-600 mt-2">
            Connect with expert mentors who can guide you on your learning
            journey.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select
                options={skillOptions}
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                placeholder="Filter by skill"
              />
            </div>
            <div>
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {filteredMentors.length} mentor
            {filteredMentors.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Mentor Grid */}
        {filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No mentors found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedSkill("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

interface MentorCardProps {
  mentor: Mentor;
}

const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
  return (
    <div className="glass-card rounded-2xl p-6 hover-lift hover-glow group transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 relative">
          <img
            className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white/50 group-hover:ring-blue-500/50 transition-all duration-300"
            src={
              mentor.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                mentor.name
              )}&background=3B82F6&color=fff`
            }
            alt={mentor.name}
          />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate group-hover:gradient-text transition-all duration-300">
            {mentor.name}
          </h3>
          <div className="flex items-center mt-1">
            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-yellow-700 ml-1">
                {mentor.rating}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({mentor.totalSessions} sessions)
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mt-4 line-clamp-3 leading-relaxed">
        {mentor.bio}
      </p>

      {/* Enhanced Skills */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {mentor.skills.slice(0, 3).map((skill, index) => (
            <span
              key={skill}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 ${
                index === 0
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  : index === 1
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white"
              }`}
            >
              {skill}
            </span>
          ))}
          {mentor.skills.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full hover:bg-gray-200 transition-colors duration-300">
              +{mentor.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Price and Action */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-2xl font-bold gradient-text">
            ${mentor.hourlyRate}
          </span>
          <span className="text-gray-500 font-medium">/hour</span>
        </div>
        <Link to={`/mentors/${mentor.id}`}>
          <Button
            size="sm"
            className="group-hover:scale-105 transition-transform duration-300"
          >
            View Profile
          </Button>
        </Link>
      </div>
    </div>
  );
};
