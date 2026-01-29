import React from 'react';
import { Sparkles } from 'lucide-react';

function CopilotPage() {
  return (
    <div className="copilot-page" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* <div className="copilot-page-header">
        <Sparkles size={20} />
        <h3>AI Copilot</h3>
      </div> */}
      
      <iframe
        src="https://bot.saple.ai/c714f67a-7a32-4c05-92f6-2c288504c653/c480dae5-8369-4283-9ca2-3615ed64716b"
        title="AI Copilot Assistant"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          backgroundColor: 'white'
        }}
        frameBorder="0"
        allow="microphone; camera"
        allowFullScreen
      />
    </div>
  );
}

export default CopilotPage;

// import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Sparkles, ArrowLeft } from 'lucide-react';
// import './CopilotPage.css';

// function CopilotPage() {
//   const navigate = useNavigate();

//   // Add escape key handler to go back
//   useEffect(() => {
//     const handleEscapeKey = (event) => {
//       if (event.key === 'Escape') {
//         navigate(-1);
//       }
//     };

//     document.addEventListener('keydown', handleEscapeKey);
//     return () => {
//       document.removeEventListener('keydown', handleEscapeKey);
//     };
//   }, [navigate]);

//   return (
//     <div className="copilot-page">

//       <div className="copilot-container">
//         <div className="copilot-frame-container">
//           <iframe
//             src="https://bot.saple.ai/c714f67a-7a32-4c05-92f6-2c288504c653/c480dae5-8369-4283-9ca2-3615ed64716b"
//             title="AI Copilot Assistant"
//             className="copilot-iframe"
//             frameBorder="0"
//             allow="microphone; camera"
//             allowFullScreen
//           />
//         </div>
        
//         {/* <div className="copilot-sidebar">
//           <div className="sidebar-section">
//             <h3>Quick Actions</h3>
//             <div className="action-buttons">
//               <button className="action-btn">
//                 <span>Analyze Contract</span>
//               </button>
//               <button className="action-btn">
//                 <span>Check Compliance</span>
//               </button>
//               <button className="action-btn">
//                 <span>Generate Report</span>
//               </button>
//               <button className="action-btn">
//                 <span>Risk Assessment</span>
//               </button>
//             </div>
//           </div>
          
//           <div className="sidebar-section">
//             <h3>Recent Queries</h3>
//             <div className="recent-queries">
//               <div className="query-item">
//                 <span>Extract financial terms from PDF</span>
//                 <span className="query-time">2 min ago</span>
//               </div>
//               <div className="query-item">
//                 <span>Check grant compliance requirements</span>
//                 <span className="query-time">15 min ago</span>
//               </div>
//               <div className="query-item">
//                 <span>Generate risk assessment report</span>
//                 <span className="query-time">1 hour ago</span>
//               </div>
//             </div>
//           </div>
//         </div> */}
//       </div>
//     </div>
//   );
// }

// export default CopilotPage;