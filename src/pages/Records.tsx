import React from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Search, Filter, Download, MoreVertical } from 'lucide-react';

const Records = () => {
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
          <h2 className="text-2xl font-bold text-text-primary">Medical Records</h2>
          <p className="text-text-secondary text-sm">Manage and view your health reports</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <UploadCloud size={18} />
          Upload Report
        </button>
      </div>

      {/* Upload Zone */}
      <motion.div variants={itemVariants} className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer group">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-primary-blue mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud size={32} />
        </div>
        <h3 className="font-semibold text-text-primary mb-1">Click or drag and drop to upload</h3>
        <p className="text-sm text-text-secondary">PDF, JPG, PNG (Max 10MB)</p>
      </motion.div>

      {/* Filters & Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search records..." className="input-field pl-10 bg-white" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-text-secondary hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </motion.div>

      {/* Records Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Complete Blood Count', date: 'Oct 15, 2023', category: 'Pathology', type: 'PDF' },
          { title: 'X-Ray Chest PA View', date: 'Oct 10, 2023', category: 'Radiology', type: 'IMAGE' },
          { title: 'Prescription - Dr. Smith', date: 'Sep 28, 2023', category: 'Prescription', type: 'PDF' },
          { title: 'Lipid Profile', date: 'Sep 15, 2023', category: 'Pathology', type: 'PDF' },
          { title: 'MRI Scan Brain', date: 'Aug 22, 2023', category: 'Radiology', type: 'IMAGE' },
          { title: 'Vaccination Certificate', date: 'Jan 10, 2023', category: 'General', type: 'PDF' },
        ].map((record, i) => (
          <div key={i} className="card-container p-5 flex flex-col group border border-transparent hover:border-primary-light">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-primary-blue">
                <FileText size={24} />
              </div>
              <button className="p-1 text-gray-400 hover:text-text-primary transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold text-text-primary truncate">{record.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-text-secondary">{record.date}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="text-xs font-medium text-primary-blue">{record.category}</span>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded-md text-text-secondary">{record.type}</span>
              <button className="flex items-center gap-1 text-sm font-medium text-primary-blue hover:text-blue-700 transition-colors">
                <Download size={16} /> Download
              </button>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Records;
