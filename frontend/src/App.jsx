import { useState } from 'react';
import axios from 'axios';

function App() {

  const [file, setFile] = useState(null);

  const [text, setText] = useState('');

  const [skills, setSkills] = useState([]);

  const [jobs, setJobs] = useState([]);

  const handleUpload = async () => {

    if (!file) {
      alert('Please select a resume');
      return;
    }

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

    } catch (error) {

      console.log(error);

      alert('Upload failed');
    }
  };

  return (

    <div style={{
      padding: '40px',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: 'white'
    }}>

      <h1 style={{
        fontSize: '50px',
        textAlign: 'center'
      }}>
        AI Job Agent
      </h1>

      <div style={{ textAlign: 'center' }}>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <br /><br />

        <button onClick={handleUpload}>
          Upload Resume
        </button>
      </div>

      <br /><br />

      <h2>Extracted Skills</h2>

      <div
        style={{
          background: '#1e293b',
          padding: '20px',
          borderRadius: '10px',
          width: '800px'
        }}
      >
        {skills.map((skill, index) => (

          <span
            key={index}
            style={{
              display: 'inline-block',
              background: '#3b82f6',
              padding: '8px 12px',
              margin: '5px',
              borderRadius: '20px'
            }}
          >
            {skill}
          </span>
        ))}
      </div>

      <br /><br />

      <h2>Recommended Jobs</h2>

      <div
        style={{
          background: '#1e293b',
          padding: '20px',
          borderRadius: '10px',
          width: '800px'
        }}
      >
        {jobs.map((job, index) => (

          <div
            key={index}
            style={{
              background: '#10b981',
              padding: '12px',
              margin: '10px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}
          >
            {job}
          </div>
        ))}
      </div>

      <br /><br />

      <h2>Resume Text</h2>

      <textarea
        rows="20"
        cols="100"
        value={text}
        readOnly
      />

    </div>
  );
}

export default App;