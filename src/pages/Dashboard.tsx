import React from 'react';
import { motion } from 'framer-motion';
import { Pill, FileText, Activity, ArrowRight, HeartPulse, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-primary-blue to-primary-cyan rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Your health is looking great!</h2>
            <p className="text-blue-100 max-w-md">Keep up the good work. Your AI health score has improved by 5% this week.</p>
          </div>
          <button 
            onClick={() => navigate('/assistant')}
            className="bg-white text-primary-blue px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <Sparkles size={20} className="text-primary-blue" />
            Chat with AI Assistant
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active Reminders', value: '3', icon: Pill, color: 'text-orange-500', bg: 'bg-orange-100' },
          { title: 'Uploaded Reports', value: '12', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
          { title: 'Prescriptions', value: '2', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-100' },
          { title: 'AI Health Score', value: '94/100', icon: HeartPulse, color: 'text-green-500', bg: 'bg-green-100' },
        ].map((stat, index) => (
          <div key={index} className="card-container p-6 flex items-center gap-4 group cursor-pointer">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-text-primary">{stat.value}</h3>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reminders Section */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-primary">Today's Medicines</h3>
            <button onClick={() => navigate('/reminders')} className="text-primary-blue text-sm font-medium hover:underline flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="card-container p-4 space-y-4">
            {[
              { time: '08:00 AM', name: 'Vitamin C', dosage: '1 Pill', status: 'taken' },
              { time: '02:00 PM', name: 'Amoxicillin', dosage: '2 Pills', status: 'pending' },
              { time: '08:00 PM', name: 'Omega 3', dosage: '1 Capsule', status: 'pending' },
            ].map((med, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-bg transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${med.status === 'taken' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <div>
                    <h4 className="font-semibold text-text-primary">{med.name}</h4>
                    <p className="text-xs text-text-secondary">{med.time} • {med.dosage}</p>
                  </div>
                </div>
                <button className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${med.status === 'taken' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                  {med.status === 'taken' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Reports Section */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-primary">Recent Reports</h3>
            <button onClick={() => navigate('/records')} className="text-primary-blue text-sm font-medium hover:underline flex items-center">
              View All <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Complete Blood Count', date: 'Oct 15, 2023', type: 'PDF' },
              { title: 'X-Ray Chest PA View', date: 'Oct 10, 2023', type: 'IMAGE' },
            ].map((report, i) => (
              <div key={i} className="card-container p-4 flex flex-col justify-between h-32 group border border-transparent hover:border-primary-light">
                <div className="flex justify-between items-start">
                  <div className="bg-primary-light text-primary-blue p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded-md text-text-secondary">{report.type}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary truncate">{report.title}</h4>
                  <p className="text-xs text-text-secondary">{report.date}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
