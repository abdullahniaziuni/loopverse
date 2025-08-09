import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  X,
  ChevronDown,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Layout } from "../../components/layout";
import { Button, Input, Select } from "../../components/ui";
import { renderStars, COMMON_TIMEZONES, getUserTimezone } from "../../utils";
import { Mentor } from "../../types";
import { apiService } from "../../services/api";

export const MentorListing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRating: 0,
    maxPrice: 1000,
    timezone: "",
    availability: "",
    experience: "",
    languages: [] as string[],
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Fetch mentors from API
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getMentors({
          page: 1,
          limit: 50, // Get more mentors for better filtering
        });

        if (response.success && response.data) {
          setMentors(response.data.mentors);
        } else {
          setError(response.error || "Failed to fetch mentors");
        }
      } catch (err) {
        setError("Failed to fetch mentors");
        console.error("Error fetching mentors:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Hindi",
  ];
  const experienceLevels = [
    "1-2 years",
    "3-5 years",
    "5-10 years",
    "10+ years",
  ];

  // Filter management
  const applyFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    if (value && !activeFilters.includes(key)) {
      setActiveFilters((prev) => [...prev, key]);
    } else if (!value && activeFilters.includes(key)) {
      setActiveFilters((prev) => prev.filter((f) => f !== key));
    }
  };

  const removeFilter = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]:
        key === "languages"
          ? []
          : key === "minRating"
          ? 0
          : key === "maxPrice"
          ? 1000
          : "",
    }));
    setActiveFilters((prev) => prev.filter((f) => f !== key));
  };

  const clearAllFilters = () => {
    setFilters({
      minRating: 0,
      maxPrice: 1000,
      timezone: "",
      availability: "",
      experience: "",
      languages: [],
    });
    setActiveFilters([]);
  };

  // Get unique skills for filter
  const allSkills = Array.from(
    new Set(
      mentors.flatMap(
        (mentor) =>
          mentor.skills?.map((skill) =>
            typeof skill === "string" ? skill : skill.name
          ) || []
      )
    )
  ).sort();

  // Filter and sort mentors
  const filteredMentors = mentors
    .filter((mentor) => {
      const skillNames =
        mentor.skills?.map((skill) =>
          typeof skill === "string" ? skill : skill.name
        ) || [];

      const matchesSearch =
        mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skillNames.some((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        mentor.expertise?.some((exp) =>
          exp.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesSkill = !selectedSkill || skillNames.includes(selectedSkill);

      // Advanced filters
      const matchesRating = mentor.rating >= filters.minRating;
      const matchesPrice =
        !mentor.hourlyRate || mentor.hourlyRate <= filters.maxPrice;
      const matchesTimezone =
        !filters.timezone || mentor.timezone === filters.timezone;
      const matchesExperience =
        !filters.experience || mentor.experience === filters.experience;
      const matchesLanguages =
        filters.languages.length === 0 ||
        filters.languages.some((lang) => mentor.languages?.includes(lang));

      return (
        matchesSearch &&
        matchesSkill &&
        matchesRating &&
        matchesPrice &&
        matchesTimezone &&
        matchesExperience &&
        matchesLanguages
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price":
          return (a.hourlyRate || 0) - (b.hourlyRate || 0);
        case "experience":
          return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
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
    { value: "price", label: "Lowest Price" },
    { value: "experience", label: "Most Experience" },
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

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-2"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        )}

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

          {/* Advanced Filters Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
              <ChevronDown
                className={`h-4 w-4 ml-2 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </Button>

            {activeFilters.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {activeFilters.length} filter(s) active
                </span>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) =>
                      applyFilter("minRating", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price ($/hour)
                  </label>
                  <select
                    value={filters.maxPrice}
                    onChange={(e) =>
                      applyFilter("maxPrice", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1000}>Any Price</option>
                    <option value={25}>Under $25</option>
                    <option value={50}>Under $50</option>
                    <option value={100}>Under $100</option>
                    <option value={200}>Under $200</option>
                  </select>
                </div>

                {/* Timezone Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={filters.timezone}
                    onChange={(e) => applyFilter("timezone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Timezone</option>
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Experience Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={filters.experience}
                    onChange={(e) => applyFilter("experience", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Experience</option>
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Languages Filter */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((language) => (
                      <button
                        key={language}
                        onClick={() => {
                          const newLanguages = filters.languages.includes(
                            language
                          )
                            ? filters.languages.filter((l) => l !== language)
                            : [...filters.languages, language];
                          applyFilter("languages", newLanguages);
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.languages.includes(language)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilters.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filterKey) => (
                      <span
                        key={filterKey}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {filterKey === "minRating" &&
                          `${filters.minRating}+ Stars`}
                        {filterKey === "maxPrice" &&
                          `Under $${filters.maxPrice}`}
                        {filterKey === "timezone" &&
                          COMMON_TIMEZONES.find(
                            (tz) => tz.value === filters.timezone
                          )?.abbreviation}
                        {filterKey === "experience" && filters.experience}
                        {filterKey === "languages" &&
                          `${filters.languages.length} language(s)`}
                        <button
                          onClick={() => removeFilter(filterKey)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
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
          </>
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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 relative">
          <img
            className="h-16 w-16 rounded-lg object-cover"
            src={
              mentor.profilePicture ||
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
                {mentor.rating || 0}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({mentor.totalRatings || 0} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mt-4 line-clamp-3 leading-relaxed">
        {mentor.biography || mentor.bio}
      </p>

      {/* Enhanced Skills */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {(mentor.skills || []).slice(0, 3).map((skill, index) => {
            const skillName = typeof skill === "string" ? skill : skill.name;
            return (
              <span
                key={skillName}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-105 ${
                  index === 0
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    : index === 1
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white"
                }`}
              >
                {skillName}
              </span>
            );
          })}
          {(mentor.skills || []).length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full hover:bg-gray-200 transition-colors duration-300">
              +{(mentor.skills || []).length - 3} more
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
