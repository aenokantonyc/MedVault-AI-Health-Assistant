import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Bell, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';

const Reminders = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Medicine Reminders</h2>
          <p className="text-text-secondary text-sm">Stay on track with your medication schedule</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Reminder
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Schedule */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <div>
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary-blue" />
              Today, Oct 24
            </h3>
            <div className="space-y-4">
              {[
                { time: '08:00 AM', name: 'Vitamin C', dosage: '1 Pill', meal: 'After Breakfast', status: 'taken', color: 'bg-orange-500' },
                { time: '02:00 PM', name: 'Amoxicillin', dosage: '2 Pills', meal: 'After Lunch', status: 'pending', color: 'bg-blue-500' },
                { time: '08:00 PM', name: 'Omega 3', dosage: '1 Capsule', meal: 'Before Dinner', status: 'pending', color: 'bg-purple-500' },
              ].map((med, i) => (
                <div key={i} className={`card-container p-5 flex items-center justify-between border-l-4 ${med.status === 'taken' ? 'border-green-500 opacity-70' : 'border-primary-blue'}`}>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-center justify-center min-w-[80px]">
                      <span className="text-lg font-bold text-text-primary">{med.time.split(' ')[0]}</span>
                      <span className="text-xs text-text-secondary">{med.time.split(' ')[1]}</span>
                    </div>
                    <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
                    <div>
                      <h4 className={`font-bold text-lg ${med.status === 'taken' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{med.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-medium text-primary-blue bg-primary-light px-2 py-0.5 rounded-md">{med.dosage}</span>
                        <span className="text-xs text-text-secondary flex items-center gap-1"><Clock size={12}/> {med.meal}</span>
                      </div>
                    </div>
                  </div>
                  <button className="flex-shrink-0">
                    {med.status === 'taken' ? (
                      <CheckCircle2 size={32} className="text-green-500" />
                    ) : (
                      <Circle size={32} className="text-gray-300 hover:text-primary-blue transition-colors" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column - Weekly Progress */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          <div className="card-container p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Weekly Adherence</h3>
                <p className="text-sm text-text-secondary">You're doing great!</p>
              </div>
            </div>
            
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeDasharray="85, 100"
                  className="animate-[dash_1.5s_ease-out]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary-blue">85%</span>
                <span className="text-xs text-text-secondary">taken on time</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Mon</span>
                <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-full"></div>
                </div>
                <span className="font-medium text-text-primary">100%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Tue</span>
                <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[60%]"></div>
                </div>
                <span className="font-medium text-text-primary">60%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Wed</span>
                <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[100%]"></div>
                </div>
                <span className="font-medium text-text-primary">100%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Reminders;
