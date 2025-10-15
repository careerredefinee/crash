// Tools page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tool modals
    initializeToolModals();
});

// Open chatbot
function openChatbot() {
    toggleChat();
}

// Open resume analyzer
function openResumeAnalyzer() {
    const modal = new bootstrap.Modal(document.getElementById('resumeAnalyzerModal'));
    modal.show();
}

// Open debt AI
function openDebtAI() {
    const modal = new bootstrap.Modal(document.getElementById('debtAIModal'));
    modal.show();
}

// SKILL ASSESSMENT (clean numbering + clear button)
async function runSkillAssessment() {
    const skills = document.getElementById('userSkills').value.trim();
    const result = document.getElementById('skillAssessmentResult');

    if (!skills) {
        showAlert('Please enter your skills', 'warning');
        return;
    }

    document.getElementById('skillAssessmentForm').style.display = 'none';
    result.style.display = 'block';
    result.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary"></div>
            <p class="mt-3">Analyzing skills: <strong>${skills}</strong></p>
        </div>
    `;

    try {
        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Analyze these skills: ${skills}. 
                Provide strengths, weaknesses, and career tips in 25+ bullet points.
                Do not use markdown, stars, or double numbering. Use plain text only.`
            })
        });

        const data = await res.json();

        // Clean and split lines
        const points = data.result
            .split('\n')
            .map(p => p
                .replace(/[*#_`]/g, '')       // remove markdown characters
                .replace(/^\d+[\.\)]\s*/, '') // remove any leading numbers
                .trim()
            )
            .filter(p => p.length > 0);

        let currentIndex = 0;
        const pageSize = 5;
        let suggestionCounter = 0; // Track numbering for actual suggestions

        function renderPoints() {
            const visible = points
                .slice(currentIndex, currentIndex + pageSize)
                .map(p => {
                    if (p.endsWith(':')) {
                        // Heading - no number
                        return `<li class="list-group-item fw-bold">${p}</li>`;
                    } else {
                        suggestionCounter++;
                        return `<li class="list-group-item">${suggestionCounter}. ${p}</li>`;
                    }
                })
                .join('');

            const hasMore = currentIndex + pageSize < points.length;

            result.innerHTML = `
                <div class="alert alert-success"><strong>Skill Analysis for:</strong> ${skills}</div>
                <ul class="list-group list-unstyled">${visible}</ul>
                <div class="text-center mt-3">
                    ${hasMore ? `<button class="btn btn-outline-primary me-2" id="showMoreSkill">Show More</button>` : ''}
                    <button class="btn btn-outline-danger" id="clearSkill">Clear</button>
                </div>
            `;

            // Show More
            const btn = document.getElementById('showMoreSkill');
            if (btn) {
                btn.onclick = () => {
                    currentIndex += pageSize;
                    renderPoints();
                };
            }

            // Clear button
            document.getElementById('clearSkill').onclick = () => {
                document.getElementById('skillAssessmentForm').style.display = 'block';
                result.style.display = 'none';
                document.getElementById('userSkills').value = '';
                suggestionCounter = 0; // reset numbering
            };
        }

        renderPoints();
    } catch (err) {
        console.error('Gemini error:', err);
        result.innerHTML = `<div class="alert alert-danger">Failed to fetch AI result.</div>`;
    }
}

// INTERVIEW PREP (fixed numbering)
async function runInterviewPrep() {
    const role = document.getElementById('jobRole').value.trim();
    const result = document.getElementById('interviewPrepResult');

    if (!role) {
        showAlert('Please enter a job role', 'warning');
        return;
    }

    document.getElementById('interviewPrepForm').style.display = 'none';
    result.style.display = 'block';
    result.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-warning"></div>
            <p class="mt-3">Generating interview questions for: <strong>${role}</strong></p>
        </div>
    `;

    async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
        for (let i = 0; i < retries; i++) {
            const res = await fetch(url, options);
            if (res.status !== 503) return res;
            await new Promise(r => setTimeout(r, delay));
        }
        throw new Error('Service still unavailable after retries.');
    }

    try {
        const res = await fetchWithRetry('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Based on the job role: ${role}, list 25+ short interview questions and preparation tips. 
                Do not use markdown formatting, stars, or double numbering. Use plain text.`
            })
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        if (data.error) {
            result.innerHTML = `<div class="alert alert-warning">${data.error}</div>`;
            return;
        }

        const points = data.result
            .split('\n')
            .map(p => p
                .replace(/[*#_`]/g, '')       // remove markdown symbols
                .replace(/^\d+[\.\)]\s*/, '') // remove leading numbers
                .trim()
            )
            .filter(p => p.length > 0);

        let currentIndex = 0;
        const pageSize = 5;
        let questionCounter = 0; // Counter for actual numbered questions

        function renderPoints() {
            const visible = points
                .slice(currentIndex, currentIndex + pageSize)
                .map(p => {
                    if (p.endsWith(':')) {
                        // Heading - no number, no counter increment
                        return `<li class="list-group-item fw-bold">${p}</li>`;
                    } else {
                        // Question - increment counter
                        questionCounter++;
                        return `<li class="list-group-item">${questionCounter}. ${p}</li>`;
                    }
                })
                .join('');

            const hasMore = currentIndex + pageSize < points.length;

            result.innerHTML = `
                <div class="alert alert-primary"><strong>Interview Prep for:</strong> ${role}</div>
                <ul class="list-group list-unstyled">${visible}</ul>
                <div class="text-center mt-3">
                    ${hasMore ? `<button class="btn btn-outline-warning me-2" id="showMoreInterview">Show More</button>` : ''}
                    <button class="btn btn-outline-danger" id="clearInterview">Clear</button>
                </div>
            `;

            const btnShowMore = document.getElementById('showMoreInterview');
            if (btnShowMore) {
                btnShowMore.onclick = () => {
                    currentIndex += pageSize;
                    renderPoints();
                };
            }

            document.getElementById('clearInterview').onclick = () => {
                document.getElementById('interviewPrepForm').style.display = 'block';
                result.style.display = 'none';
                document.getElementById('jobRole').value = '';
                questionCounter = 0; // reset for next run
            };
        }

        renderPoints();

    } catch (err) {
        console.error('Gemini error:', err);
        result.innerHTML = `
            <div class="alert alert-danger">
                🚧 The interview generator is busy or unavailable. Please try again in a minute.
            </div>
        `;
    }
}

// CAREER PREDICTOR (clean numbering + clear button)
async function runCareerPredictor() {
    const interests = document.getElementById('interests').value.trim();
    const result = document.getElementById('careerPredictorResult');

    if (!interests) {
        showAlert('Please enter your interests', 'warning');
        return;
    }

    document.getElementById('careerPredictorForm').style.display = 'none';
    result.style.display = 'block';
    result.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-info"></div>
            <p class="mt-3">Analyzing interests: <strong>${interests}</strong></p>
        </div>
    `;

    try {
        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Based on these interests: ${interests}, suggest 25+ short bullet points including potential career paths, job roles, and a future roadmap.
                Do not use markdown, stars, or double numbering. Use plain text only.`
            })
        });

        const data = await res.json();

        // Clean and split lines
        const points = data.result
            .split('\n')
            .map(p => p
                .replace(/[*#_`]/g, '')       // remove markdown
                .replace(/^\d+[\.\)]\s*/, '') // remove leading numbers
                .trim()
            )
            .filter(p => p.length > 0);

        let currentIndex = 0;
        const pageSize = 5;
        let suggestionCounter = 0; // Numbering for actual suggestions

        function renderPoints() {
            const visible = points
                .slice(currentIndex, currentIndex + pageSize)
                .map(p => {
                    if (p.endsWith(':')) {
                        // Heading - no number
                        return `<li class="list-group-item fw-bold">${p}</li>`;
                    } else {
                        // Increment numbering for actual suggestions
                        suggestionCounter++;
                        return `<li class="list-group-item">${suggestionCounter}. ${p}</li>`;
                    }
                })
                .join('');

            const hasMore = currentIndex + pageSize < points.length;

            result.innerHTML = `
                <div class="alert alert-info"><strong>Career Path Suggestions based on:</strong> ${interests}</div>
                <ul class="list-group list-unstyled">${visible}</ul>
                <div class="text-center mt-3">
                    ${hasMore ? `<button class="btn btn-outline-info me-2" id="showMoreCareer">Show More</button>` : ''}
                    <button class="btn btn-outline-danger" id="clearCareer">Clear</button>
                </div>
            `;

            // Show more button
            const btn = document.getElementById('showMoreCareer');
            if (btn) {
                btn.onclick = () => {
                    currentIndex += pageSize;
                    renderPoints();
                };
            }

            // Clear button
            document.getElementById('clearCareer').onclick = () => {
                document.getElementById('careerPredictorForm').style.display = 'block';
                result.style.display = 'none';
                document.getElementById('interests').value = '';
                suggestionCounter = 0; // reset numbering
            };
        }

        renderPoints();
    } catch (err) {
        console.error('Gemini error:', err);
        result.innerHTML = `<div class="alert alert-danger">Failed to fetch AI result.</div>`;
    }
}

// Analyze resume
async function analyzeResume() {
    const fileInput = document.getElementById('resumeFile');
    if (!fileInput) {
        console.error('Resume file input not found');
        alert('Error: Resume upload functionality not available');
        return;
    }

    const file = fileInput.files[0];
    const resultSection = document.getElementById('resumeAnalysisResult');
    
    if (!file) {
        showAlert('Please select a resume file to analyze', 'warning');
        return;
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('Please upload a PDF, DOC, or DOCX file', 'danger');
        return;
    }
    
    // Show loading state
    if (resultSection) {
        resultSection.style.display = 'block';
        resultSection.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Uploading...</span>
                </div>
                <p class="mt-3">Uploading your resume...</p>
            </div>
        `;
    } else {
        console.error('Result section not found');
        alert('Error: Could not display upload status');
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('resume', file);
    
    console.log("📤 Sending resume to backend...", file.name, file.type, file.size, "bytes");
    
    try {
        // Upload to backend
        const res = await fetch('/api/resumes', {
            method: 'POST',
            body: formData,
            credentials: 'include' // Important for sending cookies/session
        });
        
        console.log("📥 Response status:", res.status);
        const responseData = await res.json().catch(() => ({}));
        
        if (!res.ok) {
            console.error('Upload failed:', responseData);
            let errorMessage = 'Failed to upload resume';
            
            if (res.status === 401) {
                errorMessage = 'Your session has expired. Please log in again.';
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                }, 2000);
            } else if (responseData.error) {
                errorMessage = responseData.error;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = responseData;
        console.log("✅ Resume uploaded successfully:", data);
        
        if (!data || !data.resume) {
            throw new Error('Invalid response from server. Please try again.');
        }
        
        // Show analysis in progress
        resultSection.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Analyzing...</span>
                </div>
                <p class="mt-3">Analyzing your resume with AI...</p>
            </div>
        `;
        
        // Call Gemini AI for real analysis with structured prompt
        try {
            const aiRes = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Analyze this resume in detail. Provide a structured response with these sections:
                    
1. ATS Score: [Score as X/10 or X%] - Evaluate how well this resume will perform in Applicant Tracking Systems.

2. Summary: [Brief 2-3 sentence overview of the resume's overall quality and content]

3. Key Strengths:
   - List 3-5 key strengths of this resume
   - Focus on content, formatting, and ATS optimization
   
4. Areas for Improvement:
   - List 3-5 specific, actionable improvements
   - Focus on content gaps, formatting issues, and ATS optimization
   
5. Keywords & Skills:
   - List relevant keywords and skills that should be included
   - Categorize as Technical Skills, Soft Skills, Tools, etc.
   
6. Additional Recommendations:
   - Any other suggestions for improvement
   - Formatting tips
   - Industry-specific advice

Resume URL: ${data.resume.url}

Format the response with clear section headers and bullet points.`
                })
            });
            const aiData = await aiRes.json();
            if (!aiRes.ok || !aiData.result) {
                throw new Error(aiData.error || 'Failed to analyze resume');
            }
            // Parse and format the AI analysis result
            const formatAnalysis = (text) => {
                // Extract ATS Score if present
                const atsMatch = text.match(/ATS Score:?\s*([\d.]+\/10|\d+%)/i);
                const atsScore = atsMatch ? atsMatch[1] : 'Not Specified';
                
                // Extract sections using common section headers
                const sections = {
                    summary: extractSection(text, 'Summary|Overview|Analysis'),
                    strengths: extractSection(text, 'Strengths|Strong Points|Key Strengths'),
                    improvements: extractSection(text, 'Improvements|Areas for Improvement|Recommendations'),
                    keywords: extractSection(text, 'Keywords|Key Terms|Skills'),
                    additional: extractSection(text, 'Additional Notes|Final Thoughts|Conclusion')
                };
                
                // Build the HTML
                let html = `
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Resume Analysis Results</h5>
                        </div>
                        <div class="card-body">
                            <div class="ats-score mb-4 p-3 bg-light rounded">
                                <h6 class="text-muted mb-2">ATS Score</h6>
                                <div class="d-flex align-items-center">
                                    <div class="progress flex-grow-1 me-3" style="height: 24px;">
                                        <div class="progress-bar bg-success" role="progressbar" 
                                             style="width: ${parseInt(atsScore) || 0}%" 
                                             aria-valuenow="${parseInt(atsScore) || 0}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                        </div>
                                    </div>
                                    <span class="fw-bold">${atsScore}</span>
                                </div>
                            </div>
                `;
                
                // Add each section if it exists
                if (sections.summary) {
                    html += `
                        <div class="mb-4">
                            <h6 class="text-primary">Summary</h6>
                            <div class="ps-3">${formatBulletPoints(sections.summary)}</div>
                        </div>
                    `;
                }
                
                if (sections.strengths) {
                    html += `
                        <div class="mb-4">
                            <h6 class="text-success">Strengths</h6>
                            <div class="ps-3">${formatBulletPoints(sections.strengths)}</div>
                        </div>
                    `;
                }
                
                if (sections.improvements) {
                    html += `
                        <div class="mb-4">
                            <h6 class="text-warning">Areas for Improvement</h6>
                            <div class="ps-3">${formatBulletPoints(sections.improvements)}</div>
                        </div>
                    `;
                }
                
                if (sections.keywords) {
                    html += `
                        <div class="mb-4">
                            <h6 class="text-info">Key Skills & Keywords</h6>
                            <div class="d-flex flex-wrap gap-2">
                                ${sections.keywords.split(/[,\n]+/).filter(k => k.trim()).map(k => 
                                    `<span class="badge bg-info text-dark">${k.trim()}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `;
                }
                
                if (sections.additional) {
                    html += `
                        <div class="mt-4 pt-3 border-top">
                            <h6 class="text-muted">Additional Notes</h6>
                            <div class="ps-3">${formatBulletPoints(sections.additional)}</div>
                        </div>
                    `;
                }
                
                // Close card and add action button
                html += `
                        </div>
                        <div class="card-footer bg-light d-flex justify-content-between align-items-center">
                            <small class="text-muted">Analysis generated on ${new Date().toLocaleDateString()}</small>
                            <button class="btn btn-outline-primary btn-sm" onclick="resetResumeAnalyzer()">
                                <i class="fas fa-redo me-1"></i> Analyze Another Resume
                            </button>
                        </div>
                    </div>
                `;
                
                return html;
            };
            
            // Helper function to extract section content
            const extractSection = (text, sectionName) => {
                const regex = new RegExp(`(${sectionName}):?\s*([\s\S]*?)(?=\n\w+:|$)`,'i');
                const match = text.match(regex);
                return match ? match[2].trim() : '';
            };
            
            // Helper function to format text with bullet points
            const formatBulletPoints = (text) => {
                // Split by newlines and filter out empty lines
                const points = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                // Convert to HTML list
                return `
                    <ul class="mb-0">
                        ${points.map(point => 
                            `<li class="mb-2">${point.replace(/^[-•*]\s*/, '')}</li>`
                        ).join('')}
                    </ul>
                `;
            };
            
            // Display the formatted analysis
            resultSection.innerHTML = formatAnalysis(aiData.result);
        } catch (aiError) {
            resultSection.innerHTML = `
                <div class="alert alert-danger">
                    <h5 class="alert-heading">Analysis Failed</h5>
                    <p>${aiError.message || 'An error occurred while analyzing your resume.'}</p>
                    <hr>
                    <button class="btn btn-outline-secondary btn-sm" onclick="resetResumeAnalyzer()">
                        Try Again
                    </button>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('💥 Error uploading resume:', error);
        
        // Show error to user
            if (resultSection) {
                resultSection.innerHTML = `
                    <div class="alert alert-danger">
                        <h5 class="alert-heading">Upload Failed</h5>
                        <p>${error.message || 'An error occurred while uploading your resume. Please try again.'}</p>
                        <hr>
                        <button class="btn btn-outline-secondary btn-sm" onclick="window.location.reload()">
                            Try Again
                        </button>
                    </div>
                `;
            } else {
                alert(`Upload failed: ${error.message || 'An error occurred while uploading your resume'}`);
            }
    }
}

// Generate resume analysis result
function generateResumeAnalysis(fileName, resumeData) {
    const analysisDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="analysis-result">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="mb-0">Resume Analysis Report</h4>
                <div class="text-muted small">Analyzed on ${analysisDate}</div>
            </div>
            <div class="alert alert-info">
                <i class="fas fa-file-alt me-2"></i>
                <strong>${fileName}</strong>
                ${resumeData?.url ? `
                    <div class="mt-2">
                        <a href="${resumeData.url}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-eye me-1"></i> View Uploaded Resume
                        </a>
                    </div>
                ` : ''}
            </div>
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                Analysis completed for: <strong>${fileName}</strong>
            </div>
            
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="text-center p-3 bg-light rounded">
                        <h4 class="text-success">85%</h4>
                        <small>ATS Score</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-light rounded">
                        <h4 class="text-primary">12</h4>
                        <small>Keywords Found</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-light rounded">
                        <h4 class="text-warning">3</h4>
                        <small>Improvements</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center p-3 bg-light rounded">
                        <h4 class="text-info">A-</h4>
                        <small>Overall Grade</small>
                    </div>
                </div>
            </div>
            
            <h5 class="mb-3">Strengths</h5>
            <ul class="list-group mb-4">
                <li class="list-group-item">
                    <i class="fas fa-check text-success me-2"></i>
                    Strong technical skills section
                </li>
                <li class="list-group-item">
                    <i class="fas fa-check text-success me-2"></i>
                    Clear work experience descriptions
                </li>
                <li class="list-group-item">
                    <i class="fas fa-check text-success me-2"></i>
                    Good use of action verbs
                </li>
            </ul>
            
            <h5 class="mb-3">Recommendations</h5>
            <ul class="list-group mb-4">
                <li class="list-group-item">
                    <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                    Add more industry-specific keywords
                </li>
                <li class="list-group-item">
                    <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                    Include quantifiable achievements
                </li>
                <li class="list-group-item">
                    <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                    Consider adding a professional summary
                </li>
            </ul>
            
            <div class="text-center">
                <button class="btn btn-primary me-2" onclick="resetResumeAnalyzer()">
                    <i class="fas fa-upload me-2"></i>Analyze Another Resume
                </button>
                <button class="btn btn-outline-primary" onclick="downloadReport()">
                    <i class="fas fa-download me-2"></i>Download Report
                </button>
            </div>
        </div>
    `;
}

// Reset resume analyzer
function resetResumeAnalyzer() {
    document.getElementById('resumeUploadSection').style.display = 'block';
    document.getElementById('resumeAnalysisResult').style.display = 'none';
    document.getElementById('resumeFile').value = '';
}

// Download report
function downloadReport() {
    showAlert('Report download feature coming soon!', 'info');
}

// Initialize tool modals
function initializeToolModals() {
    // Debt AI form handler
    document.getElementById('debtAnalysisForm').addEventListener('submit', function(e) {
        e.preventDefault();
        analyzeDebt();
    });
}

// Analyze debt
async function analyzeDebt() {
    const income = parseFloat(document.getElementById('monthlyIncome').value);
    const expenses = parseFloat(document.getElementById('monthlyExpenses').value);
    const debt = parseFloat(document.getElementById('currentDebt').value);
    const investment = parseFloat(document.getElementById('careerInvestment').value);
    
    if (!income || !expenses || !debt || !investment) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    if (income <= expenses) {
        showAlert('Your expenses should be less than your income for a viable plan', 'danger');
        return;
    }
    
    // Show loading
    const resultSection = document.getElementById('debtAnalysisResult');
    resultSection.style.display = 'block';
    resultSection.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Analyzing...</span>
            </div>
            <p class="mt-3">Creating your personalized financial plan...</p>
        </div>
    `;
    
    // Simulate AI analysis
    setTimeout(() => {
        const analysisResult = generateDebtAnalysis(income, expenses, debt, investment);
        resultSection.innerHTML = analysisResult;
    }, 2000);
}

// Generate debt analysis
function generateDebtAnalysis(income, expenses, debt, investment) {
    const surplus = income - expenses;
    const debtPayoffTime = Math.ceil(debt / (surplus * 0.7));
    const investmentTime = Math.ceil(investment / (surplus * 0.3));
    
    return `
        <div class="mt-4">
            <div class="alert alert-info">
                <i class="fas fa-lightbulb me-2"></i>
                AI-Generated Financial Plan
            </div>
            
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="text-success">₹${surplus.toFixed(2)}</h5>
                            <small>Monthly Surplus</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="text-primary">${debtPayoffTime} months</h5>
                            <small>Debt Payoff Time</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <h6 class="mb-3">Recommended Strategy</h6>
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card border-success">
                        <div class="card-header bg-success text-white">
                            <i class="fas fa-credit-card me-2"></i>Debt Payment
                        </div>
                        <div class="card-body">
                            <h5>₹${(surplus * 0.7).toFixed(2)}/month</h5>
                            <p class="mb-0">70% of surplus towards debt</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-primary">
                        <div class="card-header bg-primary text-white">
                            <i class="fas fa-graduation-cap me-2"></i>Career Investment
                        </div>
                        <div class="card-body">
                            <h5>₹${(surplus * 0.3).toFixed(2)}/month</h5>
                            <p class="mb-0">30% towards skill development</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="alert alert-warning">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>AI Recommendations</h6>
                <ul class="mb-0">
                    <li>Focus on high-interest debt first</li>
                    <li>Invest in skills that increase earning potential</li>
                    <li>Build an emergency fund of 3-6 months expenses</li>
                    <li>Review and adjust plan monthly</li>
                </ul>
            </div>
        </div>
    `;
}

// Add tool card animations
const style = document.createElement('style');
style.textContent = `
    .tool-card {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .tool-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.15);
    }
    
    .tool-icon {
        transition: transform 0.3s ease;
    }
    
    .tool-card:hover .tool-icon {
        transform: scale(1.1);
    }
    
    .analysis-result {
        animation: fadeInUp 0.5s ease;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);