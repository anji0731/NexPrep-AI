import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white py-6 border-t border-[#ECECEC] text-center mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
        <div>
          © 2026 NexPrep AI. All Rights Reserved.
        </div>
        <div>
          Developed by{' '}
          <a
            href="https://www.linkedin.com/in/srianjaneyulu0731/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-bold hover:underline transition-all"
          >
            Sripalasetti Sri Anjaneyulu
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
