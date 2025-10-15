import React, { Suspense, lazy } from 'react';
import { X } from 'lucide-react';
import FullPageLoader from './ui/FullPageLoader';

// Lazy load the create pages for better performance
const CreateJobOpportunity = lazy(() => import('../pages/CreateJobOpportunity'));
const CreateMomentPage = lazy(() => import('../pages/CreateMomentPage'));
const CreateNeedPage = lazy(() => import('../pages/CreateNeedPage'));
const CreateEventPage = lazy(() => import('../pages/CreateEventPage'));
const CreateProductPage = lazy(() => import('../pages/CreateProductPage'));
const CreateServicePage = lazy(() => import('../pages/CreateServicePage'));
const CrowdfundForm = lazy(() => import('../components/CrowdfundForm'));

export default function PostCreationDialog({ isOpen, onClose, postType, from, hideHeader = false }) {
  if (!isOpen || !postType) return null;

  const renderForm = () => {
    if (postType.label === 'Post Job Opportunity') {
      return <CreateJobOpportunity triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label === 'Share Job Experience' || postType.label === 'Share Event Experience' || postType.label === 'Share Your Experience' || postType.label === 'Share Service Experience' || postType.label === 'Share Tourism Experience') {
      return <CreateMomentPage type={
        postType.label === 'Share Event Experience' ? 'event' :
        postType.label === 'Share Your Experience' ? 'product' :
        postType.label === 'Share Service Experience' ? 'service' :
        postType.label === 'Share Tourism Experience' ? 'tourism' : (postType.from || from)
      } triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} 
        onSuccess={onClose} />;
    } else if (postType.label === 'Search for a job' || postType.label === 'Ask About an Event' || postType.label === 'Search for a Product' || postType.label === 'Ask About a Service' || postType.label === 'Ask About Tourism') {
      return <CreateNeedPage type={
        postType.label === 'Search for a job' ? 'job' :
        postType.label === 'Ask About an Event' ? 'event' :
        postType.label === 'Search for a Product' ? 'product' :
        postType.label === 'Ask About a Service' ? 'service' :
        postType.label === 'Ask About Funding' ? 'service' :
        postType.label === 'Ask About Tourism' ? 'tourism' : (postType.from || from)
      } triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label === 'Create Event') {
      return <CreateEventPage type={postType.from || from} triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label === 'Sell a product') {
      return <CreateProductPage triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label === 'Create Service') {
      return <CreateServicePage triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label === 'Create Funding') {
      return <CrowdfundForm triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else {
      return <div className="p-6 text-center text-gray-600">Form not available for this post type</div>;
    }
  };

  return (
    <div className="fixed z-[99] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white z-[99] w-full max-w-2xl mx-4 rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden relative">
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-center flex-shrink-0">
          <div className="text-white font-medium">{postType.label}</div>
          <button
            onClick={onClose}
            className="text-white hover:text-brand-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<FullPageLoader message="Loading form..." />}>
            {renderForm()}
          </Suspense>
        </div>
      </div>
    </div>
  );
}