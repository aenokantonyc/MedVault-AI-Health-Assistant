import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit2, Shield, Heart, Activity } from 'lucide-react';

const Profile = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="h-32 bg-gradient-to-r from-primary-blue to-primary-cyan relative">
          <button className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2 rounded-xl transition-colors">
            <Edit2 size={18} />
          </button>
        </div>
        <div className="px-8 pb-8 relative">
          <div className="absolute -top-16 left-8">
            <div className="relative">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" 
                alt="Profile" 
                className="w-32 h-32 rounded-full border-4 border-white bg-primary-light"
              />
              <button className="absolute bottom-0 right-0 bg-primary-blue text-white p-2 rounded-full border-2 border-white hover:bg-blue-700 transition-colors">
                <Camera size={16} />
              </button>
            </div>
          </div>
          <div className="mt-20 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Alex Johnson</h1>
              <p className="text-text-secondary">Patient ID: #CL-10928</p>
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <Shield size={16} /> Privacy
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Info */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          <div className="card-container p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text-primary">Personal Information</h3>
              <button className="text-primary-blue hover:underline text-sm font-medium">Edit</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-text-secondary font-medium">Full Name</label>
                <p className="text-text-primary font-medium mt-1 border-b border-gray-100 pb-2">Alex Johnson</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Email Address</label>
                <p className="text-text-primary font-medium mt-1 border-b border-gray-100 pb-2">alex.j@example.com</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Phone Number</label>
                <p className="text-text-primary font-medium mt-1 border-b border-gray-100 pb-2">+1 (555) 000-0000</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Date of Birth</label>
                <p className="text-text-primary font-medium mt-1 border-b border-gray-100 pb-2">March 15, 1990</p>
              </div>
            </div>
          </div>

          <div className="card-container p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-text-primary">Emergency Contact</h3>
              <button className="text-primary-blue hover:underline text-sm font-medium">Edit</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-text-secondary font-medium">Contact Name</label>
                <p className="text-text-primary font-medium mt-1">Sarah Johnson (Spouse)</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium">Phone Number</label>
                <p className="text-text-primary font-medium mt-1">+1 (555) 111-2222</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Medical Summary */}
        <motion.div variants={itemVariants} className="md:col-span-1 space-y-6">
          <div className="card-container p-6">
            <h3 className="text-lg font-bold text-text-primary mb-6">Medical Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <Heart size={20} className="text-red-500" />
                <div>
                  <p className="text-xs text-red-500 font-semibold">Blood Group</p>
                  <p className="text-lg font-bold text-red-700">O+</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <Activity size={20} className="text-blue-500" />
                <div>
                  <p className="text-xs text-blue-500 font-semibold">Weight / Height</p>
                  <p className="text-lg font-bold text-blue-700">72 kg / 175 cm</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-bold text-text-primary mb-3">Allergies</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-text-secondary text-xs rounded-full font-medium">Penicillin</span>
                <span className="px-3 py-1 bg-gray-100 text-text-secondary text-xs rounded-full font-medium">Peanuts</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-bold text-text-primary mb-3">Chronic Conditions</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-light text-primary-blue text-xs rounded-full font-medium">None Reported</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
