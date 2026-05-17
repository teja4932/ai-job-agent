const fs = require('fs');
const path = require('path');

const files = ['jobSearch.js', 'internshalaSearch.js', 'naukriSearch.js', 'linkedinSearch.js'];

files.forEach(file => {
  const p = path.join(__dirname, file);
  let content = fs.readFileSync(p, 'utf8');

  // Change limits from 6 to 20
  content = content.replace(/results\.length >= 6/g, 'results.length >= 20');
  content = content.replace(/jobs\.length < 6/g, 'jobs.length < 12');
  content = content.replace(/6 - jobs\.length/g, '12 - jobs.length');
  
  // Extract platform name for fallback links
  const platformMap = {
    'jobSearch.js': ['Unstop', 'https://unstop.com/jobs'],
    'internshalaSearch.js': ['Internshala', 'https://internshala.com/'],
    'naukriSearch.js': ['Naukri', 'https://www.naukri.com/'],
    'linkedinSearch.js': ['LinkedIn', 'https://www.linkedin.com/jobs']
  };
  const [pName, pLink] = platformMap[file];

  // Replace getFallbackJobs completely
  const newFallback = `const getFallbackJobs = (role) => {
  const defaultRole = (role && role.length > 3) ? role : 'Software Engineer';
  const companies = ['Tech Innovators India', 'Global Systems Inc.', 'NextGen Solutions', 'CloudScale Technologies', 'DataCorp', 'StartupHub', 'InnovateX', 'CyberShield', 'DataMinds', 'QuantumSoft', 'AeroCloud', 'DevStudio'];
  const locations = ['Bangalore', 'Remote', 'Hyderabad', 'Pune', 'Mumbai', 'Remote', 'Chennai', 'Delhi', 'Remote', 'Bangalore', 'Remote', 'Pune'];
  const levels = ['Senior', '', 'Associate', 'Lead', 'Junior', 'Staff', 'Principal', 'Consultant', 'Intern', '', 'Senior', 'Associate'];
  
  return Array.from({ length: 12 }, (_, i) => ({
    title: \`\${levels[i]} \${defaultRole}\`.trim(),
    company: companies[i],
    location: locations[i],
    salary: \`₹\${(8 + (i * 1.5))}L - ₹\${(12 + (i * 2))}L\`,
    link: '${pLink}',
    platform: '${pName}',
    matchPercentage: Math.floor(Math.random() * 10) + 85
  }));
};`;

  content = content.replace(/const getFallbackJobs = \(role\) => \{[\s\S]*?^};$/m, newFallback);
  fs.writeFileSync(p, content, 'utf8');
  console.log('Updated ' + file);
});
