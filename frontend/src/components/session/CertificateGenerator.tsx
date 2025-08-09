import React, { useState } from 'react';
import { Download, Award, Calendar, Clock, User } from 'lucide-react';
import { Button } from '../ui';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils';

interface CertificateData {
  learnerName: string;
  mentorName: string;
  sessionTopic: string;
  sessionDate: string;
  duration: number;
  skills: string[];
  sessionId: string;
}

interface CertificateGeneratorProps {
  sessionData: CertificateData;
  onClose?: () => void;
}

export const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  sessionData,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const generateCertificate = async () => {
    setIsGenerating(true);
    
    try {
      // Create certificate content
      const certificateHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>SkillSphere Learning Certificate</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              margin: 0;
              padding: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .certificate {
              background: white;
              padding: 60px;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 800px;
              width: 100%;
              text-align: center;
              border: 8px solid #f8f9fa;
              position: relative;
            }
            .certificate::before {
              content: '';
              position: absolute;
              top: 20px;
              left: 20px;
              right: 20px;
              bottom: 20px;
              border: 3px solid #3b82f6;
              border-radius: 12px;
            }
            .header {
              margin-bottom: 40px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .title {
              font-size: 48px;
              color: #1f2937;
              margin: 20px 0;
              font-weight: bold;
            }
            .subtitle {
              font-size: 18px;
              color: #6b7280;
              margin-bottom: 40px;
            }
            .recipient {
              font-size: 36px;
              color: #1f2937;
              margin: 30px 0;
              font-weight: bold;
              border-bottom: 2px solid #3b82f6;
              display: inline-block;
              padding-bottom: 10px;
            }
            .content {
              font-size: 18px;
              line-height: 1.6;
              color: #374151;
              margin: 30px 0;
            }
            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 40px 0;
              text-align: left;
            }
            .detail-item {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .detail-label {
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .detail-value {
              color: #6b7280;
            }
            .skills {
              margin: 30px 0;
            }
            .skill-tag {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              margin: 5px;
              font-size: 14px;
            }
            .footer {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .signature {
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #1f2937;
              width: 200px;
              margin: 20px auto 10px;
            }
            .date {
              color: #6b7280;
              font-size: 14px;
            }
            .verification {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="logo">🎓 SkillSphere</div>
              <div class="title">Certificate of Completion</div>
              <div class="subtitle">This is to certify that</div>
            </div>
            
            <div class="recipient">${sessionData.learnerName}</div>
            
            <div class="content">
              has successfully completed a mentoring session on
              <strong>${sessionData.sessionTopic}</strong>
              with mentor <strong>${sessionData.mentorName}</strong>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">📅 Session Date</div>
                <div class="detail-value">${formatDate(sessionData.sessionDate)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">⏱️ Duration</div>
                <div class="detail-value">${sessionData.duration} minutes</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">👨‍🏫 Mentor</div>
                <div class="detail-value">${sessionData.mentorName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">🆔 Session ID</div>
                <div class="detail-value">${sessionData.sessionId}</div>
              </div>
            </div>
            
            <div class="skills">
              <div style="margin-bottom: 15px; font-weight: bold; color: #1f2937;">Skills Covered:</div>
              ${sessionData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            
            <div class="footer">
              <div class="signature">
                <div class="signature-line"></div>
                <div style="font-weight: bold;">SkillSphere Platform</div>
                <div class="date">Issued on ${formatDate(new Date().toISOString())}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 48px; color: #3b82f6;">🏆</div>
              </div>
            </div>
            
            <div class="verification">
              Certificate ID: CERT-${sessionData.sessionId}-${Date.now()}<br>
              Verify at: skillsphere.com/verify
            </div>
          </div>
        </body>
        </html>
      `;

      // Create and download the certificate
      const blob = new Blob([certificateHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SkillSphere_Certificate_${sessionData.learnerName.replace(/\s+/g, '_')}_${sessionData.sessionId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Certificate generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      showError('Failed to generate certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Generate Certificate
        </h3>
        <p className="text-gray-600">
          Create a completion certificate for this learning session
        </p>
      </div>

      {/* Session Details Preview */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Session Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <User className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-600">Learner:</span>
            <span className="ml-1 font-medium">{sessionData.learnerName}</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-600">Mentor:</span>
            <span className="ml-1 font-medium">{sessionData.mentorName}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-600">Date:</span>
            <span className="ml-1 font-medium">{formatDate(sessionData.sessionDate)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-gray-600">Duration:</span>
            <span className="ml-1 font-medium">{sessionData.duration} minutes</span>
          </div>
        </div>
        
        {sessionData.skills.length > 0 && (
          <div className="mt-3">
            <span className="text-gray-600 text-sm">Skills:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {sessionData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <Button
          onClick={generateCertificate}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Certificate
            </>
          )}
        </Button>
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Certificate will be downloaded as an HTML file that can be printed or saved as PDF
      </div>
    </div>
  );
};
