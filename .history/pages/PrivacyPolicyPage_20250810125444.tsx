
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in p-4 sm:p-6 lg:p-8">
      <ReactRouterDOM.Link to="/" className="flex items-center gap-2 mb-6 text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Events
       </ReactRouterDOM.Link>
      <div className="bg-surface rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-4 text-on-surface">Privacy & Policy</h1>
        <div className="space-y-4 text-on-surface-secondary">
          <p>
            WE DO NOT OFFER ANY CANCELLATION OR REFUND POLICY. ALL SALES ARE FINAL.
            THIS WEBSITE IS OPERATED BY PATHURI SAI PRADEEP CHAND .
            </p>
            <p>
            The content for the Privacy & Policy page will be added here soon. 
            Please check back later for updates on how we handle your data, your rights, and our terms of service.
          </p>
          <p>
            For now, please be assured that we are committed to protecting your privacy. We collect minimal information necessary to provide our services, such as your name and email for booking tickets. 
            We do not share your personal information with third parties without your consent, except as required by law.
          </p>
          <h2 className="text-2xl font-semibold text-on-surface pt-4">Terms and Conditions</h2>
          <p>
            THIS WEBSITE IS OPERATED BY PATHURI SAI PRADEEP CHAND <a href="mailto:kothadhakshin123@gmail.com" className="text-primary hover:underline">CONTACT ME</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
