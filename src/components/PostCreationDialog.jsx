import React, { Suspense, lazy } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import FullPageLoader from './ui/FullPageLoader';

// Lazy load the create pages for better performance
const CreateJobOpportunity = lazy(() => import('../pages/CreateJobOpportunity'));
const CreateMomentPage = lazy(() => import('../pages/CreateMomentPage'));
const CreateNeedPage = lazy(() => import('../pages/CreateNeedPage'));
const CreateEventPage = lazy(() => import('../pages/CreateEventPage'));
const CreateProductPage = lazy(() => import('../pages/CreateProductPage'));
const CreateServicePage = lazy(() => import('../pages/CreateServicePage'));
const CrowdfundForm = lazy(() => import('../components/CrowdfundForm'));
const CreateTourismPage = lazy(() => import('../pages/CreateTourismPostPage'));

export default function PostCreationDialog({ isOpen, onClose, postType, from, hideHeader = false,onBack }) {
  if (!isOpen || !postType) return null;

  const renderForm = () => {
    if (postType.label == 'Share a Job Opening' || postType.label == 'Share a job opening') {
      return <CreateJobOpportunity triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if ( postType.label == 'Highlight an opportunity' || postType.label == 'Highlight a tourism attraction' || postType.label == 'Highlight a tourist Attraction' ||  postType.label == 'Highlight a career progress' || postType.label == 'Share an experience' || postType.label == 'Highlight an event' || postType.label == 'Highlight a product' || postType.label == 'Highlight a service' || postType.label == 'Share tourism experiences' || postType.label == 'Highlight a funding opportunity' || postType.label == 'Highlight a Product' || postType.label == 'Highlight a Service ' || postType.label == 'Share a Tourism Experience' || postType.label == 'Highlight an Opportunity' || postType.label == 'Highlight a Funding Opportunity') {
      return <CreateMomentPage type={
        postType.label == 'Highlight an event' ? 'event' :
        postType.label == 'Highlight a product' ? 'product' :
        postType.label == 'Highlight a Product' ? 'product' :
        postType.label == 'Highlight a service' ? 'service' :
        postType.label == 'Highlight a Service ' ? 'service' :
        postType.label == 'Share tourism experiences' ? 'tourism' :
        postType.label == 'Share a Tourism Experience' ? 'tourism' :
        postType.label == 'Highlight a funding opportunity' ? 'funding' :
        postType.label == 'Highlight a Funding Opportunity' ? 'funding' :
        postType.label == 'Highlight an Opportunity' ? 'funding' : (postType.from || from)
      } triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader}
        onSuccess={onClose} />;
    } else if (postType.label == 'Find Jobs' || postType.label == 'Find jobs' || postType.label == 'Find events' || postType.label == 'Find Products' || postType.label == 'Find Services' || postType.label == 'Explore tourism attractions' || postType.label == 'Explore funding opportunities' || postType.label == 'Find products' || postType.label == 'Find Services' || postType.label == 'Explore Tourism Attractions' || postType.label == 'Explore funding opportunities') {
      return <CreateNeedPage type={
        postType.label == 'Find Jobs' ? 'job' :
        postType.label == 'Find jobs' ? 'job' :
        postType.label == 'Find events' ? 'event' :
        postType.label == 'Find Products' ? 'product' :
        postType.label == 'Find products' ? 'product' :
        postType.label == 'Find Services' ? 'service' :
        postType.label == 'Find Services' ? 'service' :
        postType.label == 'Explore funding opportunities' ? 'funding' :
        postType.label == 'Explore funding opportunities' ? 'funding' :
        postType.label == 'Explore tourism attractions' ? 'tourism' :
        postType.label == 'Explore Tourism Attractions' ? 'tourism' : (postType.from || from)
      } triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label == 'Host an Event' || postType.label == 'Host an event') {
      return <CreateEventPage type={postType.from || from} triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label == 'Add a New Product' || postType.label == 'Add new product') {
      return <CreateProductPage triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label == 'Add a New Service' || postType.label == 'Add new service') {
      return <CreateServicePage triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label=="Post a Tourism Attraction" ||  postType.label == 'Post a tourism attraction' || postType.label == '_Share a Tourism Activity') {
      return <CreateTourismPage triggerImageSelection={postType.triggerImageSelection} hideHeader={hideHeader} onSuccess={onClose} />;
    } else if (postType.label == 'Publish an Opportunity' || postType.label == 'Publish an opportunity') {
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
          <div className="flex items-center gap-3">
            {/* Go Back Button */}
            {onBack && (
              <button
                onClick={onBack}
                className="text-white hover:text-brand-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="text-white font-medium">{postType.label}</div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-brand-100 transition-colors"
            aria-label="Close"
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