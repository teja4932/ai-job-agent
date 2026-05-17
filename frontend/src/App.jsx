import { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Cpu, 
  Briefcase, 
  Search, 
  Link, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Terminal
} from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showResumeText, setShowResumeText] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);
  
  // Real Job Fetching State
  const [isFetchingJobs, setIsFetchingJobs] = useState(false);
  const [fetchedJobs, setFetchedJobs] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [visibleJobsCount, setVisibleJobsCount] = useState(6);
  
  // Smart Apply State
  const [resumeFilename, setResumeFilename] = useState(null);
  const [applyingJobLink, setApplyingJobLink] = useState(null);
  const [applyStatus, setApplyStatus] = useState('');
  
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a resume');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/resume/upload',
        formData
      );

      setText(response.data.extractedText);
      setSkills(
        response.data.skills
          ? response.data.skills.split(',')
          : []
      );
      setJobs(
        response.data.jobs
          ? response.data.jobs.split(',')
          : []
      );
      setResumeFilename(response.data.resumeFilename);
    } catch (error) {
      console.log(error);
      alert('Upload failed');
    } finally {
      setIsFetchingJobs(false);
    }
  };

  const handlePlatformClick = async (platformName) => {
    if (platformName === 'Indeed') {
      alert(`Integration with ${platformName} coming in the next phase!`);
      return;
    }

    const roleToSearch = jobs.length > 0 ? jobs[0] : 'Software Engineer';
    
    setSelectedPlatform(platformName);
    setIsFetchingJobs(true);
    setFetchedJobs([]); // clear previous jobs
    setVisibleJobsCount(6); // reset visible count
    
    // Smooth scroll to jobs section
    setTimeout(() => {
      document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const endpointName = platformName.toLowerCase();
      const response = await axios.get(`http://localhost:8000/api/jobs/${endpointName}?role=${encodeURIComponent(roleToSearch)}`);
      if (response.data && response.data.success) {
        setFetchedJobs(response.data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      alert("Failed to fetch jobs from " + platformName);
    } finally {
      setIsFetchingJobs(false);
    }
  };

  const handleSmartApply = async (job) => {
    if (job.platform !== 'Unstop') {
      alert(`Smart Apply for ${job.platform} is coming in the next phase!`);
      return;
    }
    
    setApplyingJobLink(job.link);
    setApplyStatus('Opening application...');
    
    // Simulate UI sequence while backend works
    const sequence = [
      { text: 'Opening application...', delay: 2000 },
      { text: 'Filling basic details...', delay: 5000 },
      { text: 'Uploading resume...', delay: 8000 },
      { text: 'Ready for final review!', delay: 12000 }
    ];
    
    sequence.forEach(({ text, delay }) => {
      setTimeout(() => {
        setApplyingJobLink(current => {
          if (current === job.link) setApplyStatus(text);
          return current;
        });
      }, delay);
    });

    try {
      const userData = { name: "Sai Teja", email: "example@gmail.com", phone: "9876543210" };
      await axios.post('http://localhost:8000/api/apply/unstop', {
        jobLink: job.link,
        resumeFilename,
        userData
      });
      
      // Backend finishes opening browser and preparing it
      setApplyStatus('Application ready. Check opened browser window!');
    } catch (error) {
      console.error(error);
      setApplyStatus('Failed to start Smart Apply. Please try again.');
    }
  };

  const platforms = [
    { name: 'LinkedIn', icon: <Link className="w-5 h-5" />, color: 'bg-[#0077B5]' },
    { name: 'Unstop', icon: <Globe className="w-5 h-5" />, color: 'bg-[#1C2024]' },
    { name: 'Internshala', icon: <Briefcase className="w-5 h-5" />, color: 'bg-[#00A5EC]' },
    { name: 'Naukri', icon: <Search className="w-5 h-5" />, color: 'bg-[#2D3E50]' },
    { name: 'Indeed', icon: <ExternalLink className="w-5 h-5" />, color: 'bg-[#2164f3]' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      <main className="relative max-w-6xl mx-auto px-6 py-12 space-y-16">
        
        {/* 1. Hero Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4 animate-pulse" />
            AI-Powered Career Automation
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight">
            AI <span className="text-gradient">Job Agent</span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            Supercharge your job search with AI Skill Extraction and Automated Applications.
          </p>
        </motion.header>

        {/* 2. Upload Section */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <div 
            className={cn(
              "glass-card p-10 rounded-3xl border-2 border-dashed transition-all duration-300 group cursor-pointer",
              file ? "border-blue-500/50 bg-blue-500/5" : "border-slate-800 hover:border-slate-700"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {file ? file.name : "Upload your Resume"}
                </h3>
                <p className="text-slate-500 mt-1">
                  Drag and drop your PDF here or click to browse
                </p>
              </div>
              {file && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={isUploading}
                  className="mt-4 px-8 py-3 rounded-xl premium-gradient text-white font-bold shadow-lg shadow-blue-500/25 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-5 h-5" />
                      Process with AI
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {(skills.length > 0 || jobs.length > 0) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              
              {/* 3. Extracted Skills Section */}
              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">Extracted Skills</h2>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium hover:bg-slate-700 hover:border-blue-500/50 transition-colors cursor-default"
                    >
                      {skill.trim()}
                    </motion.span>
                  ))}
                </div>
              </motion.section>

              {/* 4. AI Recommended Roles Section */}
              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">Recommended Roles</h2>
                </div>
                <div className="space-y-3">
                  {(showAllJobs ? jobs : jobs.slice(0, 6)).map((job, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-4 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-lg">{job.trim()}</span>
                      </div>
                      <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </motion.div>
                  ))}
                  {jobs.length > 6 && (
                    <button
                      onClick={() => setShowAllJobs(!showAllJobs)}
                      className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      {showAllJobs ? (
                        <>Show Less <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>See More Roles ({jobs.length - 6} more) <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              </motion.section>

            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Platform Buttons Section */}
        <section className="space-y-8 pt-8">
          <h2 className="text-3xl font-bold text-center">Available Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {platforms.map((platform, i) => (
              <motion.button
                key={i}
                onClick={() => handlePlatformClick(platform.name)}
                whileHover={{ y: -5 }}
                className={cn(
                  "glass-card p-6 rounded-2xl flex flex-col items-center gap-4 hover:border-slate-600 transition-all group",
                  selectedPlatform === platform.name ? "border-blue-500/50 bg-blue-500/10" : ""
                )}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", platform.color)}>
                  {platform.icon}
                </div>
                <span className="font-medium text-slate-400 group-hover:text-white transition-colors">
                  {platform.name}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* 6. Jobs Display Section (Real / Mock / Loaders) */}
        <section id="jobs-section" className="space-y-8 min-h-[400px]">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">
              {selectedPlatform ? `${selectedPlatform} Opportunities` : "Featured Opportunities"}
            </h2>
            <div className="px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-400">
              Showing matches based on AI profile
            </div>
          </div>
          
          {isFetchingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <div key={i} className="glass-card overflow-hidden rounded-2xl p-6 h-full flex flex-col gap-4 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80"></div>
                    <div className="w-20 h-6 rounded-full bg-slate-800/80"></div>
                  </div>
                  <div className="space-y-3 mt-2">
                    <div className="h-6 bg-slate-800/80 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-800/80 rounded w-1/2"></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 w-16 bg-slate-800/80 rounded"></div>
                    <div className="h-6 w-16 bg-slate-800/80 rounded"></div>
                  </div>
                  <div className="mt-auto pt-6">
                    <div className="h-12 w-full bg-slate-800/80 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : fetchedJobs.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fetchedJobs.slice(0, visibleJobsCount).map((job, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="glass-card overflow-hidden rounded-2xl flex flex-col h-full group hover:border-blue-500/30 transition-all duration-300"
                  >
                    <div className="p-6 space-y-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          {job.matchPercentage || (95 - i * 2)}% Match
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1 line-clamp-2">{job.title}</h3>
                        <p className="text-slate-400 text-sm line-clamp-1">{job.company}</p>
                        <p className="text-slate-500 text-xs mt-1">{job.location}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded bg-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                          {job.salary && job.salary !== 'Not Disclosed' ? job.salary : 'Salary Undisclosed'}
                        </span>
                        <span className="px-2 py-1 rounded bg-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                          {job.platform}
                        </span>
                      </div>
                    </div>
                  <div className="p-6 pt-0 flex gap-3">
                    <button 
                      onClick={() => handleSmartApply(job)}
                      className="flex-1 py-3 rounded-xl bg-blue-600 font-bold hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20"
                    >
                      Smart Apply ⚡
                    </button>
                    <a 
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 font-bold hover:bg-slate-700 hover:border-blue-500/50 hover:text-white transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      Manual
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  </motion.div>
                ))}
              </div>
              
              {visibleJobsCount < fetchedJobs.length && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center pt-4"
                >
                  <button 
                    onClick={() => setVisibleJobsCount(prev => prev + 6)}
                    className="px-8 py-3 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 font-bold hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                  >
                    See More Jobs
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((_, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="glass-card overflow-hidden rounded-2xl flex flex-col h-full group"
                >
                  <div className="p-6 space-y-4 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        {95 - i * 5}% Match
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Senior AI Engineer</h3>
                      <p className="text-slate-400 text-sm">Tech Innovators Corp • San Francisco</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded bg-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">Full Time</span>
                      <span className="px-2 py-1 rounded bg-slate-800 text-[10px] uppercase tracking-wider font-bold text-slate-500">Remote</span>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <button className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                      Open Position
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* 7. ATS Score Section */}
        {text && (
          <section className="pt-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-8 border border-slate-800 flex flex-col items-center justify-center max-w-md mx-auto"
            >
              {(() => {
                const score = Math.min(9.8, (7.0 + (skills.length * 0.15))).toFixed(1);
                const radius = 70;
                const stroke = 12;
                const normalizedRadius = radius - stroke * 2;
                const circumference = normalizedRadius * 2 * Math.PI;
                const strokeDashoffset = circumference - (score / 10) * circumference;

                return (
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative flex items-center justify-center">
                      <svg
                        height={radius * 2}
                        width={radius * 2}
                        className="transform -rotate-90 drop-shadow-2xl"
                      >
                        {/* Background circle */}
                        <circle
                          stroke="rgba(59, 130, 246, 0.1)"
                          fill="transparent"
                          strokeWidth={stroke}
                          r={normalizedRadius}
                          cx={radius}
                          cy={radius}
                        />
                        {/* Progress circle */}
                        <motion.circle
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          stroke="url(#ats-gradient)"
                          fill="transparent"
                          strokeWidth={stroke}
                          strokeDasharray={circumference + ' ' + circumference}
                          strokeLinecap="round"
                          r={normalizedRadius}
                          cx={radius}
                          cy={radius}
                        />
                        <defs>
                          <linearGradient id="ats-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                          {score}
                        </div>
                        <span className="text-sm font-medium text-slate-500">out of 10</span>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        ATS Resume Score
                      </h3>
                      <p className="text-sm text-slate-400 max-w-[250px]">
                        Your resume is highly optimized for AI Applicant Tracking Systems.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </section>
        )}

        {/* Smart Apply Overlay */}
        <AnimatePresence>
          {applyingJobLink && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
            >
              <div className="glass-card p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                <h3 className="text-2xl font-bold">Smart Apply Assistant</h3>
                <p className="text-blue-400 font-medium animate-pulse text-lg">{applyStatus}</p>
                {applyStatus.includes('Ready') || applyStatus.includes('ready') || applyStatus.includes('Failed') ? (
                  <button 
                    onClick={() => setApplyingJobLink(null)}
                    className="w-full py-3 rounded-xl bg-blue-600 font-bold hover:bg-blue-500 transition-colors mt-4"
                  >
                    Close & Review
                  </button>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>&copy; 2026 AI Job Agent. Built with precision and intelligence.</p>
      </footer>
    </div>
  );
}

export default App;