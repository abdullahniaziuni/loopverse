import React, { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
  alternateLanguages?: Array<{
    hrefLang: string;
    href: string;
  }>;
  structuredData?: object;
}

const defaultSEO = {
  title: "SkillSphere - Real-Time Microlearning & Mentorship Platform",
  description:
    "Connect with expert mentors for personalized, bite-sized learning sessions. Master new skills through real-time video calls, interactive sessions, and AI-powered recommendations.",
  keywords: [
    "online learning",
    "mentorship",
    "skill development",
    "video tutoring",
    "real-time learning",
    "expert mentors",
    "microlearning",
    "professional development",
    "coding bootcamp",
    "tech skills",
  ],
  image: "/images/og-image.jpg",
  type: "website" as const,
  author: "SkillSphere Team",
};

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  noIndex = false,
  noFollow = false,
  canonical,
  alternateLanguages,
  structuredData,
}) => {
  const seoTitle = title ? `${title} | SkillSphere` : defaultSEO.title;
  const seoDescription = description || defaultSEO.description;
  const seoKeywords = keywords || defaultSEO.keywords;
  const seoImage = image || defaultSEO.image;
  const seoUrl = url || window.location.href;
  const seoAuthor = author || defaultSEO.author;

  // Generate robots meta tag
  const robotsContent = [];
  if (noIndex) robotsContent.push("noindex");
  if (noFollow) robotsContent.push("nofollow");
  const robots =
    robotsContent.length > 0 ? robotsContent.join(", ") : "index, follow";

  // Generate structured data for the organization
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SkillSphere",
    description: defaultSEO.description,
    url: "https://skillsphere.com",
    logo: "https://skillsphere.com/images/logo.png",
    sameAs: [
      "https://twitter.com/skillsphere",
      "https://linkedin.com/company/skillsphere",
      "https://github.com/skillsphere",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-555-SKILL",
      contactType: "customer service",
      email: "support@skillsphere.com",
    },
  };

  // Generate website structured data
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SkillSphere",
    url: "https://skillsphere.com",
    description: defaultSEO.description,
    potentialAction: {
      "@type": "SearchAction",
      target: "https://skillsphere.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  // Generate educational organization structured data
  const educationalStructuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "SkillSphere",
    description:
      "Online learning platform connecting learners with expert mentors",
    url: "https://skillsphere.com",
    logo: "https://skillsphere.com/images/logo.png",
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      name: "SkillSphere Completion Certificate",
      description:
        "Certificate awarded upon successful completion of mentorship sessions",
    },
  };

  // Combine all structured data
  const allStructuredData = [
    organizationStructuredData,
    websiteStructuredData,
    educationalStructuredData,
  ];

  if (structuredData) {
    allStructuredData.push(structuredData);
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords.join(", ")} />
      <meta name="author" content={seoAuthor} />
      <meta name="robots" content={robots} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="SkillSphere" />
      <meta property="og:locale" content="en_US" />

      {/* Article specific Open Graph tags */}
      {type === "article" && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {section && <meta property="article:section" content={section} />}
          {tags &&
            tags.map((tag, index) => (
              <meta key={index} property="article:tag" content={tag} />
            ))}
          <meta property="article:author" content={seoAuthor} />
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      <meta name="twitter:site" content="@skillsphere" />
      <meta name="twitter:creator" content="@skillsphere" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="application-name" content="SkillSphere" />
      <meta name="apple-mobile-web-app-title" content="SkillSphere" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link rel="manifest" href="/manifest.json" />

      {/* Alternate Language Links */}
      {alternateLanguages &&
        alternateLanguages.map((lang, index) => (
          <link
            key={index}
            rel="alternate"
            hrefLang={lang.hrefLang}
            href={lang.href}
          />
        ))}

      {/* Preconnect to External Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="preconnect" href="https://api.skillsphere.com" />

      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//api.skillsphere.com" />

      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </Helmet>
  );
};

// Specific SEO components for different page types
export const HomePageSEO: React.FC<Partial<SEOProps>> = (props) => (
  <SEOHead
    title="Learn from Expert Mentors"
    description="Join SkillSphere to connect with industry experts for personalized learning sessions. Master programming, design, business skills and more through real-time video mentorship."
    keywords={[
      "online mentorship",
      "learn programming",
      "skill development",
      "expert tutors",
      "real-time learning",
      "video sessions",
    ]}
    {...props}
  />
);

export const MentorProfileSEO: React.FC<
  { mentorName: string; skills: string[] } & Partial<SEOProps>
> = ({ mentorName, skills, ...props }) => (
  <SEOHead
    title={`${mentorName} - Expert Mentor`}
    description={`Learn ${skills.join(
      ", "
    )} from ${mentorName}, an expert mentor on SkillSphere. Book personalized learning sessions and accelerate your skill development.`}
    keywords={[...skills, "mentor", "tutor", "expert", "learning"]}
    type="profile"
    {...props}
  />
);

export const SessionSEO: React.FC<
  { topic: string; mentorName: string } & Partial<SEOProps>
> = ({ topic, mentorName, ...props }) => (
  <SEOHead
    title={`${topic} Session with ${mentorName}`}
    description={`Join a live learning session on ${topic} with expert mentor ${mentorName}. Interactive video call with screen sharing and real-time collaboration.`}
    keywords={[topic, "learning session", "video call", "mentorship"]}
    type="article"
    {...props}
  />
);

export const SearchSEO: React.FC<{ query?: string } & Partial<SEOProps>> = ({
  query,
  ...props
}) => (
  <SEOHead
    title={query ? `Search Results for "${query}"` : "Find Expert Mentors"}
    description={
      query
        ? `Find expert mentors for ${query} on SkillSphere. Browse profiles, read reviews, and book personalized learning sessions.`
        : "Search and discover expert mentors across various skills and technologies. Find the perfect mentor for your learning journey."
    }
    keywords={
      query
        ? [query, "mentors", "tutors", "experts"]
        : ["find mentors", "search tutors", "expert directory"]
    }
    noIndex={!query} // Don't index empty search pages
    {...props}
  />
);

export default SEOHead;
